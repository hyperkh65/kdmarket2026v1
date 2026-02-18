'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import styles from './page.module.css';
import { ChevronLeft, Share2, Heart, Phone, Info, Star, Edit3, ShoppingBag, MapPin, Trash2, ShoppingCart, Navigation } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import WikiEditor from '@/components/WikiEditor';
import { getMarkerSvg } from '@/components/MapMarker';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const Map = dynamic(() => import('@/components/Map'), {
    ssr: false,
    loading: () => <div style={{ height: '300px', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>지도를 불러오는 중...</div>
});

// Comprehensive cleanup to remove invisible control characters, broken unicode, and markers
const cleanValue = (val: string | null) => {
    if (!val) return null;
    return val
        .replace(/[\u0000-\u001F\u007F-\u009F\uFEFF\uFFFD]/g, '') // Remove control, BOM, and replacement characters
        .replace(/[📍🏠🗺️📞☎️📱]/gu, '') // Remove markers using unicode flag
        .replace(/https?:\/\/place\.map\.kakao\.com\/\d+/g, '') // Remove Kakao links
        .trim();
};

const cleanText = (text: string) => {
    if (!text) return text;
    return cleanValue(text) || '';
};

// Extract address from description with multi-marker support
const extractAddress = (desc: string) => {
    if (!desc) return null;
    const match = desc.match(/[📍🏠🗺️]\s*([^\n]+)/u);
    return match ? cleanValue(match[1]) : null;
};

// Extract phone from description with multi-marker support
const extractPhone = (desc: string) => {
    if (!desc) return null;
    const match = desc.match(/[📞☎️📱]\s*([^\s\n]+)/u);
    return match ? cleanValue(match[1]) : null;
};

// Helper to prioritize landline
const getBestPhone = (contactStr: string) => {
    const cleaned = cleanValue(contactStr);
    if (!cleaned) return null;
    const parts = cleaned.split(/[\s,]+/).map(p => p.trim());
    const landline = parts.find(p => p.startsWith('02-'));
    const mobile = parts.find(p => p.startsWith('010-'));
    return landline || mobile || parts[0];
};

// Category Info mapping
const getCategoryStyle = (category: string) => {
    let iconColor = '#607D8B';
    let iconType = 'bag';
    // Actual Gyeongdong Market inspired high-quality photo
    let heroImage = 'https://images.unsplash.com/photo-1620589125156-fd5028c5e05b?q=80&w=1001&auto=format&fit=crop';

    const cat = category || '';
    if (cat.includes('카페') || cat.includes('디저트')) {
        iconColor = '#9C27B0'; iconType = 'cafe';
        heroImage = 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1000&auto=format&fit=crop';
    } else if (cat.includes('음식') || cat.includes('맛집') || cat.includes('식당') || cat.includes('분식')) {
        iconColor = '#FF9800'; iconType = 'food';
        heroImage = 'https://images.unsplash.com/photo-1547517023-7ca0c162f816?q=80&w=1000&auto=format&fit=crop';
    } else if (cat.includes('채소') || cat.includes('과일') || cat.includes('청과')) {
        iconColor = '#8BC34A'; iconType = 'veggie';
        heroImage = 'https://images.unsplash.com/photo-1506484381205-f7945653044d?q=80&w=1000&auto=format&fit=crop';
    } else if (cat.includes('수산')) {
        iconColor = '#2196F3'; iconType = 'fish';
        heroImage = 'https://images.unsplash.com/photo-1534833211114-6593b2160d8e?q=80&w=1000&auto=format&fit=crop';
    } else if (cat.includes('정육')) {
        iconColor = '#F44336'; iconType = 'meat';
        heroImage = 'https://images.unsplash.com/photo-1607623273573-09f9848f572c?q=80&w=1000&auto=format&fit=crop';
    } else if (cat.includes('인삼') || cat.includes('한약')) {
        iconColor = '#3F51B5'; iconType = 'herbal';
        heroImage = 'https://images.unsplash.com/photo-1564344790218-02888cf6477e?q=80&w=1000&auto=format&fit=crop';
    }

    return { iconColor, iconType, heroImage };
};

// @ts-ignore
export default function ShopDetailClient({ initialShop }: { initialShop: any }) {
    const [shop, setShop] = useState<any>(initialShop);
    const [activeTab, setActiveTab] = useState('info');
    const [wikiContent, setWikiContent] = useState<string | null>(null);
    const [isOwner, setIsOwner] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isWished, setIsWished] = useState(false);
    const [wishCount, setWishCount] = useState(128); // Mock

    // Product Modal States
    const [showProductModal, setShowProductModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');
    const [uploadingImage, setUploadingImage] = useState(false);
    const [productForm, setProductForm] = useState({
        name: '',
        price: '',
        unit: '개',
        description: '',
        image_url: ''
    });
    const [products, setProducts] = useState<any[]>([]);
    const [isEditingInfo, setIsEditingInfo] = useState(false);
    const [editDescription, setEditDescription] = useState(shop?.long_description || '');
    const [showDirections, setShowDirections] = useState(false);
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

    const { addItem, items } = useCart();
    const router = useRouter();

    useEffect(() => {
        if (initialShop) {
            setShop(initialShop);
            setEditDescription(initialShop.long_description || '');

            const checkPermissions = async () => {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    // Check Admin/Owner status
                    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
                    if (profile?.role === 'ADMIN') setIsAdmin(true);
                    if (user.id === initialShop.owner_id) setIsOwner(true);

                    // Check Wishlist
                    const { data } = await supabase
                        .from('favorites')
                        .select('id')
                        .eq('shop_id', initialShop.id)
                        .eq('user_id', user.id)
                        .maybeSingle();
                    if (data) setIsWished(true);
                }
            };

            const fetchProducts = async () => {
                const { data } = await supabase
                    .from('shop_products')
                    .select('*')
                    .eq('shop_id', initialShop.id);
                if (data) setProducts(data);
            };

            checkPermissions();
            fetchProducts();

            // Fetch user location for directions
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
                    () => console.log('Location access denied'),
                    { timeout: 5000 }
                );
            }
        }
    }, [initialShop]);

    const canEdit = isAdmin || isOwner;

    const handleSaveInfo = async () => {
        const { error } = await supabase
            .from('shops')
            .update({ long_description: editDescription })
            .eq('id', shop.id);

        if (error) {
            alert('정보 저장 실패: ' + error.message);
        } else {
            setShop({ ...shop, long_description: editDescription });
            setIsEditingInfo(false);
            alert('상세 정보가 저장되었습니다.');
        }
    };

    const openProductModal = (product?: any) => {
        if (product) {
            setEditingProduct(product);
            setProductForm({
                name: product.name,
                price: product.price.toString(),
                unit: product.unit || '개',
                description: product.description || '',
                image_url: product.image_url || ''
            });
            setImagePreview(product.image_url || '');
            setImageFile(null);
        } else {
            setEditingProduct(null);
            setProductForm({
                name: '',
                price: '',
                unit: '개',
                description: '',
                image_url: ''
            });
            setImagePreview('');
            setImageFile(null);
        }
        setShowProductModal(true);
    };

    const closeProductModal = () => {
        setShowProductModal(false);
        setEditingProduct(null);
        setImageFile(null);
        setImagePreview('');
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleImageUpload = async (): Promise<string | null> => {
        if (!imageFile) return productForm.image_url || null;

        setUploadingImage(true);
        try {
            const fileExt = imageFile.name.split('.').pop();
            const fileName = `${shop.id}_${Date.now()}.${fileExt}`;
            const filePath = `products/${fileName}`;

            const { data, error } = await supabase.storage
                .from('images')
                .upload(filePath, imageFile, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) {
                console.error('Upload error:', error);
                alert('이미지 업로드 실패: ' + error.message);
                return null;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('images')
                .getPublicUrl(filePath);

            return publicUrl;
        } catch (err) {
            console.error('Upload exception:', err);
            alert('이미지 업로드 중 오류가 발생했습니다.');
            return null;
        } finally {
            setUploadingImage(false);
        }
    };

    const handleSaveProduct = async () => {
        if (!productForm.name || !productForm.price) {
            alert('제품명과 가격은 필수입니다.');
            return;
        }

        // Upload image if new file selected
        const uploadedImageUrl = await handleImageUpload();
        if (imageFile && !uploadedImageUrl) {
            return; // Upload failed
        }

        const productData = {
            shop_id: shop.id,
            name: productForm.name,
            price: parseInt(productForm.price),
            unit: productForm.unit,
            description: productForm.description,
            image_url: uploadedImageUrl || productForm.image_url
        };

        if (editingProduct) {
            // Update existing product
            const { data, error } = await supabase
                .from('shop_products')
                .update(productData)
                .eq('id', editingProduct.id)
                .select()
                .single();

            if (error) {
                alert('제품 수정 실패: ' + error.message);
            } else {
                setProducts(products.map(p => p.id === editingProduct.id ? data : p));
                alert('제품이 수정되었습니다.');
                closeProductModal();
            }
        } else {
            // Insert new product
            const { data, error } = await supabase
                .from('shop_products')
                .insert(productData)
                .select()
                .single();

            if (error) {
                alert('제품 등록 실패: ' + error.message);
            } else {
                setProducts([...products, data]);
                alert('제품이 등록되었습니다.');
                closeProductModal();
            }
        }
    };

    const handleDeleteProduct = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('정말 삭제하시겠습니까?')) return;
        const { error } = await supabase.from('shop_products').delete().eq('id', id);
        if (error) alert('삭제 실패: ' + error.message);
        else setProducts(products.filter(p => p.id !== id));
    };

    const addToCart = async (product: any, e: React.MouseEvent) => {
        e.stopPropagation();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            alert('로그인이 필요합니다.');
            router.push('/login');
            return;
        }

        const { data: existing, error: checkError } = await supabase
            .from('cart_items')
            .select('*')
            .eq('user_id', user.id)
            .eq('product_id', product.id)
            .single();

        if (existing) {
            // 이미 장바구니에 있으면 수량 증가
            const { error } = await supabase
                .from('cart_items')
                .update({ quantity: existing.quantity + 1 })
                .eq('id', existing.id);

            if (!error) {
                alert('장바구니에 수량이 추가되었습니다!');
            }
        } else {
            // 새로 추가
            const { error } = await supabase
                .from('cart_items')
                .insert({
                    user_id: user.id,
                    product_id: product.id,
                    quantity: 1
                });

            if (!error) {
                alert('장바구니에 담았습니다!');
            } else {
                alert('장바구니 담기 실패: ' + error.message);
            }
        }
    };

    const handleCall = () => {
        const phone = getBestPhone(shop.contact || shop.phone || extractPhone(shop.description));
        if (phone) {
            window.location.href = `tel:${phone}`;
        } else {
            alert('등록된 전화번호가 없습니다.');
        }
    };

    const toggleWish = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            alert('찜하기는 로그인이 필요합니다.');
            router.push('/login');
            return;
        }

        if (isWished) {
            const { error } = await supabase.from('favorites').delete().eq('shop_id', shop.id).eq('user_id', user.id);
            if (error) {
                alert('찜 취소 실패: ' + error.message);
            } else {
                setIsWished(false);
                setWishCount(prev => prev - 1);
            }
        } else {
            const { error } = await supabase.from('favorites').insert({ shop_id: shop.id, user_id: user.id });
            if (error) {
                console.error('Wish insert error:', error);
                if (error.message.includes('foreign key')) {
                    alert('찜하기 실패: 상점 정보가 DB에 없습니다. (SQL 수동 실행 필요)');
                } else {
                    alert('찜하기 실패: ' + error.message);
                }
            } else {
                setIsWished(true);
                setWishCount(prev => prev + 1);
            }
        }
    };

    const handleDirections = () => {
        if (!shop.lat || !shop.lng) {
            alert('위치 정보가 없는 상점입니다.');
            return;
        }
        setShowDirections(true);
    };

    if (!shop) return <div style={{ padding: '20px' }}>로딩중...</div>;

    return (
        <div style={{ background: '#F8F9FA', minHeight: '100vh', paddingBottom: '90px' }}>
            {/* 1. HERO HEADER */}
            <div style={{ position: 'relative', height: '240px' }}>
                <img
                    src={shop.images?.[0] || getCategoryStyle(shop.category).heroImage}
                    alt={shop.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1000&auto=format&fit=crop';
                    }}
                />

                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0,
                    padding: '12px 16px',
                    display: 'flex', justifyContent: 'space-between',
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)'
                }}>
                    <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: 'white' }}>
                        <ChevronLeft size={28} />
                    </button>
                    <div style={{ display: 'flex', gap: '16px', color: 'white' }}>
                        {canEdit && (
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={() => setIsEditingInfo(!isEditingInfo)}
                                    style={{ background: 'white', color: 'black', border: 'none', borderRadius: '20px', padding: '4px 12px', fontSize: '12px', fontWeight: 700 }}
                                >
                                    {isEditingInfo ? '취소' : '정보 수정'}
                                </button>
                                <button
                                    onClick={() => openProductModal()}
                                    style={{ background: '#FF5A00', color: 'white', border: 'none', borderRadius: '20px', padding: '4px 12px', fontSize: '12px', fontWeight: 700 }}
                                >
                                    제품 추가
                                </button>
                            </div>
                        )}
                        <Share2 size={24} />
                    </div>
                </div>
            </div>

            {/* 2. SHOP INFO CARD */}
            <div style={{
                marginTop: '-20px',
                background: 'white',
                borderTopLeftRadius: '24px',
                borderTopRightRadius: '24px',
                padding: '24px 20px',
                position: 'relative',
                zIndex: 10,
                boxShadow: '0 -4px 10px rgba(0,0,0,0.05)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px', marginTop: '-50px' }}>
                    <div style={{
                        width: '80px', height: '80px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        border: '4px solid white',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                        background: 'white'
                    }}>
                        {shop.logo_url || (shop.images && shop.images.length > 0) ? (
                            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                                <img
                                    src={shop.logo_url || shop.images?.[0]}
                                    alt="logo"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    onError={(e) => {
                                        // If image fails, hide it and show the icon symbol
                                        const parent = e.currentTarget.parentElement;
                                        if (parent) {
                                            parent.innerHTML = `
                                                <div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; background:${getCategoryStyle(shop.category).iconColor}">
                                                    ${getMarkerSvg(getCategoryStyle(shop.category).iconType, getCategoryStyle(shop.category).iconColor, false).replace('width="40" height="40"', 'width="60" height="60"')}
                                                </div>
                                            `;
                                        }
                                    }}
                                />
                                {isOwner && shop.is_verified && (
                                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Edit3 size={18} color="white" />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div
                                style={{
                                    width: '100%', height: '100%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: getCategoryStyle(shop.category).iconColor,
                                    position: 'relative'
                                }}
                                dangerouslySetInnerHTML={{
                                    __html: getMarkerSvg(
                                        getCategoryStyle(shop.category).iconType,
                                        getCategoryStyle(shop.category).iconColor,
                                        false
                                    ).replace('width="40" height="40"', 'width="60" height="60"')
                                }}
                            />
                        )}
                        {isOwner && shop.is_verified && !shop.logo_url && (!shop.images || shop.images.length === 0) && (
                            <button style={{ position: 'absolute', bottom: 0, right: 0, background: 'white', borderRadius: '50%', padding: '4px', border: '1px solid #ddd' }}>
                                <Edit3 size={14} />
                            </button>
                        )}
                    </div>
                </div>

                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <h1 style={{ fontSize: '28px', fontWeight: 900, marginBottom: '12px', color: '#222', letterSpacing: '-0.5px' }}>
                        {shop.name}
                        {shop.is_verified && <span style={{ color: '#1E88E5', marginLeft: '8px', fontSize: '20px' }}>✅</span>}
                    </h1>

                    {shop.is_verified && (
                        <div style={{ display: 'inline-block', background: '#E3F2FD', color: '#1E88E5', padding: '4px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 800, marginBottom: '16px' }}>
                            경동시장 공식 인증 상점
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Star size={18} fill="#FFD700" color="#FFD700" />
                            <span style={{ fontSize: '15px', fontWeight: 800, color: '#222' }}>
                                {shop.rating > 0 ? shop.rating.toFixed(1) : '0.0'}
                                <span style={{ color: '#888', fontWeight: 400, marginLeft: '4px' }}>
                                    ({shop.review_count || 0})
                                </span>
                            </span>
                        </div>
                        <span style={{ color: '#eee' }}>|</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <ShoppingBag size={16} color="#555" />
                            <span style={{ fontSize: '13px', color: '#555', fontWeight: 600 }}>
                                사장님 댓글 {shop.owner_reply_count || 0}
                            </span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '24px' }}>
                        <button
                            onClick={toggleWish}
                            style={{
                                flex: 1, padding: '12px', borderRadius: '12px',
                                background: isWished ? '#FF5A5F' : '#FFF0F0',
                                color: isWished ? 'white' : '#FF5A5F',
                                border: 'none', fontWeight: 700,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                            }}
                        >
                            <Heart size={18} fill={isWished ? 'white' : 'none'} />
                            찜하기 {(wishCount / 1000).toFixed(1)}k
                        </button>
                        <button
                            onClick={handleCall}
                            style={{
                                flex: 1, padding: '12px', borderRadius: '12px',
                                background: '#F5F5F5', color: '#333',
                                border: 'none', fontWeight: 700,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                            }}
                        >
                            <Phone size={18} />
                            전화하기
                        </button>
                        <button
                            onClick={handleDirections}
                            style={{
                                flex: 1, padding: '12px', borderRadius: '12px',
                                background: '#E3F2FD', color: '#1E88E5',
                                border: 'none', fontWeight: 700,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                            }}
                        >
                            <MapPin size={18} />
                            길찾기
                        </button>
                    </div>

                    {!shop.is_verified && (
                        <div style={{ background: '#FFF8E1', border: '1px solid #FFE082', borderRadius: '12px', padding: '16px', marginBottom: '24px', textAlign: 'left' }}>
                            <p style={{ fontSize: '13px', fontWeight: 700, color: '#F57C00', marginBottom: '4px' }}>💡 이 가게의 사장님이신가요?</p>
                            <p style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>가게 정보를 직접 관리하고 대표 사진을 등록해보세요.</p>
                            <Link href="/register" style={{ fontSize: '12px', color: '#FF5A00', fontWeight: 700, textDecoration: 'none' }}>
                                사장님 인증하고 사진 등록하기 →
                            </Link>
                        </div>
                    )}

                    <div style={{ background: '#F8F9FA', borderRadius: '12px', padding: '18px', fontSize: '14px', color: '#444' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'flex-start' }}>
                            <span style={{ color: '#888', minWidth: '60px' }}>주소</span>
                            <span style={{ fontWeight: 600, color: '#222', textAlign: 'right', flex: 1 }}>
                                {cleanText(shop.address) || extractAddress(shop.description) || '주소 정보 준비 중'}
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#888', minWidth: '60px' }}>대표번호</span>
                            <span style={{ fontWeight: 600, color: '#222' }}>
                                {getBestPhone(shop.phone || shop.contact) || extractPhone(shop.description) || '번호 정보 준비 중'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid #eee' }}>
                    {['정보', '리뷰', '위키'].map(tab => {
                        const tabKey = tab === '정보' ? 'info' : tab === '리뷰' ? 'review' : 'wiki';
                        return (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tabKey)}
                                style={{
                                    flex: 1,
                                    padding: '16px',
                                    background: 'white',
                                    border: 'none',
                                    borderBottom: activeTab === tabKey ? '3px solid #222' : 'none',
                                    fontWeight: activeTab === tabKey ? 800 : 500,
                                    color: activeTab === tabKey ? '#222' : '#999',
                                    cursor: 'pointer'
                                }}
                            >
                                {tab}
                            </button>
                        )
                    })}
                </div>

                {/* Tab Content: Info */}
                {activeTab === 'info' && (
                    <div style={{ paddingTop: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 800 }}>가게 상세 정보</h3>
                            {isEditingInfo && (
                                <button onClick={handleSaveInfo} style={{ background: '#222', color: 'white', border: 'none', borderRadius: '6px', padding: '4px 12px', fontSize: '13px', fontWeight: 600 }}>저장</button>
                            )}
                        </div>

                        {isEditingInfo ? (
                            <textarea
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                style={{ width: '100%', minHeight: '150px', background: '#f5f5f5', border: '1px solid #ddd', borderRadius: '8px', padding: '12px', fontSize: '14px', marginBottom: '24px', outline: 'none' }}
                                placeholder="가게 상세 소개를 작성해주세요."
                            />
                        ) : (
                            <div style={{ lineHeight: 1.6, color: '#444', fontSize: '14px', marginBottom: '32px' }}>
                                {shop.long_description || '이 가게의 상세 소개가 준비 중입니다. 사장님인 경우 정보를 수정해 주세요.'}
                            </div>
                        )}

                        <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '16px' }}>판매 제품</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {products.length === 0 ? (
                                <p style={{ fontSize: '14px', color: '#999', textAlign: 'center', padding: '30px' }}>등록된 제품 정보가 없습니다.</p>
                            ) : (
                                products.map(product => (
                                    <div
                                        key={product.id}
                                        onClick={() => canEdit && openProductModal(product)}
                                        style={{
                                            display: 'flex',
                                            background: 'white',
                                            borderRadius: '12px',
                                            overflow: 'hidden',
                                            border: '1px solid #eee',
                                            position: 'relative',
                                            cursor: canEdit ? 'pointer' : 'default',
                                            transition: 'transform 0.2s'
                                        }}
                                        onMouseEnter={(e) => canEdit && (e.currentTarget.style.transform = 'scale(1.02)')}
                                        onMouseLeave={(e) => canEdit && (e.currentTarget.style.transform = 'scale(1)')}
                                    >
                                        <div style={{ width: '100px', height: '100px', background: '#f0f0f0' }}>
                                            <img
                                                src={product.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200'}
                                                alt={product.name}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                        </div>
                                        <div style={{ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '4px' }}>{product.name}</h4>
                                                {canEdit && <Trash2 size={16} color="#EB5757" onClick={(e) => handleDeleteProduct(product.id, e)} style={{ cursor: 'pointer' }} />}
                                            </div>
                                            <p style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>{product.description}</p>
                                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '12px' }}>
                                                <span style={{ fontSize: '16px', fontWeight: 900, color: '#FF5A00' }}>
                                                    {product.price.toLocaleString()}원
                                                </span>
                                                <span style={{ fontSize: '12px', color: '#888' }}>
                                                    / {product.unit || '개'}
                                                </span>
                                            </div>
                                            {!canEdit && (
                                                <button
                                                    onClick={(e) => addToCart(product, e)}
                                                    style={{
                                                        marginTop: 'auto',
                                                        padding: '8px 16px',
                                                        background: '#FF5A00',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        fontSize: '13px',
                                                        fontWeight: 700,
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '6px',
                                                        alignSelf: 'flex-end'
                                                    }}
                                                >
                                                    <ShoppingCart size={14} />
                                                    담기
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* Tab Content: Review */}
                {activeTab === 'review' && (
                    <div style={{ paddingTop: '24px' }}>
                        <div style={{ background: '#F0F7FF', padding: '16px', borderRadius: '12px', marginBottom: '24px', display: 'flex', gap: '12px' }}>
                            <Star size={20} color="#1E88E5" />
                            <div>
                                <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#1E88E5', marginBottom: '4px' }}>리뷰란?</h4>
                                <p style={{ fontSize: '13px', color: '#555', lineHeight: 1.4 }}>상점을 방문한 사용자의 개인적인 평점과 생생한 경험담을 공유하는 공간입니다.</p>
                            </div>
                        </div>

                        {/* Review Input Section */}
                        <div style={{ background: 'white', border: '1px solid #eee', borderRadius: '12px', padding: '20px', marginBottom: '32px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                            <h4 style={{ fontSize: '15px', fontWeight: 800, marginBottom: '16px', color: '#333' }}>리뷰 남기기</h4>
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                                {[1, 2, 3, 4, 5].map(star => (
                                    <Star key={star} size={28} color="#ddd" style={{ cursor: 'pointer' }} />
                                ))}
                            </div>
                            <textarea
                                placeholder="방문 경험을 들려주세요 (최소 10자)"
                                style={{ width: '100%', height: '100px', border: '1px solid #eee', borderRadius: '8px', padding: '14px', fontSize: '15px', marginBottom: '16px', outline: 'none', background: '#fafafa' }}
                            />
                            <button style={{ width: '100%', background: '#222', color: 'white', border: 'none', borderRadius: '10px', padding: '14px', fontWeight: 800, fontSize: '15px' }}>
                                리뷰 등록하기
                            </button>
                        </div>

                        <div style={{ borderTop: '1px solid #eee', paddingTop: '8px' }}>
                            <div style={{ textAlign: 'center', padding: '60px 0', color: '#999', fontSize: '15px' }}>
                                <div style={{ marginBottom: '12px' }}>💬</div>
                                아직 작성된 리뷰가 없습니다.<br />첫 리뷰를 작성해보세요!
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab Content: Wiki */}
                {activeTab === 'wiki' && (
                    <div style={{ paddingTop: '24px' }}>
                        <div style={{ background: '#FFF4E5', padding: '16px', borderRadius: '12px', marginBottom: '24px', display: 'flex', gap: '12px' }}>
                            <Info size={20} color="#FF9800" />
                            <div>
                                <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#FF9800', marginBottom: '4px' }}>위키란?</h4>
                                <p style={{ fontSize: '13px', color: '#555', lineHeight: 1.4 }}>가게의 역사, 단골 꿀팁 등 객관적인 정보를 모두가 함께 기록하고 수정하는 '경동시장 백과사전'입니다.</p>
                            </div>
                        </div>
                        <WikiEditor shopId={shop.id} initialContent={wikiContent} />
                    </div>
                )}
            </div>


            {/* Product Management Modal */}
            {showProductModal && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.7)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9999,
                        padding: '20px'
                    }}
                    onClick={closeProductModal}
                >
                    <div
                        style={{
                            background: 'white',
                            borderRadius: '20px',
                            padding: '32px',
                            maxWidth: '500px',
                            width: '100%',
                            maxHeight: '90vh',
                            overflowY: 'auto'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 style={{ fontSize: '22px', fontWeight: 900, marginBottom: '24px', color: '#222' }}>
                            {editingProduct ? '제품 수정' : '제품 등록'}
                        </h2>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, marginBottom: '8px', color: '#444' }}>제품명 *</label>
                            <input
                                type="text"
                                value={productForm.name}
                                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                                placeholder="예: 홍삼 절편"
                                style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '15px', outline: 'none' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                            <div style={{ flex: 2 }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, marginBottom: '8px', color: '#444' }}>가격 *</label>
                                <input
                                    type="number"
                                    value={productForm.price}
                                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                                    placeholder="10000"
                                    style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '15px', outline: 'none' }}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, marginBottom: '8px', color: '#444' }}>단위</label>
                                <input
                                    type="text"
                                    value={productForm.unit}
                                    onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                                    placeholder="600g"
                                    style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '15px', outline: 'none' }}
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, marginBottom: '8px', color: '#444' }}>설명</label>
                            <textarea
                                value={productForm.description}
                                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                                placeholder="제품에 대한 간단한 설명을 입력하세요"
                                style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '15px', outline: 'none', minHeight: '80px', resize: 'vertical' }}
                            />
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, marginBottom: '8px', color: '#444' }}>제품 이미지</label>

                            <div style={{
                                border: '2px dashed #ddd',
                                borderRadius: '12px',
                                padding: '24px',
                                textAlign: 'center',
                                background: '#fafafa',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#FF5A00'}
                                onMouseLeave={(e) => e.currentTarget.style.borderColor = '#ddd'}
                                onClick={() => document.getElementById('imageInput')?.click()}
                            >
                                {imagePreview ? (
                                    <div style={{ position: 'relative' }}>
                                        <img
                                            src={imagePreview}
                                            alt="미리보기"
                                            style={{
                                                width: '100%',
                                                maxHeight: '250px',
                                                objectFit: 'cover',
                                                borderRadius: '8px'
                                            }}
                                        />
                                        <p style={{ marginTop: '12px', fontSize: '13px', color: '#666' }}>
                                            클릭하여 다른 이미지 선택
                                        </p>
                                    </div>
                                ) : (
                                    <div>
                                        <div style={{ fontSize: '48px', marginBottom: '12px' }}>📷</div>
                                        <p style={{ fontSize: '15px', color: '#666', marginBottom: '4px', fontWeight: 600 }}>
                                            클릭하여 이미지 선택
                                        </p>
                                        <p style={{ fontSize: '13px', color: '#999' }}>
                                            JPG, PNG, GIF (최대 5MB)
                                        </p>
                                    </div>
                                )}
                            </div>

                            <input
                                id="imageInput"
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                style={{ display: 'none' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={closeProductModal}
                                style={{ flex: 1, padding: '14px', background: '#f5f5f5', color: '#666', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 700, cursor: 'pointer' }}
                            >
                                취소
                            </button>
                            <button
                                onClick={handleSaveProduct}
                                disabled={uploadingImage}
                                style={{
                                    flex: 1,
                                    padding: '14px',
                                    background: uploadingImage ? '#ccc' : '#FF5A00',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '10px',
                                    fontSize: '15px',
                                    fontWeight: 700,
                                    cursor: uploadingImage ? 'not-allowed' : 'pointer',
                                    opacity: uploadingImage ? 0.6 : 1
                                }}
                            >
                                {uploadingImage ? '업로드 중...' : (editingProduct ? '수정' : '등록')}
                            </button>
                        </div>

                        {editingProduct && canEdit && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteProduct(editingProduct.id, e);
                                    closeProductModal();
                                }}
                                style={{
                                    width: '100%',
                                    marginTop: '12px',
                                    padding: '12px',
                                    background: 'transparent',
                                    color: '#EB5757',
                                    border: '1px solid #EB5757',
                                    borderRadius: '10px',
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px'
                                }}
                            >
                                <Trash2 size={16} />
                                제품 삭제
                            </button>
                        )}
                    </div>
                </div>
            )}
            {/* Directions Map Modal */}
            {showDirections && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 2000,
                    background: 'rgba(0,0,0,0.85)',
                    display: 'flex',
                    flexDirection: 'column',
                    animation: 'fadeIn 0.3s'
                }}>
                    <style>{`
                        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                        @keyframes slideIn { from { transform: translateY(100%); } to { transform: translateY(0); } }
                    `}</style>
                    <div style={{
                        padding: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: '#1A1A1A',
                        borderBottom: '1px solid #333'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '40px', height: '40px', background: '#333', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Navigation size={22} color="#007AFF" />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'white', margin: 0 }}>{shop.name} 가는 길</h3>
                                <p style={{ fontSize: '12px', color: '#888', margin: 0 }}>현재 위치 기준 경로 안내</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowDirections(false)}
                            style={{ background: '#333', border: 'none', borderRadius: '50%', width: '32px', height: '32px', color: '#eee', cursor: 'pointer' }}>
                            ✕
                        </button>
                    </div>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <Map
                            shops={[shop]}
                            onShopSelect={() => { }}
                            darkMode={true}
                            userLocation={userLocation}
                            selectedShop={shop}
                        />
                        {!userLocation && (
                            <div style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                background: 'rgba(0,0,0,0.7)',
                                color: 'white',
                                padding: '12px 20px',
                                borderRadius: '20px',
                                fontSize: '13px',
                                zIndex: 1001,
                                textAlign: 'center'
                            }}>
                                위치 정보를 가져오는 중입니다...
                            </div>
                        )}
                    </div>
                    <div style={{ padding: '20px', background: '#1A1A1A', textAlign: 'center' }}>
                        <button
                            onClick={() => setShowDirections(false)}
                            style={{
                                width: '100%',
                                height: '50px',
                                background: 'linear-gradient(135deg, #007AFF, #0056b3)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '16px',
                                fontWeight: 600,
                                fontSize: '16px',
                                boxShadow: '0 4px 15px rgba(0, 122, 255, 0.3)'
                            }}>
                            안내 종료
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
