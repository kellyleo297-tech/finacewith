import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    status: 'ok',
    hasApiKey: !!process.env.DEEPSEEK_API_KEY,
    timestamp: new Date().toISOString(),
  });
}
