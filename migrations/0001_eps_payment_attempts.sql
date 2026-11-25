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
