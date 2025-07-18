import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY;
  const TOGETHER_API_URL = process.env.TOGETHER_API_URL || 'https://api.together.xyz/v1/chat/completions';
  if (!TOGETHER_API_KEY) {
    return res.status(500).json({ error: 'TogetherAI API key not set on server.' });
  }
  try {
    const { messages } = req.body;
    const togetherRes = await fetch(TOGETHER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOGETHER_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'moonshotai/kimi-k2-instruct',
        messages,
      }),
    });
    const data = await togetherRes.json();
    return res.status(togetherRes.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'TogetherAI proxy error', detail: String(err) });
  }
} 