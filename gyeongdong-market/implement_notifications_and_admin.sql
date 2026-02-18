-- 1. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own notifications" ON public.notifications;
CREATE POLICY "Users can manage own notifications" ON public.notifications
  FOR ALL USING (auth.uid() = user_id);

-- 2. Trigger Function for Keyword Matching (on new reviews)
CREATE OR REPLACE FUNCTION notify_keyword_match()
RETURNS TRIGGER AS $$
DECLARE
  keyword_row RECORD;
BEGIN
  -- Search for matching keywords in keyword_settings
  FOR keyword_row IN (
    SELECT user_id, keyword FROM public.keyword_settings
  ) LOOP
    -- Check if keyword matches new review text or shop name
    IF (NEW.text ILIKE '%' || keyword_row.keyword || '%') THEN
      INSERT INTO public.notifications (user_id, title, content, link)
      VALUES (
        keyword_row.user_id,
        '키워드 알림: ' || keyword_row.keyword,
        '설정한 키워드 "' || keyword_row.keyword || '"가 포함된 새 후기가 등록되었습니다!',
        '/shop/' || NEW.shop_id
      );
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Attach Trigger to Reviews Table
DROP TRIGGER IF EXISTS tr_keyword_notify ON public.reviews;
CREATE TRIGGER tr_keyword_notify
AFTER INSERT ON public.reviews
FOR EACH ROW EXECUTE FUNCTION notify_keyword_match();

-- 4. Admin RLS Policies (Fixing based on previous failure)
DROP POLICY IF EXISTS "Admins can see all verifications" ON public.owner_verifications;
CREATE POLICY "Admins can see all verifications" ON public.owner_verifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN'
    )
  );

DROP POLICY IF EXISTS "Admins can update verifications" ON public.owner_verifications;
CREATE POLICY "Admins can update verifications" ON public.owner_verifications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN'
    )
  );

DROP POLICY IF EXISTS "Admins can update profile roles" ON public.profiles;
CREATE POLICY "Admins can update profile roles" ON public.profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN'
    )
  );
