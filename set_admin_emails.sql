-- 1. 지정된 이메일을 가진 기존 사용자들을 관리자(ADMIN)로 격상
UPDATE public.profiles
SET role = 'ADMIN'
WHERE id IN (
    SELECT id 
    FROM auth.users 
    WHERE email IN ('hyperkh65@gmail.com', 'hyperkh@kakao.com')
);

-- 2. 앞으로 해당 이메일로 가입하는 사용자도 자동으로 관리자가 되도록 함수 수정
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    new_role TEXT DEFAULT 'USER';
BEGIN
    -- 특정 이메일인 경우 역할을 ADMIN으로 설정
    IF new.email IN ('hyperkh65@gmail.com', 'hyperkh@kakao.com') THEN
        new_role := 'ADMIN';
    END IF;

    INSERT INTO public.profiles (id, nickname, avatar_url, role, points)
    VALUES (
        new.id, 
        COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', '새로운 주민'),
        new.raw_user_meta_data->>'avatar_url',
        new_role,
        3500 -- 신규 가입 축하 포인트
    )
    ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;
    
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 확인 쿼리 (실행 후 결과 확인용)
-- SELECT p.nickname, p.role, u.email 
-- FROM public.profiles p 
-- JOIN auth.users u ON p.id = u.id 
-- WHERE u.email IN ('hyperkh65@gmail.com', 'hyperkh@kakao.com');
