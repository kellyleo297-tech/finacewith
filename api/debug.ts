import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const info: Record<string, unknown> = {
    supabaseUrl: process.env.SUPABASE_URL ? '✅ set' : '❌ missing',
    supabaseKey: process.env.SUPABASE_ANON_KEY ? '✅ set' : '❌ missing',
    deepseekKey: process.env.DEEPSEEK_API_KEY ? '✅ set' : '❌ missing',
    nodeVersion: process.version,
    timestamp: new Date().toISOString(),
  };

  // Try connecting to Supabase
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_ANON_KEY || ''
    );
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error) {
      info.supabaseConnect = '❌ ' + error.message;
    } else {
      info.supabaseConnect = '✅ connected, users=' + (data?.length ?? '?');
    }
  } catch (e: any) {
    info.supabaseConnect = '❌ ' + (e?.message || 'unknown error');
  }

  res.status(200).json(info);
}
