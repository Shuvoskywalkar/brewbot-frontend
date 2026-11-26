ALTER TABLE public.rfid_users
  ADD COLUMN IF NOT EXISTS student_id text;

ALTER TABLE public.rfid_users
  DROP CONSTRAINT IF EXISTS rfid_users_device_id_card_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS rfid_users_active_device_card_key
  ON public.rfid_users (device_id, card_id)
  WHERE is_active = true;

INSERT INTO public.rfid_users (device_id, user_name, card_id, student_id, is_active, created_at, updated_at)
SELECT device_id, student_name, card_id, student_id, status <> 'rejected', created_at, updated_at
FROM public.rfid_registration_requests
ON CONFLICT DO NOTHING;

DROP TABLE IF EXISTS public.rfid_registration_requests;
