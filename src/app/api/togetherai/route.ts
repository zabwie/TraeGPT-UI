import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY;
  const TOGETHER_API_URL = process.env.TOGETHER_API_URL || 'https://api.together.xyz/v1/chat/completions';
  if (!TOGETHER_API_KEY) {
    return NextResponse.json({ error: 'TogetherAI API key not set on server.' }, { status: 500 });
  }
  try {
    const { messages } = await req.json();
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
    return NextResponse.json(data, { status: togetherRes.status });
  } catch (err) {
    return NextResponse.json({ error: 'TogetherAI proxy error', detail: String(err) }, { status: 500 });
  }
} 