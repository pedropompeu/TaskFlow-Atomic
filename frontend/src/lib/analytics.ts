import { api } from './api';
import type { Card } from '@/types';

export interface KpiSnapshot {
  totalCards: number;
  doneCount: number;
  overdueCount: number;
  reopenedCount: number;
}

export interface AnalyticsSummary {
  cardsByStatus: { status: string; count: number }[];
  cardsByAssignee: { assignee: string; count: number }[];
  overdueCards: Card[];
  completionsOverTime: { date: string; count: number; reopened: number }[];
  kpis: {
    current: KpiSnapshot;
    previous: { totalCards: number; doneCount: number } | null;
  };
}

export interface ActivityEvent {
  id: string;
  action: string;
  description: string | null;
  createdAt: string;
  cardId: string;
  cardTitle: string;
  userId: string;
  userName: string;
}

export const analyticsApi = {
  getSummary: (params: { boardId?: string; startDate?: string; endDate?: string }) =>
    api.get<AnalyticsSummary>('/analytics', { params }).then((r) => r.data),
  getActivity: (params: { boardId?: string; startDate?: string; endDate?: string; limit?: number }) =>
    api.get<ActivityEvent[]>('/analytics/activity', { params }).then((r) => r.data),
};
