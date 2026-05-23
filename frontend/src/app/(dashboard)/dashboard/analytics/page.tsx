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
import { format, formatDistanceToNow, subDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AlertTriangle, ArrowRightLeft, Calendar, Clock, LayoutGrid,
  PlusCircle, Tag, TrendingDown, TrendingUp, Trash2, ArrowRight, Minus,
  UserCheck, UserMinus, Pencil, Paperclip, RotateCcw,
} from 'lucide-react';
import { analyticsApi, type ActivityEvent } from '@/lib/analytics';
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

/* ─── Activity Feed helpers ─────────────────────────────────────────────── */
function ActivityIcon({ action }: { action: string }) {
  const cls = 'shrink-0';
  switch (action) {
    case 'created':          return <PlusCircle    size={13} className={cn(cls, 'text-green-500')} />;
    case 'moved':            return <ArrowRightLeft size={13} className={cn(cls, 'text-blue-500')} />;
    case 'assigned':         return <UserCheck      size={13} className={cn(cls, 'text-atomic-orange')} />;
    case 'unassigned':       return <UserMinus      size={13} className={cn(cls, 'text-stone-400')} />;
    case 'updated':          return <Pencil         size={13} className={cn(cls, 'text-stone-500')} />;
    case 'attachment_added': return <Paperclip      size={13} className={cn(cls, 'text-stone-500')} />;
    case 'tag_added':        return <Tag            size={13} className={cn(cls, 'text-purple-500')} />;
    case 'tag_removed':      return <Tag            size={13} className={cn(cls, 'text-stone-400')} />;
    case 'due_date_set':     return <Calendar       size={13} className={cn(cls, 'text-atomic-orange')} />;
    case 'deleted':          return <Trash2         size={13} className={cn(cls, 'text-red-500')} />;
    case 'restored':         return <RotateCcw      size={13} className={cn(cls, 'text-green-600')} />;
    default:                 return <div className="w-2 h-2 rounded-full bg-stone-300" />;
  }
}

/* ─── Page ──────────────────────────────────────────────────────────────── */
type Tab = 'dashboard' | 'activity';

export default function AnalyticsPage() {
  const router = useRouter();
  const [tab, setTab]             = useState<Tab>('dashboard');
  const [boardId, setBoardId]     = useState('');
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate]     = useState(format(new Date(), 'yyyy-MM-dd'));

  const { data: boards = [] } = useQuery({ queryKey: ['boards'], queryFn: boardsApi.list });

  const { data, isLoading } = useQuery({
    queryKey: ['analytics', boardId, startDate, endDate],
    queryFn: () => analyticsApi.getSummary({ boardId: boardId || undefined, startDate, endDate }),
  });

  const { data: activityEvents = [], isLoading: activityLoading } = useQuery({
    queryKey: ['analytics-activity', boardId, startDate, endDate],
    queryFn: () => analyticsApi.getActivity({ boardId: boardId || undefined, startDate, endDate, limit: 100 }),
    enabled: tab === 'activity',
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

      {/* ── Tabs ── */}
      <div className="flex gap-1 border-b border-atomic-gray-300/30">
        {([['dashboard', 'Dashboard', <LayoutGrid size={13} />], ['activity', 'Atividade', <Clock size={13} />]] as const).map(
          ([id, label, icon]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
                tab === id
                  ? 'border-atomic-orange text-atomic-orange'
                  : 'border-transparent text-atomic-gray-500 hover:text-atomic-dark',
              )}
            >
              {icon}{label}
            </button>
          ),
        )}
      </div>

      {/* ── Activity Tab ── */}
      {tab === 'activity' && (
        <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-atomic-gray-300/20 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-atomic-dark/80 mb-4 flex items-center gap-2">
            <Clock size={14} className="text-atomic-orange" />
            Histórico de Atividades
          </h3>
          {activityLoading ? (
            <div className="space-y-3">
              {[1,2,3,4,5].map((i) => (
                <div key={i} className="h-10 bg-stone-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : activityEvents.length === 0 ? (
            <Empty />
          ) : (
            <div className="space-y-1">
              {activityEvents.map((event: ActivityEvent) => (
                <div
                  key={event.id}
                  className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-stone-50 transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-stone-100 flex items-center justify-center shrink-0 mt-0.5">
                    <ActivityIcon action={event.action} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-stone-700 leading-snug">
                      <span className="font-semibold">{event.userName}</span>
                      {event.description ? ` — ${event.description}` : ''}
                    </p>
                    <p className="text-xs text-stone-400 mt-0.5 truncate">
                      {event.cardTitle} ·{' '}
                      {formatDistanceToNow(parseISO(event.createdAt), { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'dashboard' && (isLoading ? (
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
      ))}
    </div>
  );
}
