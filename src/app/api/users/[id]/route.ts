import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, position, subbagian, role, password } = body;

    // Build the update data dynamically to allow partial updates
    const updateData: any = {};
    if (name) updateData.name = name;
    if (position) updateData.position = position;
    if (subbagian) updateData.subbagian = subbagian;
    if (role) {
      let rolesArray: string[] = Array.isArray(role) ? role : typeof role === 'string' ? role.split(',') : [];
      
      if (rolesArray.includes('Koordinator')) {
        const count = await prisma.user.count({ where: { role: { contains: 'Koordinator' }, id: { not: id } } });
        if (count >= 1) return NextResponse.json({ message: 'Warning: Sudah batas maksimum (1 Koordinator).' }, { status: 400 });
      }
      if (rolesArray.includes('Assesor Utama')) {
        const count = await prisma.user.count({ where: { role: { contains: 'Assesor Utama' }, id: { not: id } } });
        if (count >= 1) return NextResponse.json({ message: 'Warning: Sudah batas maksimum (1 Assesor Utama).' }, { status: 400 });
      }
      if (rolesArray.includes('Subkoordinator')) {
        const count = await prisma.user.count({ where: { role: { contains: 'Subkoordinator' }, id: { not: id } } });
        if (count >= 3) return NextResponse.json({ message: 'Warning: Sudah batas maksimum (3 Subkoordinator).' }, { status: 400 });
      }
      
      updateData.role = rolesArray.join(',');
    }
    if (password) updateData.password = password;

    const user = await prisma.user.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    await prisma.user.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
