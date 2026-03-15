import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, username, password, position, role, subbagian } = body;

    if (!name || !username || !position || !role || !subbagian) {
      return NextResponse.json({ message: 'All fields except password are required' }, { status: 400 });
    }

    let rolesArray: string[] = Array.isArray(role) ? role : typeof role === 'string' ? role.split(',') : [];
    
    if (rolesArray.length === 0) {
      return NextResponse.json({ message: 'At least one role is required' }, { status: 400 });
    }

    const validRoles = ['Admin', 'Anggota Tim', 'Ketua Tim', 'Dalnis', 'Subkoordinator', 'Koordinator', 'Assesor Utama'];
    for (const r of rolesArray) {
      if (!validRoles.includes(r.trim())) {
        return NextResponse.json({ message: `Invalid role: ${r}` }, { status: 400 });
      }
    }

    // Checking limits
    if (rolesArray.includes('Koordinator')) {
      const count = await prisma.user.count({ where: { role: { contains: 'Koordinator' } } });
      if (count >= 1) return NextResponse.json({ message: 'Warning: Sudah batas maksimum (1 Koordinator).' }, { status: 400 });
    }
    if (rolesArray.includes('Assesor Utama')) {
      const count = await prisma.user.count({ where: { role: { contains: 'Assesor Utama' } } });
      if (count >= 1) return NextResponse.json({ message: 'Warning: Sudah batas maksimum (1 Assesor Utama).' }, { status: 400 });
    }
    if (rolesArray.includes('Subkoordinator')) {
      const count = await prisma.user.count({ where: { role: { contains: 'Subkoordinator' } } });
      if (count >= 3) return NextResponse.json({ message: 'Warning: Sudah batas maksimum (3 Subkoordinator).' }, { status: 400 });
    }

    const finalRoleString = rolesArray.join(',');

    const validSubbagian = ['Penkom', 'Bangkom', 'Pembinaan', 'Khusus'];
    if (!validSubbagian.includes(subbagian)) {
      return NextResponse.json({ message: 'Invalid subbagian' }, { status: 400 });
    }

    const user = await prisma.user.create({
      data: {
        name,
        username,
        password: password || 'password123',
        position,
        role: finalRoleString,
        subbagian
      }
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('Error adding user:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
