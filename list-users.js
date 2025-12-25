
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function listUsers() {
    const { data: users, error } = await supabase.from('user_profiles').select('*');
    if (error) {
        // Try 'profiles'
        const { data: profiles, error: error2 } = await supabase.from('profiles').select('*');
        if (error2) {
            console.error('Error:', error2);
            return;
        }
        console.log(JSON.stringify(profiles, null, 2));
    } else {
        console.log(JSON.stringify(users, null, 2));
    }
}

listUsers();
