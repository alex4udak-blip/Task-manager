import { Task, Project, User, ProjectMember, Invite, TaskStatus, Priority, Role } from '@prisma/client';

export type { Task, Project, User, ProjectMember, Invite, TaskStatus, Priority, Role };

export type TaskWithAssignee = Task & {
  assignee: Pick<User, 'id' | 'name' | 'email'> | null;
  creator: Pick<User, 'id' | 'name' | 'email'>;
};

export type ProjectWithMembers = Project & {
  owner: Pick<User, 'id' | 'name' | 'email'>;
  members: (ProjectMember & {
    user: Pick<User, 'id' | 'name' | 'email'>;
  })[];
  _count: {
    tasks: number;
  };
};

export type ProjectMemberWithUser = ProjectMember & {
  user: Pick<User, 'id' | 'name' | 'email'>;
};

declare module 'next-auth' {
  interface User {
    id: string;
  }
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
    };
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    id: string;
  }
}
