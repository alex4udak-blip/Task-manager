import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { projectSchema } from '@/lib/validations';

async function checkProjectAccess(projectId: string, userId: string) {
  const member = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId, projectId } }
  });
  return member;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { projectId } = await params;
  const access = await checkProjectAccess(projectId, session.user.id);
  if (!access) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      members: {
        include: { user: { select: { id: true, name: true, email: true } } }
      },
      _count: { select: { tasks: true } }
    }
  });

  if (!project) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(project);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { projectId } = await params;
  const access = await checkProjectAccess(projectId, session.user.id);
  if (!access || !['OWNER', 'ADMIN'].includes(access.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = projectSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    const project = await prisma.project.update({
      where: { id: projectId },
      data: parsed.data,
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true } } }
        },
        _count: { select: { tasks: true } }
      }
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error('Update project error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { projectId } = await params;
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true }
  });

  if (!project) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (project.ownerId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await prisma.project.delete({ where: { id: projectId } });

  return NextResponse.json({ success: true });
}
