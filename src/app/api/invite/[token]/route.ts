import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const invite = await prisma.invite.findUnique({
    where: { token },
    include: {
      project: { select: { id: true, name: true, description: true } }
    }
  });

  if (!invite) {
    return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
  }

  if (invite.status !== 'PENDING') {
    return NextResponse.json({ error: 'Invite already used or expired' }, { status: 400 });
  }

  if (new Date() > invite.expiresAt) {
    await prisma.invite.update({
      where: { token },
      data: { status: 'EXPIRED' }
    });
    return NextResponse.json({ error: 'Invite expired' }, { status: 400 });
  }

  return NextResponse.json({
    email: invite.email,
    project: invite.project
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { token } = await params;

  const invite = await prisma.invite.findUnique({
    where: { token }
  });

  if (!invite) {
    return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
  }

  if (invite.status !== 'PENDING') {
    return NextResponse.json({ error: 'Invite already used or expired' }, { status: 400 });
  }

  if (new Date() > invite.expiresAt) {
    await prisma.invite.update({
      where: { token },
      data: { status: 'EXPIRED' }
    });
    return NextResponse.json({ error: 'Invite expired' }, { status: 400 });
  }

  // Check email matches
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (user?.email !== invite.email) {
    return NextResponse.json({ error: 'This invite is for a different email address' }, { status: 403 });
  }

  // Add user to project
  await prisma.$transaction([
    prisma.projectMember.create({
      data: {
        userId: session.user.id,
        projectId: invite.projectId,
        role: 'MEMBER'
      }
    }),
    prisma.invite.update({
      where: { token },
      data: { status: 'ACCEPTED' }
    })
  ]);

  return NextResponse.json({ success: true, projectId: invite.projectId });
}
