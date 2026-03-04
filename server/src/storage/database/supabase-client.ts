import { createClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

// 使用 any 类型避免类型推断问题
let supabaseClient: any = null;

export function getSupabaseClient() {
  if (!supabaseClient) {
    // 从环境变量读取配置
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration: SUPABASE_URL or SUPABASE_ANON_KEY');
    }

    supabaseClient = createClient(supabaseUrl, supabaseKey);
  }

  return supabaseClient;
}
