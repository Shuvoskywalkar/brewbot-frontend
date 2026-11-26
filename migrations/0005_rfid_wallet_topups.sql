ALTER TABLE public.rfid_users
  ADD COLUMN IF NOT EXISTS student_id text,
  ADD COLUMN IF NOT EXISTS wallet_balance_paisa integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.rfid_wallet_topups (
  merchant_transaction_id text PRIMARY KEY,
  customer_order_id text NOT NULL UNIQUE,
  result_token text NOT NULL UNIQUE,
  rfid_user_id uuid NOT NULL,
  device_id text NOT NULL,
  user_name text NOT NULL,
  amount_paisa integer NOT NULL CHECK (amount_paisa > 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'cancelled')),
  eps_transaction_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz,
  idempotency_key text NOT NULL UNIQUE,
  redirect_url text
);

CREATE INDEX IF NOT EXISTS rfid_wallet_topups_status_created_at_idx
  ON public.rfid_wallet_topups (status, created_at DESC);

CREATE INDEX IF NOT EXISTS rfid_wallet_topups_user_created_at_idx
  ON public.rfid_wallet_topups (rfid_user_id, created_at DESC);
