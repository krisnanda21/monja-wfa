import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function POST(req: Request) {
  try {
    const data = await req.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file found' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const filename = `${uniqueSuffix}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    
    // Write to public/uploads
    const path = join(process.cwd(), 'public', 'uploads', filename);
    await writeFile(path, buffer);

    // Return the URL
    const url = `/uploads/${filename}`;
    
    return NextResponse.json({ success: true, url });
  } catch (error) {
    console.error('Upload Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to upload' }, { status: 500 });
  }
}
