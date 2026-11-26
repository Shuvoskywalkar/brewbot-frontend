CREATE TABLE IF NOT EXISTS public.rfid_registration_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL,
  student_name text NOT NULL CHECK (length(trim(student_name)) BETWEEN 2 AND 120),
  student_id text NOT NULL CHECK (length(trim(student_id)) BETWEEN 1 AND 80),
  card_id text NOT NULL CHECK (length(trim(card_id)) BETWEEN 4 AND 64),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS rfid_registration_pending_card_idx
  ON public.rfid_registration_requests (device_id, lower(trim(card_id)))
  WHERE status = 'pending';
