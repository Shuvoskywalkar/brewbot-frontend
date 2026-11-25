CREATE TABLE IF NOT EXISTS campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  headline text NOT NULL CHECK (length(trim(headline)) > 0),
  supporting_text text NOT NULL DEFAULT '',
  artwork_url text,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS campaigns_one_active_idx
  ON campaigns (is_active)
  WHERE is_active = true;

CREATE TABLE IF NOT EXISTS rfid_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL,
  user_name text NOT NULL CHECK (length(trim(user_name)) > 0),
  card_id text NOT NULL CHECK (length(trim(card_id)) > 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (device_id, card_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS rfid_users_device_name_idx
  ON rfid_users (device_id, lower(trim(user_name)))
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS rfid_users_device_active_idx
  ON rfid_users (device_id, is_active, created_at DESC);

CREATE TABLE IF NOT EXISTS payment_attempts (
  merchant_transaction_id text PRIMARY KEY,
  customer_order_id text NOT NULL UNIQUE,
  result_token text NOT NULL UNIQUE,
  product_id text NOT NULL,
  product_name text NOT NULL,
  device_id text,
  amount_paisa integer NOT NULL CHECK (amount_paisa > 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'cancelled')),
  eps_transaction_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz
);

CREATE INDEX IF NOT EXISTS payment_attempts_status_created_at_idx
  ON payment_attempts (status, created_at DESC);

CREATE INDEX IF NOT EXISTS payment_attempts_created_at_idx
  ON payment_attempts (created_at DESC);
