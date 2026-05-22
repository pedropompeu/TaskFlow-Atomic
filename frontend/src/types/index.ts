export type CardStatus = 'todo' | 'in_progress' | 'in_review' | 'done';
export type CardPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  createdAt: string;
}

export interface CardTag {
  id: string;
  name: string;
  color: string;
}

export interface CardHistoryEntry {
  id: string;
  userId: string;
  user: User;
  fromStatus: CardStatus | null;
  toStatus: CardStatus | null;
  action: string;
  description: string | null;
  createdAt: string;
}

export interface Attachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  uploadedBy: User;
  createdAt: string;
}

export interface Card {
  id: string;
  boardId: string;
  title: string;
  description: string | null;
  status: CardStatus;
  priority: CardPriority;
  assignedTo: User | null;
  assignedToId: string | null;
  dueDate: string | null;
  position: number;
  tags: CardTag[];
  history: CardHistoryEntry[];
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
}

export interface Board {
  id: string;
  title: string;
  description: string | null;
  ownerId: string;
  cards: Card[];
  createdAt: string;
  updatedAt: string;
}

export const COLUMN_CONFIG: { status: CardStatus; title: string; accent: string }[] = [
  { status: 'todo',        title: 'A Fazer',       accent: 'border-t-stone-400' },
  { status: 'in_progress', title: 'Em Andamento',  accent: 'border-t-orange-500' },
  { status: 'in_review',   title: 'Em Revisão',    accent: 'border-t-amber-500' },
  { status: 'done',        title: 'Concluído',     accent: 'border-t-green-500' },
];

export const PRIORITY_META: Record<CardPriority, { label: string; classes: string }> = {
  low:    { label: 'Baixa',   classes: 'bg-stone-100 text-stone-600' },
  medium: { label: 'Média',   classes: 'bg-amber-100 text-amber-700' },
  high:   { label: 'Alta',    classes: 'bg-orange-100 text-orange-700' },
  urgent: { label: 'Urgente', classes: 'bg-red-100 text-red-700' },
};
