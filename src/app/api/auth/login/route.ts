import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ message: 'Missing username or password' }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: {
        username: username
      }
    });

    if (!user || user.password !== password) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    // @ts-ignore (ignoring temporary TS cache issue)
    const { password: _, ...userWithoutPassword } = user;
    
    return NextResponse.json(userWithoutPassword);
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
