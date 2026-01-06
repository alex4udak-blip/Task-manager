import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { projectId } = await params;
  const member = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId: session.user.id, projectId } }
  });

  if (!member) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const members = await prisma.projectMember.findMany({
    where: { projectId },
    include: { user: { select: { id: true, name: true, email: true } } }
  });

  return NextResponse.json(members);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { projectId } = await params;
  const { searchParams } = new URL(request.url);
  const memberIdToRemove = searchParams.get('memberId');

  if (!memberIdToRemove) {
    return NextResponse.json({ error: 'Member ID required' }, { status: 400 });
  }

  const currentMember = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId: session.user.id, projectId } }
  });

  if (!currentMember || !['OWNER', 'ADMIN'].includes(currentMember.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const memberToRemove = await prisma.projectMember.findUnique({
    where: { id: memberIdToRemove }
  });

  if (!memberToRemove || memberToRemove.projectId !== projectId) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 });
  }

  if (memberToRemove.role === 'OWNER') {
    return NextResponse.json({ error: 'Cannot remove owner' }, { status: 400 });
  }

  await prisma.projectMember.delete({ where: { id: memberIdToRemove } });

  return NextResponse.json({ success: true });
}
