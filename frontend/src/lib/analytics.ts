import { api } from './api';
import type { Card } from '@/types';

export interface KpiSnapshot {
  totalCards: number;
  doneCount: number;
  overdueCount: number;
}

export interface AnalyticsSummary {
  cardsByStatus: { status: string; count: number }[];
  cardsByAssignee: { assignee: string; count: number }[];
  overdueCards: Card[];
  completionsOverTime: { date: string; count: number }[];
  kpis: {
    current: KpiSnapshot;
    previous: { totalCards: number; doneCount: number } | null;
  };
}

export const analyticsApi = {
  getSummary: (params: { boardId?: string; startDate?: string; endDate?: string }) =>
    api.get<AnalyticsSummary>('/analytics', { params }).then((r) => r.data),
};
