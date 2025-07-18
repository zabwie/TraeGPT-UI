import { NextRequest, NextResponse } from 'next/server';

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File;
  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  // Convert file to buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Use the nlpconnect/vit-gpt2-image-captioning model for image captioning
  const model = 'nlpconnect/vit-gpt2-image-captioning';

  const hfRes = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY || ''}`,
      'Content-Type': 'application/octet-stream',
    },
    body: buffer,
  });

  if (!hfRes.ok) {
    const err = await hfRes.text();
    return NextResponse.json({ error: 'HuggingFace API error', detail: err }, { status: 500 });
  }

  const data = await hfRes.json();
  return NextResponse.json(data);
} 