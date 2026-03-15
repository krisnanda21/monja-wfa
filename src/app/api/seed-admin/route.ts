import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const existingAdmin = await prisma.user.findFirst({
       where: { role: { contains: 'Admin' } }
    });

    if (existingAdmin) {
      return NextResponse.json({ message: 'Admin already exists' });
    }

    const newAdmin = await prisma.user.create({
      data: {
        username: 'admin',
        password: 'password123',
        name: 'Administrator',
        position: 'System Admin',
        subbagian: 'Khusus',
        role: 'Admin'
      }
    });

    return NextResponse.json({ message: 'Admin created successfully', username: newAdmin.username });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
