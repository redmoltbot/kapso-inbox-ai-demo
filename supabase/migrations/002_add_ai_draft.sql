ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS ai_draft      text,
  ADD COLUMN IF NOT EXISTS ragie_context text,
  ADD COLUMN IF NOT EXISTS ai_drafted_at timestamptz;
