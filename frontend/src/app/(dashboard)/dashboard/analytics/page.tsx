'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { format, subDays, parseISO, isPast } from 'date-fns';
import { AlertTriangle, Calendar, TrendingUp } from 'lucide-react';
import { analyticsApi } from '@/lib/analytics';
import { boardsApi } from '@/lib/boards';
import { COLUMN_CONFIG } from '@/types';

const STATUS_COLORS: Record<string, string> = {
  todo: '#9CA3AF',
  in_progress: '#3B82F6',
  in_review: '#F59E0B',
  done: '#10B981',
};

const ASSIGNEE_COLORS = [
  '#6366F1', '#EC4899', '#F97316', '#14B8A6', '#8B5CF6', '#EF4444',
];

const STATUS_LABEL: Record<string, string> = {
  todo: 'A Fazer',
  in_progress: 'Em Andamento',
  in_review: 'Em Revisão',
  done: 'Concluído',
};

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4 shadow-sm">
      <div className="p-2.5 bg-gray-50 rounded-lg text-gray-500">{icon}</div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function ChartShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">{title}</h3>
      {children}
    </div>
  );
}

export default function AnalyticsPage() {
  const [boardId, setBoardId] = useState('');
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const { data: boards = [] } = useQuery({
    queryKey: ['boards'],
    queryFn: boardsApi.list,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['analytics', boardId, startDate, endDate],
    queryFn: () =>
      analyticsApi.getSummary({
        boardId: boardId || undefined,
        startDate,
        endDate,
      }),
  });

  const cardsByStatus = (data?.cardsByStatus ?? []).map((d) => ({
    ...d,
    label: STATUS_LABEL[d.status] ?? d.status,
    fill: STATUS_COLORS[d.status] ?? '#6B7280',
  }));

  const totalCards = cardsByStatus.reduce((s, d) => s + d.count, 0);
  const doneCount = cardsByStatus.find((d) => d.status === 'done')?.count ?? 0;
  const overdueCount = data?.overdueCards?.length ?? 0;

  return (
    <div className="space-y-6">
      {/* Header + Filters */}
      <div className="flex flex-wrap items-end gap-4 justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Analytics</h2>
          <p className="text-sm text-gray-500 mt-0.5">Visão geral de desempenho dos cards</p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Board</label>
            <select
              value={boardId}
              onChange={(e) => setBoardId(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Todos os boards</option>
              {boards.map((b) => (
                <option key={b.id} value={b.id}>{b.title}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">De</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Até</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              label="Total de cards no período"
              value={totalCards}
              icon={<Calendar size={18} />}
            />
            <StatCard
              label="Cards concluídos"
              value={doneCount}
              icon={<TrendingUp size={18} />}
            />
            <StatCard
              label="Cards em atraso"
              value={overdueCount}
              icon={<AlertTriangle size={18} />}
            />
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cards by Status — Pie */}
            <ChartShell title="Cards por Status">
              {cardsByStatus.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-10">Sem dados no período</p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={cardsByStatus}
                      dataKey="count"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={({ label, percent }) =>
                        `${label} (${(percent * 100).toFixed(0)}%)`
                      }
                      labelLine={false}
                    >
                      {cardsByStatus.map((entry) => (
                        <Cell key={entry.status} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val) => [`${val} cards`, '']} />
                    <Legend
                      formatter={(value) => (
                        <span className="text-xs text-gray-600">{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </ChartShell>

            {/* Cards by Assignee — Bar */}
            <ChartShell title="Cards por Responsável">
              {(data?.cardsByAssignee ?? []).length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-10">Sem dados no período</p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart
                    data={data?.cardsByAssignee ?? []}
                    layout="vertical"
                    margin={{ left: 16, right: 16, top: 4, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <YAxis
                      type="category"
                      dataKey="assignee"
                      width={90}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip formatter={(val) => [`${val} cards`, 'Total']} />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {(data?.cardsByAssignee ?? []).map((_, i) => (
                        <Cell key={i} fill={ASSIGNEE_COLORS[i % ASSIGNEE_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartShell>
          </div>

          {/* Completions over time — Line */}
          <ChartShell title="Conclusões ao longo do tempo">
            {(data?.completionsOverTime ?? []).length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-10">
                Nenhum card concluído no período selecionado
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart
                  data={data?.completionsOverTime ?? []}
                  margin={{ left: 0, right: 16, top: 4, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(d) => {
                      try { return format(parseISO(d), 'dd/MM'); } catch { return d; }
                    }}
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip
                    labelFormatter={(d) => {
                      try { return format(parseISO(String(d)), 'dd/MM/yyyy'); } catch { return d; }
                    }}
                    formatter={(val) => [`${val} cards concluídos`, '']}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#10B981"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#10B981' }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </ChartShell>

          {/* Overdue cards */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <AlertTriangle size={14} className="text-red-500" />
              Cards em Atraso
              {overdueCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-red-100 text-red-600 text-xs rounded-full font-medium">
                  {overdueCount}
                </span>
              )}
            </h3>

            {overdueCount === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">
                Nenhum card em atraso. Ótimo trabalho!
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-400 uppercase tracking-wider border-b border-gray-100">
                      <th className="pb-2 font-medium">Título</th>
                      <th className="pb-2 font-medium">Status</th>
                      <th className="pb-2 font-medium">Responsável</th>
                      <th className="pb-2 font-medium">Prazo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {(data?.overdueCards ?? []).map((card) => {
                      const col = COLUMN_CONFIG.find((c) => c.status === card.status);
                      return (
                        <tr key={card.id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-2.5 pr-4 font-medium text-gray-800 truncate max-w-xs">
                            {card.title}
                          </td>
                          <td className="py-2.5 pr-4">
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                              {col?.title ?? card.status}
                            </span>
                          </td>
                          <td className="py-2.5 pr-4 text-gray-600">
                            {card.assignedTo?.name ?? '—'}
                          </td>
                          <td className="py-2.5 text-red-600 font-medium">
                            {card.dueDate
                              ? format(parseISO(card.dueDate), 'dd/MM/yyyy HH:mm')
                              : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
