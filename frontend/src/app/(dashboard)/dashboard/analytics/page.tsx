'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  ResponsiveContainer,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  LineChart, Line,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { format, subDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AlertTriangle, Calendar, TrendingUp, TrendingDown,
  LayoutGrid, ArrowRight, Minus,
} from 'lucide-react';
import { analyticsApi } from '@/lib/analytics';
import { boardsApi } from '@/lib/boards';
import { COLUMN_CONFIG } from '@/types';
import { cn } from '@/lib/utils';

/* ─── Paleta atômica para gráficos ─────────────────────────────────────── */
const ATOMIC = {
  orange: '#F78E2F',
  purple: '#A559FD',
  green:  '#43AC8D',
  blue:   '#1D84B7',
  yellow: '#FDCC32',
  gray:   '#999999',
};

const STATUS_COLORS: Record<string, string> = {
  todo:        ATOMIC.gray,
  in_progress: ATOMIC.orange,
  in_review:   ATOMIC.purple,
  done:        ATOMIC.green,
};

const ASSIGNEE_COLORS = [ATOMIC.orange, ATOMIC.purple, ATOMIC.green, ATOMIC.blue, ATOMIC.yellow, ATOMIC.gray];

const STATUS_LABEL: Record<string, string> = {
  todo:        'A Fazer',
  in_progress: 'Em Andamento',
  in_review:   'Em Revisão',
  done:        'Concluído',
};

const TICK_STYLE = { fontSize: 11, fill: '#7A7A7A' };

/* ─── Trend helper ──────────────────────────────────────────────────────── */
function calcTrend(current: number, previous: number) {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

/* ─── KPI Card ──────────────────────────────────────────────────────────── */
interface KpiCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  trend?: number | null;
  trendInverted?: boolean; // para "em atraso": menos = melhor
}
function KpiCard({ label, value, icon, trend, trendInverted = false }: KpiCardProps) {
  const isUp   = trend !== null && trend !== undefined && trend > 0;
  const isDown = trend !== null && trend !== undefined && trend < 0;
  const good   = trendInverted ? isDown : isUp;
  const bad    = trendInverted ? isUp   : isDown;

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-atomic-gray-300/20 p-5 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className="p-2.5 bg-atomic-orange/10 rounded-lg text-atomic-orange">{icon}</div>
        {trend !== null && trend !== undefined ? (
          <span className={cn(
            'flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full',
            good ? 'bg-green-100 text-green-700' : bad ? 'bg-red-100 text-red-600' : 'bg-atomic-ice text-atomic-gray-600',
          )}>
            {isUp ? <TrendingUp size={11} /> : isDown ? <TrendingDown size={11} /> : <Minus size={11} />}
            {Math.abs(trend)}%
          </span>
        ) : null}
      </div>
      <p className="text-3xl font-bold text-atomic-dark tracking-tight">{value}</p>
      <p className="text-xs text-atomic-gray-500 mt-1">{label}</p>
    </div>
  );
}

/* ─── Chart Shell ───────────────────────────────────────────────────────── */
function ChartShell({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('bg-white/90 backdrop-blur-sm rounded-xl border border-atomic-gray-300/20 p-5 shadow-sm', className)}>
      <h3 className="text-sm font-semibold text-atomic-dark/80 mb-4">{title}</h3>
      {children}
    </div>
  );
}

function Empty() {
  return <p className="text-sm text-atomic-gray-500/70 text-center py-10">Sem dados no período</p>;
}

/* ─── Page ──────────────────────────────────────────────────────────────── */
export default function AnalyticsPage() {
  const router = useRouter();
  const [boardId, setBoardId]     = useState('');
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate]     = useState(format(new Date(), 'yyyy-MM-dd'));

  const { data: boards = [] } = useQuery({ queryKey: ['boards'], queryFn: boardsApi.list });

  const { data, isLoading } = useQuery({
    queryKey: ['analytics', boardId, startDate, endDate],
    queryFn: () => analyticsApi.getSummary({ boardId: boardId || undefined, startDate, endDate }),
  });

  const kpis     = data?.kpis;
  const prev     = kpis?.previous ?? null;
  const cur      = kpis?.current;
  const overdue  = data?.overdueCards ?? [];

  const cardsByStatus = (data?.cardsByStatus ?? []).map((d) => ({
    ...d,
    label: STATUS_LABEL[d.status] ?? d.status,
    fill:  STATUS_COLORS[d.status] ?? ATOMIC.gray,
  }));

  return (
    <div className="space-y-6">

      {/* ── Header + Filtros ── */}
      <div className="flex flex-wrap items-end gap-4 justify-between">
        <div>
          <h2 className="text-xl font-bold text-atomic-dark">Análises</h2>
          <p className="text-sm text-atomic-gray-500 mt-0.5">Desempenho do time no período selecionado</p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-atomic-gray-500">Quadro</label>
            <select
              value={boardId}
              onChange={(e) => setBoardId(e.target.value)}
              className="px-3 py-2 text-sm border border-atomic-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-atomic-orange/40 bg-white/80"
            >
              <option value="">Todos os quadros</option>
              {boards.map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}
            </select>
          </div>
          {(['De', 'Até'] as const).map((lbl, i) => (
            <div key={lbl} className="flex flex-col gap-1">
              <label className="text-xs font-medium text-atomic-gray-500">{lbl}</label>
              <input
                type="date"
                value={i === 0 ? startDate : endDate}
                onChange={(e) => i === 0 ? setStartDate(e.target.value) : setEndDate(e.target.value)}
                className="px-3 py-2 text-sm border border-atomic-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-atomic-orange/40 bg-white/80"
              />
            </div>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-pulse">
          {[1, 2, 3].map((i) => <div key={i} className="h-28 bg-atomic-ice rounded-xl" />)}
        </div>
      ) : (
        <>
          {/* ── KPIs ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KpiCard
              label="Cards no período"
              value={cur?.totalCards ?? 0}
              icon={<Calendar size={18} />}
              trend={prev ? calcTrend(cur!.totalCards, prev.totalCards) : null}
            />
            <KpiCard
              label="Cards concluídos"
              value={cur?.doneCount ?? 0}
              icon={<TrendingUp size={18} />}
              trend={prev ? calcTrend(cur!.doneCount, prev.doneCount) : null}
            />
            <KpiCard
              label="Cards em atraso"
              value={cur?.overdueCount ?? 0}
              icon={<AlertTriangle size={18} />}
              trendInverted
            />
          </div>

          {/* ── Throughput — narrativa principal ── */}
          <ChartShell title="Throughput — Conclusões ao Longo do Tempo">
            {(data?.completionsOverTime ?? []).length === 0 ? <Empty /> : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={data?.completionsOverTime ?? []} margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
                  <defs>
                    <linearGradient id="lineGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={ATOMIC.green} stopOpacity={0.15} />
                      <stop offset="95%" stopColor={ATOMIC.green} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8F0F4" />
                  <XAxis
                    dataKey="date" tick={TICK_STYLE}
                    tickFormatter={(d) => { try { return format(parseISO(d), 'dd/MM', { locale: ptBR }); } catch { return d; } }}
                  />
                  <YAxis allowDecimals={false} tick={TICK_STYLE} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.10)' }}
                    labelFormatter={(d) => { try { return format(parseISO(String(d)), 'dd/MM/yyyy', { locale: ptBR }); } catch { return d; } }}
                    formatter={(val) => [`${val} cards`, 'Concluídos']}
                  />
                  <Line
                    type="monotone" dataKey="count"
                    stroke={ATOMIC.green} strokeWidth={2.5}
                    dot={{ r: 3, fill: ATOMIC.green, strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: ATOMIC.green }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </ChartShell>

          {/* ── Status + Responsável ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartShell title="Distribuição por Status">
              {cardsByStatus.length === 0 ? <Empty /> : (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={cardsByStatus} dataKey="count" nameKey="label"
                      cx="50%" cy="50%" outerRadius={88} innerRadius={44}
                      paddingAngle={3}
                      label={({ label, percent }) => `${label} · ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {cardsByStatus.map((entry) => (
                        <Cell key={entry.status} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.10)' }}
                      formatter={(val) => [`${val} cards`, '']}
                    />
                    <Legend formatter={(v) => <span className="text-xs text-atomic-gray-600">{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </ChartShell>

            <ChartShell title="Cards por Responsável">
              {(data?.cardsByAssignee ?? []).length === 0 ? <Empty /> : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart
                    data={data?.cardsByAssignee ?? []}
                    layout="vertical"
                    margin={{ left: 16, right: 16, top: 4, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E8F0F4" />
                    <XAxis type="number" allowDecimals={false} tick={TICK_STYLE} />
                    <YAxis type="category" dataKey="assignee" width={90} tick={TICK_STYLE} />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.10)' }}
                      formatter={(val) => [`${val} cards`, 'Total']}
                    />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                      {(data?.cardsByAssignee ?? []).map((_, i) => (
                        <Cell key={i} fill={ASSIGNEE_COLORS[i % ASSIGNEE_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartShell>
          </div>

          {/* ── Cards em Atraso ── */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-atomic-gray-300/20 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-atomic-dark/80 flex items-center gap-2">
                <AlertTriangle size={14} className="text-red-500" />
                Cards em Atraso
              </h3>
              {overdue.length > 0 && (
                <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-semibold rounded-full">
                  {overdue.length}
                </span>
              )}
            </div>

            {overdue.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <TrendingUp size={18} className="text-green-600" />
                </div>
                <p className="text-sm text-atomic-gray-500">Nenhum card em atraso. Ótimo trabalho!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-atomic-gray-500/70 uppercase tracking-wider border-b border-atomic-ice">
                      <th className="pb-2 font-medium">Título</th>
                      <th className="pb-2 font-medium">Status</th>
                      <th className="pb-2 font-medium">Responsável</th>
                      <th className="pb-2 font-medium">Prazo</th>
                      <th className="pb-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-atomic-ice">
                    {overdue.map((card) => {
                      const col = COLUMN_CONFIG.find((c) => c.status === card.status);
                      const daysLate = card.dueDate
                        ? Math.ceil((Date.now() - new Date(card.dueDate).getTime()) / 86_400_000)
                        : 0;
                      return (
                        <tr key={card.id} className="hover:bg-atomic-ice/50 transition-colors">
                          <td className="py-3 pr-4 font-medium text-atomic-dark truncate max-w-[200px]">
                            {card.title}
                          </td>
                          <td className="py-3 pr-4">
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-atomic-ice text-atomic-gray-600">
                              {col?.title ?? card.status}
                            </span>
                          </td>
                          <td className="py-3 pr-4 text-atomic-gray-600">
                            {card.assignees?.length
                              ? card.assignees.map((a) => a.name.split(' ')[0]).join(', ')
                              : '—'}
                          </td>
                          <td className="py-3 pr-4">
                            <div className="flex flex-col">
                              <span className="text-red-600 font-medium text-xs">
                                {card.dueDate ? format(parseISO(card.dueDate), 'dd/MM/yyyy', { locale: ptBR }) : '—'}
                              </span>
                              {daysLate > 0 && (
                                <span className="text-[10px] text-red-400">{daysLate}d de atraso</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => router.push(`/dashboard/${card.boardId}`)}
                              className="flex items-center gap-1 text-xs text-atomic-orange hover:text-atomic-orange/80 font-medium transition-colors ml-auto"
                            >
                              Ver <ArrowRight size={11} />
                            </button>
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
