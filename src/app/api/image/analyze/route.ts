import { NextRequest, NextResponse } from 'next/server';

interface OWLViTResult {
  label: string;
  score?: number;
  box?: {
    xmin: number;
    ymin: number;
    xmax: number;
    ymax: number;
  };
}

export async function POST(req: NextRequest) {
  const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
  const HF_API_URL = 'https://api-inference.huggingface.co/models/google/owlvit-base-patch32';
  
  if (!HF_API_KEY) {
    return NextResponse.json({ error: 'HuggingFace API key not set on server.' }, { status: 500 });
  }
  
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    console.log('[Image Analyze] Processing file:', file.name, 'size:', file.size);
    
    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Add timeout to the fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const start = Date.now();
    const response = await fetch(HF_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/octet-stream',
      },
      body: buffer,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    const elapsed = Date.now() - start;
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Image Analyze] HuggingFace API error:', response.status, errorText);
      return NextResponse.json({ 
        error: 'Image analysis failed', 
        detail: errorText,
        status: response.status 
      }, { status: response.status });
    }
    
    const data = await response.json() as OWLViTResult[];
    console.log('[Image Analyze] Success, elapsed:', elapsed + 'ms');
    
    // Process the OWL-ViT output to create a text description
    let imageDescription = "I can see in this image: ";
    
    if (data && Array.isArray(data) && data.length > 0) {
      const detectedObjects = data.map((item: OWLViTResult) => {
        const label = item.label || 'object';
        const score = item.score ? ` (${(item.score * 100).toFixed(1)}% confidence)` : '';
        return label + score;
      });
      
      imageDescription += detectedObjects.join(", ") + ".";
    } else {
      imageDescription += "various objects and elements.";
    }
    
    return NextResponse.json({
      description: imageDescription,
      raw_data: data,
      analysis_time: elapsed / 1000
    });
    
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return NextResponse.json({ error: 'Image analysis timeout' }, { status: 408 });
    }
    console.error('[Image Analyze] Error:', err);
    return NextResponse.json({ 
      error: 'Image analysis failed', 
      detail: String(err) 
    }, { status: 500 });
  }
} 