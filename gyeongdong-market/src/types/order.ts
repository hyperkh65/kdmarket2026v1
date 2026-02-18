export interface Order {
    id: string;
    order_number: string;
    user_id: string;

    // Amounts
    subtotal: number;
    service_fee: number;
    delivery_fee: number;
    total_amount: number;

    // Delivery Info
    delivery_method: string;
    recipient_name: string;
    recipient_phone: string;
    delivery_address: string;
    delivery_address_detail?: string;
    delivery_memo?: string;

    // Status
    status: 'pending' | 'confirmed' | 'paid' | 'purchasing' | 'preparing' | 'shipping' | 'delivered' | 'cancelled';

    // Tracking & Proof
    tracking_number?: string;
    courier_name?: string;     // Added
    courier_contact?: string;  // Added
    tracking_images?: string[];
    purchase_proof_images?: string[]; // Added

    // Timestamps
    created_at: string;
    confirmed_at?: string;
    shipped_at?: string;
    delivered_at?: string;
    cancelled_at?: string;
    cancel_reason?: string;
}

export interface OrderItem {
    id: string;
    order_id: string;
    product_id: string;
    shop_id: string;
    product_name: string;
    product_price: number;
    product_unit: string;
    product_image_url: string;
    quantity: number;
    subtotal: number;
    shop?: {
        name: string;
    };
}
