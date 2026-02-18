const { createClient } = require('@supabase/supabase-js');

async function resetAllShopStats() {
    const supabaseUrl = 'https://wghposuimbzslixfzogk.supabase.co';
    const supabaseKey = 'sb_publishable_4hjw5vuABLwnJxj5vVHYaQ_cH3LX8aC';
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🔄 All shops statistics resetting to 0...');

    try {
        const { error } = await supabase
            .from('shops')
            .update({
                rating: 0.0,
                review_count: 0
            })
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Dummy condition to target all

        if (error) {
            console.error('❌ Error during reset:', error.message);
        } else {
            console.log('✅ Successfully reset all shop ratings and review counts to 0!');
        }

        console.log('🧹 Clearing all previous reviews...');
        const { error: reviewError } = await supabase
            .from('reviews')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');

        if (reviewError) {
            console.error('❌ Error clearing reviews:', reviewError.message);
        } else {
            console.log('✅ Successfully cleared all review records!');
        }

    } catch (err) {
        console.error('💥 Fatal error:', err);
    }
}

resetAllShopStats();
