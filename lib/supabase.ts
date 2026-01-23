
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iatbaknbmeshauhzvtxg.supabase.co';
const supabaseKey = 'sb_publishable_aWYdasLZBtV2f1V4rtLGCA_KCRC4osr';

export const supabase = createClient(supabaseUrl, supabaseKey);
