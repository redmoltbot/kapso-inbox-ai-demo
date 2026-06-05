import { NextRequest, NextResponse } from 'next/server'

const AUTH_USERNAME = process.env.INBOX_AUTH_USERNAME
const AUTH_PASSWORD = process.env.INBOX_AUTH_PASSWORD

function unauthorized() {
  return new NextResponse('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Kapso Inbox"',
    },
  })
}

function parseBasicAuth(header: string | null) {
  if (!header?.startsWith('Basic ')) return null

  try {
    const decoded = atob(header.slice('Basic '.length))
    const separatorIndex = decoded.indexOf(':')
    if (separatorIndex === -1) return null

    return {
      username: decoded.slice(0, separatorIndex),
      password: decoded.slice(separatorIndex + 1),
    }
  } catch {
    return null
  }
}

export function middleware(request: NextRequest) {
  if (!AUTH_USERNAME || !AUTH_PASSWORD) {
    console.error('[auth] Missing INBOX_AUTH_USERNAME or INBOX_AUTH_PASSWORD')
    return new NextResponse('Inbox authentication is not configured', { status: 500 })
  }

  const credentials = parseBasicAuth(request.headers.get('authorization'))

  if (
    credentials?.username !== AUTH_USERNAME ||
    credentials.password !== AUTH_PASSWORD
  ) {
    return unauthorized()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Protect the inbox UI and internal APIs, while leaving static assets and
     * the public inbound webhook outside Basic Auth.
     */
    '/((?!_next/static|_next/image|favicon.ico|api/webhook).*)',
  ],
}
