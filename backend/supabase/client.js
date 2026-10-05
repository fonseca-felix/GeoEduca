const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

// Inicializar cliente do Supabase
let supabase = null;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
} else {
    console.warn('⚠️ ATENÇÃO: Credenciais do Supabase (SUPABASE_URL e SUPABASE_KEY) não encontradas no .env.');
    
    // Fallback minimalista para não quebrar a importação caso as variáveis faltem (útil para build)
    supabase = {
        from: () => ({
            select: () => ({ eq: () => ({ single: async () => ({ data: null, error: 'No Supabase credentials' }) }) }),
            insert: () => ({ select: () => ({ single: async () => ({ data: null, error: 'No Supabase credentials' }) }) }),
            update: () => ({ eq: () => ({ select: () => ({ single: async () => ({ data: null, error: 'No Supabase credentials' }) }) }) }),
            delete: () => ({ eq: async () => ({ error: 'No Supabase credentials' }) })
        })
    };
}

module.exports = { supabase };
