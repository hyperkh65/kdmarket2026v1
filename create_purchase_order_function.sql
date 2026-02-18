-- ============================================
-- 주문 생성 및 장바구니 비우기 RPC 함수
-- ============================================

CREATE OR REPLACE FUNCTION create_purchase_order(
    p_user_id uuid,
    p_subtotal integer,
    p_service_fee integer,
    p_delivery_fee integer,
    p_total_amount integer,
    p_delivery_method text,
    p_recipient_name text,
    p_recipient_phone text,
    p_delivery_address text,
    p_delivery_address_detail text DEFAULT NULL,
    p_delivery_memo text DEFAULT NULL
)
RETURNS text AS $$
DECLARE
    v_order_id uuid;
    v_order_number text;
BEGIN
    -- 1. 주문 번호 생성
    v_order_number := generate_order_number();

    -- 2. orders 테이블에 삽입
    INSERT INTO orders (
        order_number,
        user_id,
        subtotal,
        service_fee,
        delivery_fee,
        total_amount,
        delivery_method,
        recipient_name,
        recipient_phone,
        delivery_address,
        delivery_address_detail,
        delivery_memo,
        status
    )
    VALUES (
        v_order_number,
        p_user_id,
        p_subtotal,
        p_service_fee,
        p_delivery_fee,
        p_total_amount,
        p_delivery_method,
        p_recipient_name,
        p_recipient_phone,
        p_delivery_address,
        p_delivery_address_detail,
        p_delivery_memo,
        'pending'
    )
    RETURNING id INTO v_order_id;

    -- 3. order_items 테이블에 장바구니 상품들 복사
    -- cart_items -> shop_products 조인하여 상품 정보 가져오기
    INSERT INTO order_items (
        order_id,
        product_id,
        shop_id,
        product_name,
        product_price,
        product_unit,
        product_image_url,
        quantity,
        subtotal
    )
    SELECT 
        v_order_id,
        c.product_id,
        p.shop_id,
        p.name,
        p.price,
        p.unit,
        p.image_url,
        c.quantity,
        (p.price * c.quantity)
    FROM cart_items c
    JOIN shop_products p ON c.product_id = p.id
    WHERE c.user_id = p_user_id;

    -- 4. 장바구니 비우기
    DELETE FROM cart_items
    WHERE user_id = p_user_id;

    RETURN v_order_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
