'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TaskWithAssignee } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

const PRIORITY_COLORS: Record<string, string> = {
  URGENT: 'bg-red-500/20 text-red-400 border-red-500/30',
  HIGH: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  MEDIUM: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  LOW: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
};

interface TaskCardProps {
  task: TaskWithAssignee;
  isDragging?: boolean;
  onClick?: () => void;
}

export function TaskCard({ task, isDragging, onClick }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isOverdue =
    task.deadline &&
    new Date(task.deadline) < new Date() &&
    task.status !== 'DONE';

  const assigneeInitials = task.assignee?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || task.assignee?.email?.[0].toUpperCase();

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        'p-3 bg-zinc-800 rounded-lg border border-zinc-700 cursor-pointer hover:border-zinc-600 transition-colors',
        isDragging && 'opacity-50',
        isSortableDragging && 'opacity-50 shadow-xl',
        isOverdue && 'border-red-500/50 bg-red-900/10'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-medium text-white line-clamp-2">{task.title}</h4>
        {task.assignee && (
          <Avatar className="h-6 w-6 flex-shrink-0">
            <AvatarFallback className="text-xs bg-violet-600 text-white">
              {assigneeInitials}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
      {task.description && (
        <p className="mt-1 text-xs text-zinc-400 line-clamp-2">{task.description}</p>
      )}
      <div className="mt-2 flex items-center gap-2 flex-wrap">
        <Badge variant="outline" className={cn('text-xs', PRIORITY_COLORS[task.priority])}>
          {task.priority.toLowerCase()}
        </Badge>
        {task.deadline && (
          <span className={cn('text-xs', isOverdue ? 'text-red-400' : 'text-zinc-500')}>
            {new Date(task.deadline).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  );
}
