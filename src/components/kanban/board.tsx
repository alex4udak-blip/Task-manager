'use client';

import { useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';
import { Column } from './column';
import { TaskCard } from './task-card';
import { TaskWithAssignee } from '@/types';

const STATUSES = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'] as const;
const STATUS_LABELS: Record<string, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  REVIEW: 'Review',
  DONE: 'Done',
};

interface BoardProps {
  tasks: TaskWithAssignee[];
  projectId: string;
  onTaskUpdate: (taskId: string, data: Partial<TaskWithAssignee>) => Promise<void>;
  onTaskReorder: (taskId: string, newStatus: string, newOrder: number) => Promise<void>;
  onTaskClick: (task: TaskWithAssignee) => void;
}

export function Board({ tasks, projectId, onTaskUpdate, onTaskReorder, onTaskClick }: BoardProps) {
  const [activeTask, setActiveTask] = useState<TaskWithAssignee | null>(null);
  const [localTasks, setLocalTasks] = useState(tasks);

  // Update local tasks when props change
  if (tasks !== localTasks && !activeTask) {
    setLocalTasks(tasks);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const getTasksByStatus = useCallback(
    (status: string) => localTasks.filter((t) => t.status === status).sort((a, b) => a.order - b.order),
    [localTasks]
  );

  const handleDragStart = (event: DragStartEvent) => {
    const task = localTasks.find((t) => t.id === event.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTask = localTasks.find((t) => t.id === activeId);
    if (!activeTask) return;

    // Check if over is a column
    const overStatus = STATUSES.find((s) => s === overId);
    if (overStatus && activeTask.status !== overStatus) {
      setLocalTasks((prev) =>
        prev.map((t) =>
          t.id === activeId ? { ...t, status: overStatus } : t
        )
      );
      return;
    }

    // Check if over is a task
    const overTask = localTasks.find((t) => t.id === overId);
    if (overTask && activeTask.status !== overTask.status) {
      setLocalTasks((prev) =>
        prev.map((t) =>
          t.id === activeId ? { ...t, status: overTask.status } : t
        )
      );
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTask = localTasks.find((t) => t.id === activeId);
    if (!activeTask) return;

    // Determine the target status
    let targetStatus = activeTask.status;
    const overStatus = STATUSES.find((s) => s === overId);
    if (overStatus) {
      targetStatus = overStatus;
    } else {
      const overTask = localTasks.find((t) => t.id === overId);
      if (overTask) {
        targetStatus = overTask.status;
      }
    }

    // Get tasks in target column and determine new order
    const tasksInColumn = localTasks
      .filter((t) => t.status === targetStatus && t.id !== activeId)
      .sort((a, b) => a.order - b.order);

    let newOrder = 0;
    if (overId === targetStatus) {
      // Dropped on column itself - place at end
      newOrder = tasksInColumn.length;
    } else {
      const overIndex = tasksInColumn.findIndex((t) => t.id === overId);
      if (overIndex >= 0) {
        newOrder = overIndex;
      } else {
        newOrder = tasksInColumn.length;
      }
    }

    // Update local state optimistically
    const updatedTasks = localTasks.map((t) => {
      if (t.id === activeId) {
        return { ...t, status: targetStatus, order: newOrder };
      }
      if (t.status === targetStatus && t.order >= newOrder && t.id !== activeId) {
        return { ...t, order: t.order + 1 };
      }
      return t;
    });
    setLocalTasks(updatedTasks);

    // Call API
    try {
      await onTaskReorder(activeId, targetStatus, newOrder);
    } catch (error) {
      // Revert on error
      setLocalTasks(tasks);
      console.error('Failed to reorder task:', error);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STATUSES.map((status) => (
          <Column
            key={status}
            id={status}
            title={STATUS_LABELS[status]}
            tasks={getTasksByStatus(status)}
            onTaskClick={onTaskClick}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? <TaskCard task={activeTask} isDragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}
