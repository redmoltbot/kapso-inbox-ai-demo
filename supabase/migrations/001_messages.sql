CREATE TABLE IF NOT EXISTS messages (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id text      NOT NULL,
  from_number   text        NOT NULL,
  to_number     text        NOT NULL,
  body          text,
  direction     text        CHECK (direction IN ('inbound', 'outbound')),
  timestamp     timestamptz DEFAULT now(),
  raw           jsonb
);

CREATE INDEX IF NOT EXISTS messages_conversation_id_timestamp_idx
  ON messages (conversation_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS messages_timestamp_idx
  ON messages (timestamp DESC);

-- Enable Realtime on this table
ALTER publication supabase_realtime ADD TABLE messages;
