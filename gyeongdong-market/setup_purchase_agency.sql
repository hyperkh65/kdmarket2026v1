-- ============================================
-- 구매대행 시스템 데이터베이스 스키마
-- ============================================

-- 0. 상품 테이블 (참조를 위해 추가)
CREATE TABLE IF NOT EXISTS shop_products (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    shop_id TEXT REFERENCES shops(id),
    name TEXT NOT NULL,
    price INTEGER NOT NULL,
    unit TEXT,
    image_url TEXT,
    description TEXT,
    category TEXT,
    is_sold_out BOOLEAN DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1. 장바구니 테이블
CREATE TABLE IF NOT EXISTS cart_items (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    product_id uuid REFERENCES shop_products(id) ON DELETE CASCADE NOT NULL,
    quantity INTEGER DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, product_id)
);

-- 2. 주문 테이블
CREATE TABLE IF NOT EXISTS orders (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_number TEXT UNIQUE NOT NULL, -- 주문번호 (예: ORD-20260216-0001)
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- 주문 금액 정보
    subtotal INTEGER NOT NULL, -- 상품 총액
    service_fee INTEGER NOT NULL, -- 구매대행 수수료
    delivery_fee INTEGER DEFAULT 0, -- 배송비
    total_amount INTEGER NOT NULL, -- 최종 결제 금액
    
    -- 배송 정보
    delivery_method TEXT NOT NULL, -- 'direct', 'quick_motorcycle', 'quick_damas', 'parcel'
    recipient_name TEXT NOT NULL,
    recipient_phone TEXT NOT NULL,
    delivery_address TEXT NOT NULL,
    delivery_address_detail TEXT,
    delivery_memo TEXT,
    
    -- 주문 상태
    status TEXT DEFAULT 'pending' NOT NULL, -- 'pending', 'confirmed', 'preparing', 'shipping', 'delivered', 'cancelled'
    
    -- 배송 추적
    tracking_number TEXT, -- 송장번호
    tracking_images TEXT[], -- 배송 증빙 사진 URLs

    -- 추가 배송/구매 정보
    courier_name TEXT,     -- 택배사/배송기사 이름
    courier_contact TEXT,  -- 배송기사 연락처
    purchase_proof_images TEXT[], -- 구매 인증 사진 URLs (구매중 단계)
    
    -- 타임스탬프
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    confirmed_at timestamp with time zone,
    shipped_at timestamp with time zone,
    delivered_at timestamp with time zone,
    cancelled_at timestamp with time zone,
    
    -- 취소 사유
    cancel_reason TEXT
);

-- 3. 주문 상품 테이블
CREATE TABLE IF NOT EXISTS order_items (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id uuid REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
    product_id uuid REFERENCES shop_products(id) NOT NULL,
    shop_id TEXT REFERENCES shops(id) NOT NULL,
    
    -- 주문 당시 상품 정보 (가격 변동 대비)
    product_name TEXT NOT NULL,
    product_price INTEGER NOT NULL,
    product_unit TEXT,
    product_image_url TEXT,
    
    quantity INTEGER NOT NULL,
    subtotal INTEGER NOT NULL, -- product_price * quantity
    
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. 배송비 설정 테이블 (관리자가 설정 가능)
CREATE TABLE IF NOT EXISTS delivery_fees (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    method TEXT UNIQUE NOT NULL, -- 'direct', 'quick_motorcycle', 'quick_damas', 'parcel'
    name TEXT NOT NULL,
    base_fee INTEGER NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 배송비 초기 데이터
INSERT INTO delivery_fees (method, name, base_fee, description) VALUES
('direct', '수도권 직접배송', 5000, '서울/경기 지역 직접 배송 (영업일 기준 1-2일 소요)'),
('quick_motorcycle', '퀵서비스 (오토바이)', 8000, '당일 배송 (4시간 이내)'),
('quick_damas', '퀵서비스 (다마스)', 15000, '당일 배송 (4시간 이내, 대량 주문)'),
('parcel', '택배 (착불)', 0, '일반 택배 배송 (착불, 3-5일 소요)')
ON CONFLICT (method) DO NOTHING;

-- ============================================
-- Row Level Security (RLS) 정책
-- ============================================

-- 장바구니 RLS
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cart"
ON cart_items FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert to own cart"
ON cart_items FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cart"
ON cart_items FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete from own cart"
ON cart_items FOR DELETE
USING (auth.uid() = user_id);

-- 주문 RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders"
ON orders FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own orders"
ON orders FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders"
ON orders FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'ADMIN'
    )
);

CREATE POLICY "Admins can update all orders"
ON orders FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'ADMIN'
    )
);

-- 주문 상품 RLS
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own order items"
ON order_items FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM orders
        WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
);

CREATE POLICY "Admins can view all order items"
ON order_items FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'ADMIN'
    )
);

-- 배송비 설정 RLS
ALTER TABLE delivery_fees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active delivery fees"
ON delivery_fees FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage delivery fees"
ON delivery_fees FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'ADMIN'
    )
);

-- ============================================
-- 인덱스 생성
-- ============================================

CREATE INDEX idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_shop_id ON order_items(shop_id);

-- ============================================
-- 주문번호 생성 함수
-- ============================================

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    date_part TEXT;
    sequence_part INTEGER;
BEGIN
    -- 날짜 부분 (YYYYMMDD)
    date_part := TO_CHAR(NOW(), 'YYYYMMDD');
    
    -- 오늘 날짜의 주문 개수 조회
    SELECT COUNT(*) + 1 INTO sequence_part
    FROM orders
    WHERE order_number LIKE 'ORD-' || date_part || '-%';
    
    -- 주문번호 생성 (ORD-YYYYMMDD-0001)
    new_number := 'ORD-' || date_part || '-' || LPAD(sequence_part::TEXT, 4, '0');
    
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 수수료 계산 함수
-- ============================================

CREATE OR REPLACE FUNCTION calculate_service_fee(subtotal INTEGER)
RETURNS INTEGER AS $$
BEGIN
    IF subtotal < 50000 THEN
        RETURN 0; -- 최소 주문 금액 미달
    ELSIF subtotal >= 50000 AND subtotal < 100000 THEN
        RETURN 10000; -- 5~10만원: 1만원
    ELSIF subtotal >= 100000 AND subtotal < 150000 THEN
        RETURN 20000; -- 10~15만원: 2만원
    ELSIF subtotal >= 150000 AND subtotal < 200000 THEN
        RETURN 30000; -- 15~20만원: 3만원
    ELSE
        RETURN 40000; -- 20만원 이상: 4만원
    END IF;
END;
$$ LANGUAGE plpgsql;
