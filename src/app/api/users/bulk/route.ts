import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { csvData } = body;

    if (!csvData) {
      return NextResponse.json({ message: 'No CSV data provided' }, { status: 400 });
    }

    // Basic CSV parsing
    const lines = csvData.split('\n').map((line: string) => line.trim()).filter(Boolean);
    if (lines.length < 2) {
      return NextResponse.json({ message: 'CSV must contain headers and at least one row' }, { status: 400 });
    }

    const headers = lines[0].split(',').map((h: string) => h.trim().toLowerCase());
    
    // allow 'password' to be optional as a header if we fall back, but 'username' is required
    const requiredHeaders = ['name', 'username', 'position', 'subbagian'];
    for (const req of requiredHeaders) {
      if (!headers.includes(req)) {
        return NextResponse.json({ message: `Missing required header: ${req}` }, { status: 400 });
      }
    }

    const validRoles = ['Admin', 'Anggota Tim', 'Ketua Tim', 'Dalnis', 'Subkoordinator', 'Koordinator'];
    const validSubbagian = ['Penkom', 'Bangkom', 'Pembinaan', 'Khusus'];

    const newUsers: Array<{name: string, username: string, password?: string, position: string, subbagian: string, role: string}> = [];

    // Parse rows
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v: string) => v.trim());
      const rowData: Record<string, string> = {};
      
      headers.forEach((header: string, index: number) => {
        rowData[header] = values[index];
      });

      if (!rowData.name || !rowData.username || !rowData.position || !rowData.subbagian) continue;
      
      if (!validSubbagian.includes(rowData.subbagian)) {
         return NextResponse.json({ message: `Row ${i+1}: Invalid subbagian "${rowData.subbagian}". Valid options: ${validSubbagian.join(', ')}` }, { status: 400 });
      }

      newUsers.push({
        name: rowData.name,
        username: rowData.username,
        password: rowData.password || 'password123',
        position: rowData.position,
        subbagian: rowData.subbagian,
        role: ''
      });
    }

    if (newUsers.length === 0) {
      return NextResponse.json({ message: 'No valid rows found to insert' }, { status: 400 });
    }

    const result = await prisma.user.createMany({
      data: newUsers
    });

    return NextResponse.json({ message: 'Success', count: result.count }, { status: 201 });
  } catch (error) {
    console.error('Error bulk adding users:', error);
    return NextResponse.json({ message: 'Internal server error while parsing/inserting' }, { status: 500 });
  }
}
