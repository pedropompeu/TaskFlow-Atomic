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
  assignees: User[];
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
  coverType: 'color' | 'gradient' | 'image' | null;
  coverValue: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BoardMemberEntry {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: 'owner' | 'editor';
  memberId?: string;
}

export interface BoardMembers {
  owner: BoardMemberEntry;
  members: BoardMemberEntry[];
}

export type NotificationType = 'board_invite' | 'card_assigned';

export interface AppNotification {
  id: string;
  type: NotificationType;
  payload: Record<string, any>;
  read: boolean;
  createdAt: string;
}

export const COLUMN_CONFIG: { status: CardStatus; title: string; accent: string }[] = [
  { status: 'todo',        title: 'A Fazer',       accent: 'border-t-atomic-gray-500' },
  { status: 'in_progress', title: 'Em Andamento',  accent: 'border-t-atomic-orange' },
  { status: 'in_review',   title: 'Em Revisão',    accent: 'border-t-atomic-purple' },
  { status: 'done',        title: 'Concluído',     accent: 'border-t-atomic-green' },
];

export const PRIORITY_META: Record<CardPriority, { label: string; classes: string; accent: string }> = {
  low:    { label: 'Baixa',   classes: 'bg-atomic-ice text-atomic-gray-600',          accent: '#D9D9D9' },
  medium: { label: 'Média',   classes: 'bg-atomic-yellow/20 text-amber-700',          accent: '#FDCC32' },
  high:   { label: 'Alta',    classes: 'bg-atomic-orange/15 text-atomic-orange',      accent: '#F78E2F' },
  urgent: { label: 'Urgente', classes: 'bg-red-100 text-red-600',                     accent: '#EF4444' },
};
