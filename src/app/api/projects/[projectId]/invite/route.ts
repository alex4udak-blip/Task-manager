import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { inviteSchema } from '@/lib/validations';

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

  if (!member || !['OWNER', 'ADMIN'].includes(member.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const invites = await prisma.invite.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' }
  });

  return NextResponse.json(invites);
}

export async function POST(
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

  if (!member || !['OWNER', 'ADMIN'].includes(member.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = inviteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    const { email } = parsed.data;

    // Check if user is already a member
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      const existingMember = await prisma.projectMember.findUnique({
        where: { userId_projectId: { userId: existingUser.id, projectId } }
      });
      if (existingMember) {
        return NextResponse.json({ error: 'User is already a member' }, { status: 400 });
      }
    }

    // Check for existing pending invite
    const existingInvite = await prisma.invite.findUnique({
      where: { email_projectId: { email, projectId } }
    });

    if (existingInvite && existingInvite.status === 'PENDING') {
      return NextResponse.json({ error: 'Invite already sent' }, { status: 400 });
    }

    const invite = await prisma.invite.upsert({
      where: { email_projectId: { email, projectId } },
      update: {
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      },
      create: {
        email,
        projectId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    return NextResponse.json(invite, { status: 201 });
  } catch (error) {
    console.error('Create invite error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
