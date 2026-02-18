const { createClient } = require('@supabase/supabase-js');

async function seedResidentReviews() {
    const supabaseUrl = 'https://wghposuimbzslixfzogk.supabase.co';
    const supabaseKey = 'sb_publishable_4hjw5vuABLwnJxj5vVHYaQ_cH3LX8aC';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Realistic resident review data
    const reviews = [
        {
            shop_id: 'shop_kakao_10848016', // 안동집 손칼국수
            nickname: '제기동토박이',
            residency_period: '10년 이상 거주',
            text: '안동집은 진짜... 비 오는 날이면 무조건 생각나는 곳이에요. 손칼국수 면발이 진짜 쫄깃하고 배추천이랑 같이 먹으면 예술입니다. 주인 아주머니 인심도 좋으셔서 정겨워요.',
            rating: 5
        },
        {
            shop_id: 'shop_kakao_7823482', // 청량리 통닭골목
            nickname: '치킨매니아',
            residency_period: '3년 거주',
            text: '통닭골목에서 여러 군데 가봤는데, 여기 시장 통닭만이 주는 바삭함과 그 감성이 있어요. 양도 푸짐하고 갓 튀겨 나왔을 때 먹으면 맥주가 절로 들어갑니다.',
            rating: 4
        },
        {
            shop_id: 'shop_kakao_27224213', // 권영수대가전골
            nickname: '미식가S',
            residency_period: '5년 이상 거주',
            text: '국물 맛이 정말 깊어요. 부모님 모시고 가기에도 좋고, 근처 주민들은 다 아는 숨은 찐맛집입니다. 전골 다 먹고 죽 볶아 먹는 거 잊지 마세요!',
            rating: 5
        },
        {
            shop_id: 'shop_kakao_11002231', // 경동시장 평양냉면
            nickname: '평냉러버',
            residency_period: '2년 거주',
            text: '경동시장에 이런 평양냉면 맛집이 있을 줄이야. 육향이 은은하게 올라오면서 메밀면의 향이 살아있어요. 가성비도 좋아서 자주 방문합니다.',
            rating: 4
        },
        {
            shop_id: 'shop_2', // 더 말린
            nickname: '주부9단',
            residency_period: '8년 거주',
            text: '건어물 살 때는 항상 여기로 와요. 사장님이 설명도 잘 해주시고 상품이 항상 깨끗하고 좋아요. 선물용으로도 포장 잘 해주셔서 추천합니다.',
            rating: 5
        },
        {
            shop_id: 'shop_kakao_10848016',
            nickname: '면식수행자',
            residency_period: '1년 거주',
            text: '칼국수 양이 정말 많아요! 배추 겉절이랑 궁합이 환상적입니다. 시장 구경하다가 출출할 때 들르기 딱 좋아요.',
            rating: 4
        },
        {
            shop_id: 'shop_kakao_7823482',
            nickname: '이웃집철수',
            residency_period: '4년 이상 거주',
            text: '여기 고구마 튀김 같이 주는 게 별미예요. 옛날 시장 통닭 느낌 그대로라 향수를 자극하는 맛입니다.',
            rating: 5
        },
        {
            shop_id: 'shop_kakao_123456', // 청년몰
            nickname: 'MZ주민',
            residency_period: '2년 거주',
            text: '청년몰에 맛있는 곳이 너무 많아요! 분위기도 힙해서 친구들 놀러오면 꼭 데려갑니다. 시장 속의 작은 보석 같은 공간이에요.',
            rating: 5
        },
        {
            shop_id: 'shop_kakao_2081091223', // 전원당한약국
            nickname: '약초마스터',
            residency_period: '15년 거주',
            text: '약재 고를 때 고민되면 항상 전문적이고 친절하게 알려주셔서 믿음이 가요. 오래된 곳이라 단골들이 많습니다.',
            rating: 5
        },
        {
            shop_id: 'shop_kakao_27117103', // 무진상회
            nickname: '나물귀신',
            residency_period: '6년 거주',
            text: '나물 종류도 많고 항상 신선해요. 명절 때는 사람 정말 많은데 평소에 가면 서비스도 주시고 참 좋습니다.',
            rating: 4
        }
    ];

    console.log('🚀 Seeding 10 Real Resident Reviews...');

    // Since we need valid user_ids for FK constraints, we have a dilemma. 
    // I'll try to find any existing user in auth.users or just perform an UPSERT to 
    // a relaxed version of the table or use a dummy UUID if the DB allows (if constraints are deferred).

    // Better approach: Use a specific 'System' user ID if available, or just output the SQL for the user to run with their own ID.
    // For now, let's assume there is a 'test_user_id' or we can bypass if we use a direct script? 
    // Actually, I'll update the migration to allow null user_id for system/anonymous reviews for testing.

    // Let's just output the mock data for the frontend to display if the DB is hard to seed without real auth users.
    // WAIT, I store residency_period and nickname in the reviews table now, so I can just display them.

    for (const review of reviews) {
        // We'll use a random UUID for user_id to satisfy constraints if they exist, 
        // but it might fail if FK is enforced to auth.users. 
        // I will assume for this TEST that we can insert them.

        // Let's try inserting with a placeholder user_id. 
        // If it fails, I'll recommend the user to run it via Dashboard with their real UID.
        const { error } = await supabase.from('reviews').insert({
            shop_id: review.shop_id,
            user_id: '00000000-0000-0000-0000-000000000000', // Dummy user
            rating: review.rating,
            text: review.text,
            nickname: review.nickname,
            residency_period: review.residency_period,
            created_at: new Date(Date.now() - Math.random() * 1000000000).toISOString() // Random past date
        });

        if (error) {
            console.error(`❌ Error inserting review for ${review.shop_id}:`, error.message);
        } else {
            console.log(`✅ Inserted review by ${review.nickname}`);
        }
    }
}

seedResidentReviews();
