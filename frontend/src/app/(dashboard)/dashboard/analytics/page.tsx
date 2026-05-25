'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  ResponsiveContainer,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  AreaChart, Area,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { format, formatDistanceToNow, subDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AlertTriangle, ArrowRightLeft, Calendar, Clock, LayoutGrid,
  PlusCircle, Tag, TrendingDown, TrendingUp, Trash2, ArrowRight, Minus,
  UserCheck, UserMinus, Pencil, Paperclip, RotateCcw, RefreshCw,
} from 'lucide-react';
import { analyticsApi, type ActivityEvent } from '@/lib/analytics';
import { boardsApi } from '@/lib/boards';
import { useAnalyticsSocket } from '@/hooks/useAnalyticsSocket';
import { COLUMN_CONFIG } from '@/types';
import { cn } from '@/lib/utils';

/* ─── Paleta Slate Protocol ─────────────────────────────────────────────── */
const SLATE = {
  accent:  '#527DA3',
  blue:    '#7499BF',
  success: '#7DC4A0',
  info:    '#5BA4CF',
  warning: '#C9A870',
  muted:   '#6B7A8D',
};

const STATUS_COLORS: Record<string, string> = {
  todo:        SLATE.muted,
  in_progress: SLATE.accent,
  in_review:   SLATE.blue,
  done:        SLATE.success,
};

const ASSIGNEE_COLORS = [SLATE.accent, SLATE.blue, SLATE.success, SLATE.info, SLATE.warning, SLATE.muted];

const STATUS_LABEL: Record<string, string> = {
  todo:        'A Fazer',
  in_progress: 'Em Andamento',
  in_review:   'Em Revisão',
  done:        'Concluído',
};

const TICK_STYLE = { fontSize: 11, fill: '#6B7A8D' };

/* ─── Helpers ───────────────────────────────────────────────────────────── */
function calcTrend(current: number, previous: number) {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

function userColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xfffff;
  return ASSIGNEE_COLORS[h % ASSIGNEE_COLORS.length];
}

function userInitials(name: string): string {
  return name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
}

/* ─── KPI Card ──────────────────────────────────────────────────────────── */
interface KpiCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  trend?: number | null;
  trendInverted?: boolean;
  pulse?: boolean;
}
function KpiCard({ label, value, icon, trend, trendInverted = false, pulse }: KpiCardProps) {
  const isUp   = trend !== null && trend !== undefined && trend > 0;
  const isDown = trend !== null && trend !== undefined && trend < 0;
  const good   = trendInverted ? isDown : isUp;
  const bad    = trendInverted ? isUp   : isDown;

  return (
    <div className={cn(
      'bg-brand-surface rounded-xl border p-5 hover:-translate-y-0.5 transition-all duration-300 shadow-brand-card',
      pulse ? 'border-brand-success/40 ring-1 ring-brand-success/20' : 'border-brand-border-subtle',
    )}>
      <div className="flex items-start justify-between mb-3">
        <div className="p-2.5 bg-brand-accent-muted rounded-lg text-brand-accent">{icon}</div>
        {trend !== null && trend !== undefined ? (
          <span className={cn(
            'flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full',
            good ? 'bg-brand-success-subtle text-brand-success-fg' : bad ? 'bg-brand-error-subtle text-brand-error-fg' : 'bg-brand-surface-elevated text-brand-text-muted',
          )}>
            {isUp ? <TrendingUp size={11} /> : isDown ? <TrendingDown size={11} /> : <Minus size={11} />}
            {Math.abs(trend)}%
          </span>
        ) : null}
      </div>
      <p className="text-3xl font-bold text-brand-text-primary tracking-tight">{value}</p>
      <p className="text-xs text-brand-text-secondary mt-1">{label}</p>
    </div>
  );
}

/* ─── Completion Ring ───────────────────────────────────────────────────── */
function CompletionRingCard({ doneCount, totalCards, trend, pulse }: {
  doneCount: number; totalCards: number; trend: number | null; pulse?: boolean;
}) {
  const pct  = totalCards > 0 ? Math.round((doneCount / totalCards) * 100) : 0;
  const r    = 20;
  const circ = 2 * Math.PI * r;
  const arc  = circ * (pct / 100);

  return (
    <div className={cn(
      'bg-brand-surface rounded-xl border p-5 hover:-translate-y-0.5 transition-all duration-300 shadow-brand-card',
      pulse ? 'border-brand-success/40 ring-1 ring-brand-success/20' : 'border-brand-border-subtle',
    )}>
      <div className="flex items-start justify-between mb-3">
        <div className="p-2.5 bg-brand-accent-muted rounded-lg text-brand-accent">
          <TrendingUp size={18} />
        </div>
        {trend !== null && trend !== undefined ? (
          <span className={cn(
            'flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full',
            trend > 0 ? 'bg-brand-success-subtle text-brand-success-fg' : trend < 0 ? 'bg-brand-error-subtle text-brand-error-fg' : 'bg-brand-surface-elevated text-brand-text-muted',
          )}>
            {trend > 0 ? <TrendingUp size={11} /> : trend < 0 ? <TrendingDown size={11} /> : <Minus size={11} />}
            {Math.abs(trend)}%
          </span>
        ) : null}
      </div>
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-3xl font-bold text-brand-text-primary tracking-tight">{doneCount}</p>
          <p className="text-xs text-brand-text-secondary mt-1">Cards concluídos</p>
        </div>
        <div className="relative shrink-0 w-14 h-14">
          <svg viewBox="0 0 52 52" className="w-full h-full" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={26} cy={26} r={r} fill="none" stroke="#1A3028" strokeWidth={7} />
            <circle
              cx={26} cy={26} r={r}
              fill="none" stroke={SLATE.success} strokeWidth={7}
              strokeLinecap="round"
              strokeDasharray={`${arc} ${circ}`}
              style={{ transition: 'stroke-dasharray 0.7s ease-out' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[11px] font-bold text-brand-text-primary leading-none">{pct}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Chart Shell ───────────────────────────────────────────────────────── */
function ChartShell({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('bg-brand-surface rounded-xl border border-brand-border-subtle p-5 shadow-brand-card', className)}>
      <h3 className="text-sm font-semibold text-brand-text-secondary mb-4">{title}</h3>
      {children}
    </div>
  );
}

/* ─── Ilustrações SVG ───────────────────────────────────────────────────── */
function SvgNoData() {
  return (
    <svg width="110" height="84" viewBox="0 0 110 84" fill="none" aria-hidden>
      {/* grid */}
      <line x1="8"  y1="72" x2="102" y2="72" stroke="#C8D8E8" strokeWidth="2" strokeLinecap="round"/>
      <line x1="8"  y1="52" x2="102" y2="52" stroke="#E4EEF6" strokeWidth="1" strokeDasharray="4 3"/>
      <line x1="8"  y1="32" x2="102" y2="32" stroke="#E4EEF6" strokeWidth="1" strokeDasharray="4 3"/>
      {/* bars */}
      <rect x="10" y="46" width="15" height="26" rx="3" fill="#DDE8F4"/>
      <rect x="32" y="34" width="15" height="38" rx="3" fill="#D0E0F0"/>
      <rect x="54" y="54" width="15" height="18" rx="3" fill="#DDE8F4"/>
      <rect x="76" y="40" width="15" height="32" rx="3" fill="#D0E0F0"/>
      {/* bar top caps (dashed effect) */}
      <rect x="10" y="40" width="15" height="6" rx="2" fill="#C4D8EC" opacity="0.5"/>
      <rect x="32" y="28" width="15" height="6" rx="2" fill="#C4D8EC" opacity="0.5"/>
      <rect x="54" y="48" width="15" height="6" rx="2" fill="#C4D8EC" opacity="0.5"/>
      <rect x="76" y="34" width="15" height="6" rx="2" fill="#C4D8EC" opacity="0.5"/>
      {/* floating magnifying glass */}
      <circle cx="55" cy="30" r="21" fill="white" opacity="0.96"/>
      <circle cx="55" cy="30" r="18" fill="#F0F7FC" stroke="#D0E8F4" strokeWidth="1.5"/>
      <circle cx="52" cy="27" r="6.5" stroke="#8EC4DC" strokeWidth="2" fill="none"/>
      <line x1="57"  y1="32" x2="62"  y2="37" stroke="#8EC4DC" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );
}

function SvgPositive() {
  return (
    <svg width="88" height="88" viewBox="0 0 88 88" fill="none" aria-hidden>
      {/* glow rings */}
      <circle cx="44" cy="44" r="40" fill="#F0FDF4" opacity="0.6"/>
      <circle cx="44" cy="44" r="32" fill="#DCFCE7"/>
      <circle cx="44" cy="44" r="23" fill="#BBF7D0"/>
      {/* check */}
      <path d="M31 44l8.5 8.5L57 34" stroke="#16A34A" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
      {/* sparkle dots */}
      <circle cx="16" cy="20" r="3"   fill="#86EFAC"/>
      <circle cx="72" cy="18" r="2.5" fill="#4ADE80"/>
      <circle cx="74" cy="66" r="3"   fill="#86EFAC"/>
      <circle cx="14" cy="64" r="2.5" fill="#4ADE80"/>
      <circle cx="44" cy="8"  r="2"   fill="#BBF7D0"/>
      <circle cx="80" cy="44" r="2"   fill="#BBF7D0"/>
      {/* sparkle lines */}
      <line x1="16" y1="13" x2="16" y2="9"  stroke="#86EFAC" strokeWidth="2" strokeLinecap="round"/>
      <line x1="13" y1="16" x2="9"  y2="16" stroke="#86EFAC" strokeWidth="2" strokeLinecap="round"/>
      <line x1="72" y1="11" x2="72" y2="7"  stroke="#4ADE80" strokeWidth="2" strokeLinecap="round"/>
      <line x1="75" y1="14" x2="79" y2="14" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

function SvgNoActivity() {
  return (
    <svg width="100" height="84" viewBox="0 0 100 84" fill="none" aria-hidden>
      {/* outer shadow */}
      <circle cx="50" cy="44" r="34" fill="#EEF4FA" opacity="0.6"/>
      {/* face */}
      <circle cx="50" cy="44" r="28" fill="white" stroke="#D4E4F0" strokeWidth="2"/>
      {/* hour ticks */}
      <line x1="50" y1="18" x2="50" y2="23" stroke="#C8D8E8" strokeWidth="2"   strokeLinecap="round"/>
      <line x1="50" y1="65" x2="50" y2="70" stroke="#C8D8E8" strokeWidth="2"   strokeLinecap="round"/>
      <line x1="24" y1="44" x2="29" y2="44" stroke="#C8D8E8" strokeWidth="2"   strokeLinecap="round"/>
      <line x1="71" y1="44" x2="76" y2="44" stroke="#C8D8E8" strokeWidth="2"   strokeLinecap="round"/>
      <line x1="30" y1="24" x2="34" y2="27" stroke="#D8E8F0" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="70" y1="24" x2="66" y2="27" stroke="#D8E8F0" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="30" y1="64" x2="34" y2="61" stroke="#D8E8F0" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="70" y1="64" x2="66" y2="61" stroke="#D8E8F0" strokeWidth="1.5" strokeLinecap="round"/>
      {/* hands (10:10) */}
      <line x1="50" y1="44" x2="38" y2="32" stroke="#ACC4DC" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="50" y1="44" x2="62" y2="34" stroke="#ACC4DC" strokeWidth="2"   strokeLinecap="round"/>
      <circle cx="50" cy="44" r="3" fill="#ACC4DC"/>
      {/* silence — floating lines of decreasing width */}
      <line x1="70" y1="22" x2="82" y2="22" stroke="#C8DDE8" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="73" y1="15" x2="83" y2="15" stroke="#C8DDE8" strokeWidth="2"   strokeLinecap="round"/>
      <line x1="76" y1="9"  x2="84" y2="9"  stroke="#C8DDE8" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

/* ─── Empty State ───────────────────────────────────────────────────────── */
type EmptyVariant = 'no-data' | 'positive' | 'no-activity';

const EMPTY_CFG: Record<EmptyVariant, { svg: React.ReactNode; title: string; sub: string }> = {
  'no-data':     { svg: <SvgNoData />,     title: 'Sem dados no período',     sub: 'Ajuste o filtro de datas ou selecione outro quadro.' },
  'positive':    { svg: <SvgPositive />,   title: 'Nenhum card em atraso',    sub: 'Ótimo trabalho! O time está dentro do prazo.' },
  'no-activity': { svg: <SvgNoActivity />, title: 'Sem atividade no período', sub: 'As ações dos cards aparecerão aqui.' },
};

function EmptyState({ variant = 'no-data' }: { variant?: EmptyVariant }) {
  const { svg, title, sub } = EMPTY_CFG[variant];
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-3 text-center select-none">
      <div className="opacity-60 drop-shadow-sm">{svg}</div>
      <div>
        <p className="text-sm font-semibold text-brand-text-secondary">{title}</p>
        <p className="text-xs text-brand-text-muted mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

/* ─── Health Banner ─────────────────────────────────────────────────────── */
function HealthBanner({ overdueCount, throughputTrend }: { overdueCount: number; throughputTrend: number | null }) {
  const status =
    overdueCount > 2                                   ? 'critical' :
    overdueCount > 0                                   ? 'warning'  :
    (throughputTrend ?? 0) < -20                       ? 'warning'  : 'good';

  const cfg = {
    good:     { bg: 'bg-brand-success-subtle', border: 'border-brand-success/30', dot: 'bg-brand-success', text: 'text-brand-success-fg',
      msg: 'Tudo em dia — nenhum card em atraso e throughput estável.' },
    warning:  { bg: 'bg-brand-warning-subtle', border: 'border-brand-warning/30', dot: 'bg-brand-warning', text: 'text-brand-warning-fg',
      msg: overdueCount > 0
        ? `${overdueCount} card${overdueCount > 1 ? 's' : ''} em atraso — revise as prioridades.`
        : `Throughput caiu ${Math.abs(throughputTrend ?? 0)}% em relação ao período anterior.` },
    critical: { bg: 'bg-brand-error-subtle',   border: 'border-brand-error/30',   dot: 'bg-brand-error',   text: 'text-brand-error-fg',
      msg: `${overdueCount} cards em atraso — ação imediata recomendada.` },
  }[status];

  return (
    <div className={cn('flex items-center gap-3 px-4 py-2.5 rounded-lg border text-sm font-medium', cfg.bg, cfg.border, cfg.text)}>
      <span className={cn('w-2 h-2 rounded-full shrink-0 animate-pulse', cfg.dot)} />
      {cfg.msg}
    </div>
  );
}

/* ─── Assignee axis tick ────────────────────────────────────────────────── */
function AssigneeTick({ x, y, payload, index }: any) {
  const color    = ASSIGNEE_COLORS[index % ASSIGNEE_COLORS.length];
  const name     = String(payload?.value ?? '');
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map((w: string) => w[0].toUpperCase()).join('');
  const label    = name.length > 9 ? name.slice(0, 9) + '…' : name;

  return (
    <g transform={`translate(${x},${y})`}>
      <circle cx={-10} cy={0} r={9} fill={color} fillOpacity={0.18} />
      <text x={-10} y={0.5} textAnchor="middle" dominantBaseline="central" fontSize={7.5} fill={color} fontWeight={700}>
        {initials}
      </text>
      <text x={-24} y={0} textAnchor="end" dominantBaseline="central" fontSize={11} fill="#6B7A8D">
        {label}
      </text>
    </g>
  );
}

/* ─── Activity Feed icons ───────────────────────────────────────────────── */
function ActivityIcon({ action }: { action: string }) {
  const s = 11;
  switch (action) {
    case 'created':          return <PlusCircle    size={s} className="text-green-500" />;
    case 'moved':            return <ArrowRightLeft size={s} className="text-blue-500" />;
    case 'assigned':         return <UserCheck      size={s} className="text-brand-accent" />;
    case 'unassigned':       return <UserMinus      size={s} className="text-brand-text-muted" />;
    case 'updated':          return <Pencil         size={s} className="text-brand-text-secondary" />;
    case 'attachment_added': return <Paperclip      size={s} className="text-brand-text-secondary" />;
    case 'tag_added':        return <Tag            size={s} className="text-brand-accent-hover" />;
    case 'tag_removed':      return <Tag            size={s} className="text-brand-text-muted" />;
    case 'due_date_set':     return <Calendar       size={s} className="text-brand-accent" />;
    case 'deleted':          return <Trash2         size={s} className="text-brand-error" />;
    case 'restored':         return <RotateCcw      size={s} className="text-brand-success" />;
    default:                 return <div className="w-1.5 h-1.5 rounded-full bg-brand-text-muted" />;
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

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['analytics', boardId, startDate, endDate],
    queryFn:  () => analyticsApi.getSummary({ boardId: boardId || undefined, startDate, endDate }),
    placeholderData: keepPreviousData,
  });

  const { data: activityEvents = [], isLoading: activityLoading, isFetching: activityFetching } = useQuery({
    queryKey: ['analytics-activity', boardId, startDate, endDate],
    queryFn:  () => analyticsApi.getActivity({ boardId: boardId || undefined, startDate, endDate, limit: 100 }),
    enabled:  tab === 'activity',
    placeholderData: keepPreviousData,
  });

  // Tempo real — watch sem presença
  const watchIds           = boardId ? [boardId] : boards.map((b) => b.id);
  const { isConnected }    = useAnalyticsSocket(watchIds);

  // Toast + pulse ao detectar atualização em background (não na carga inicial)
  const [pulse, setPulse]           = useState(false);
  const [toast, setToast]           = useState(false);
  const prevDataRef                 = useRef(data);
  const initializedRef              = useRef(false);

  useEffect(() => {
    if (!initializedRef.current) {
      if (data) { initializedRef.current = true; prevDataRef.current = data; }
      return;
    }
    if (data && data !== prevDataRef.current) {
      prevDataRef.current = data;
      setPulse(true);
      setToast(true);
      const t1 = setTimeout(() => setPulse(false), 1400);
      const t2 = setTimeout(() => setToast(false),  2800);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [data]);

  const kpis    = data?.kpis;
  const prev    = kpis?.previous ?? null;
  const cur     = kpis?.current;
  const overdue = data?.overdueCards ?? [];
  const throughputTrend = prev && cur ? calcTrend(cur.doneCount, prev.doneCount) : null;

  const cardsByStatus = (data?.cardsByStatus ?? []).map((d) => ({
    ...d,
    label: STATUS_LABEL[d.status] ?? d.status,
    fill:  STATUS_COLORS[d.status] ?? SLATE.muted,
  }));

  const isRefreshing = (isFetching && !isLoading) || (activityFetching && !activityLoading);

  return (
    <div className="space-y-6">

      {/* ── Toast de atualização em tempo real ── */}
      <div className={cn(
        'fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-brand-surface-elevated border border-brand-success/30 rounded-xl shadow-brand-raised text-sm font-medium text-brand-success-fg transition-all duration-300',
        toast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none',
      )}>
        <RefreshCw size={14} className="text-brand-success" />
        Analytics atualizado
      </div>

      {/* ── Header + Filtros ── */}
      <div className="flex flex-wrap items-end gap-4 justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-brand-text-primary">Análises</h2>
            {isConnected && (
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-brand-success-fg bg-brand-success-subtle border border-brand-success/30 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-success animate-pulse" />
                Ao vivo
              </span>
            )}
            {isRefreshing && (
              <RefreshCw size={13} className="text-brand-accent animate-spin" />
            )}
          </div>
          <p className="text-sm text-brand-text-secondary mt-0.5">Desempenho do time no período selecionado</p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-brand-text-secondary">Quadro</label>
            <select
              value={boardId}
              onChange={(e) => setBoardId(e.target.value)}
              className="px-3 py-2 text-sm border border-brand-border-subtle rounded-lg focus:outline-none focus:border-brand-accent bg-brand-surface text-brand-text-secondary"
            >
              <option value="">Todos os quadros</option>
              {boards.map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}
            </select>
          </div>
          {(['De', 'Até'] as const).map((lbl, i) => (
            <div key={lbl} className="flex flex-col gap-1">
              <label className="text-xs font-medium text-brand-text-secondary">{lbl}</label>
              <input
                type="date"
                value={i === 0 ? startDate : endDate}
                onChange={(e) => i === 0 ? setStartDate(e.target.value) : setEndDate(e.target.value)}
                className="px-3 py-2 text-sm border border-brand-border-subtle rounded-lg focus:outline-none focus:border-brand-accent bg-brand-surface text-brand-text-primary"
              />
            </div>
          ))}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 border-b border-brand-border-subtle">
        {([
          ['dashboard', 'Dashboard',  <LayoutGrid size={13} />],
          ['activity',  'Atividade',  <Clock      size={13} />],
        ] as const).map(([id, label, icon]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
              tab === id
                ? 'border-brand-accent text-brand-accent'
                : 'border-transparent text-brand-text-muted hover:text-brand-text-primary',
            )}
          >
            {icon}{label}
          </button>
        ))}
      </div>

      {/* ── Aba Atividade ── */}
      {tab === 'activity' && (
        <div className="bg-brand-surface rounded-xl border border-brand-border-subtle p-5 shadow-brand-card">
          <h3 className="text-sm font-semibold text-brand-text-secondary mb-4 flex items-center gap-2">
            <Clock size={14} className="text-brand-accent" />
            Histórico de Atividades
            {activityFetching && !activityLoading && (
              <RefreshCw size={12} className="text-brand-accent animate-spin ml-auto" />
            )}
          </h3>
          {activityLoading ? (
            <div className="space-y-3">
              {[1,2,3,4,5].map((i) => <div key={i} className="h-12 bg-brand-surface-elevated rounded-lg animate-pulse" />)}
            </div>
          ) : activityEvents.length === 0 ? (
            <EmptyState variant="no-activity" />
          ) : (
            <div className="space-y-1">
              {activityEvents.map((event: ActivityEvent) => {
                const color = userColor(event.userName);
                return (
                  <div key={event.id} className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-brand-surface-elevated transition-colors">
                    {/* avatar com badge de ação */}
                    <div className="relative shrink-0 mt-0.5">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold"
                        style={{ backgroundColor: color }}
                      >
                        {userInitials(event.userName)}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-brand-surface border border-brand-border-subtle flex items-center justify-center">
                        <ActivityIcon action={event.action} />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-brand-text-secondary leading-snug">
                        <span className="font-semibold text-brand-text-primary">{event.userName}</span>
                        {event.description ? (
                          <span> — {event.description}</span>
                        ) : null}
                      </p>
                      <p className="text-xs text-brand-text-muted mt-0.5 truncate">
                        {event.cardTitle} ·{' '}
                        {formatDistanceToNow(parseISO(event.createdAt), { addSuffix: true, locale: ptBR })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Aba Dashboard ── */}
      {tab === 'dashboard' && (isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-pulse">
          {[1,2,3].map((i) => <div key={i} className="h-28 bg-brand-surface rounded-xl" />)}
        </div>
      ) : (
        <>
          {cur && <HealthBanner overdueCount={cur.overdueCount} throughputTrend={throughputTrend} />}

          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KpiCard
              label="Cards no período"
              value={cur?.totalCards ?? 0}
              icon={<Calendar size={18} />}
              trend={prev ? calcTrend(cur!.totalCards, prev.totalCards) : null}
              pulse={pulse}
            />
            <CompletionRingCard
              doneCount={cur?.doneCount ?? 0}
              totalCards={cur?.totalCards ?? 0}
              trend={prev ? calcTrend(cur!.doneCount, prev.doneCount) : null}
              pulse={pulse}
            />
            <KpiCard
              label="Cards em atraso"
              value={cur?.overdueCount ?? 0}
              icon={<AlertTriangle size={18} />}
              trendInverted
              pulse={pulse}
            />
          </div>

          {/* Throughput — Area Chart */}
          <ChartShell title="Throughput — Conclusões ao Longo do Tempo">
            {(data?.completionsOverTime ?? []).length === 0 ? <EmptyState /> : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={data?.completionsOverTime} margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
                  <defs>
                    <linearGradient id="areaGreen" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={SLATE.success} stopOpacity={0.28} />
                      <stop offset="95%" stopColor={SLATE.success} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E222D" />
                  <XAxis
                    dataKey="date" tick={TICK_STYLE}
                    tickFormatter={(d) => { try { return format(parseISO(d), 'dd/MM', { locale: ptBR }); } catch { return d; } }}
                  />
                  <YAxis allowDecimals={false} tick={TICK_STYLE} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #2A3040', backgroundColor: '#1E222D', color: '#E8ECF4', boxShadow: '0 4px 16px rgba(0,0,0,0.5)' }}
                    labelFormatter={(d) => { try { return format(parseISO(String(d)), 'dd/MM/yyyy', { locale: ptBR }); } catch { return d; } }}
                    formatter={(val) => [`${val} cards`, 'Concluídos']}
                  />
                  <Area
                    type="monotone" dataKey="count"
                    stroke={SLATE.success} strokeWidth={2.5}
                    fill="url(#areaGreen)"
                    dot={{ r: 3, fill: SLATE.success, strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: SLATE.success }}
                    animationDuration={600}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </ChartShell>

          {/* Status + Responsável */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartShell title="Distribuição por Status">
              {cardsByStatus.length === 0 ? <EmptyState /> : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart margin={{ top: 24, right: 48, bottom: 8, left: 48 }}>
                    <Pie
                      data={cardsByStatus} dataKey="count" nameKey="label"
                      cx="50%" cy="44%" outerRadius={74} innerRadius={36}
                      paddingAngle={3}
                      label={({ cx, cy, midAngle, outerRadius: r, count, percent }) => {
                        if ((percent as number) < 0.04) return null;
                        const RAD = Math.PI / 180;
                        const radius = (r as number) + 28;
                        const x = (cx as number) + radius * Math.cos(-midAngle * RAD);
                        const y = (cy as number) + radius * Math.sin(-midAngle * RAD);
                        return (
                          <text
                            x={x} y={y}
                            textAnchor={x > (cx as number) ? 'start' : 'end'}
                            dominantBaseline="central"
                            fontSize={11}
                            fill="#8B95A8"
                          >
                            {count} · {((percent as number) * 100).toFixed(0)}%
                          </text>
                        );
                      }}
                      labelLine={{ stroke: '#4E5A6B', strokeWidth: 1 }}
                      animationDuration={600}
                    >
                      {cardsByStatus.map((entry) => <Cell key={entry.status} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: '1px solid #2A3040', backgroundColor: '#1E222D', color: '#E8ECF4', boxShadow: '0 4px 16px rgba(0,0,0,0.5)' }}
                      formatter={(val, _name, props) => [`${val} cards`, props.payload?.label ?? '']}
                    />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      formatter={(v) => <span className="text-xs text-brand-text-secondary">{v}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </ChartShell>

            <ChartShell title="Cards por Responsável">
              {(data?.cardsByAssignee ?? []).length === 0 ? <EmptyState /> : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart
                    data={data?.cardsByAssignee ?? []}
                    layout="vertical"
                    margin={{ left: 16, right: 16, top: 4, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#1E222D" />
                    <XAxis type="number" allowDecimals={false} tick={TICK_STYLE} />
                    <YAxis type="category" dataKey="assignee" width={110} tick={<AssigneeTick />} />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: '1px solid #2A3040', backgroundColor: '#1E222D', color: '#E8ECF4', boxShadow: '0 4px 16px rgba(0,0,0,0.5)' }}
                      formatter={(val) => [`${val} cards`, 'Total']}
                    />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]} animationDuration={600}>
                      {(data?.cardsByAssignee ?? []).map((_, i) => (
                        <Cell key={i} fill={ASSIGNEE_COLORS[i % ASSIGNEE_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartShell>
          </div>

          {/* Cards em Atraso */}
          <div className="bg-brand-surface rounded-xl border border-brand-border-subtle p-5 shadow-brand-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-brand-text-secondary flex items-center gap-2">
                <AlertTriangle size={14} className="text-brand-error" />
                Cards em Atraso
              </h3>
              {overdue.length > 0 && (
                <span className="px-2 py-0.5 bg-brand-error-subtle text-brand-error text-xs font-semibold rounded-full">
                  {overdue.length}
                </span>
              )}
            </div>

            {overdue.length === 0 ? <EmptyState variant="positive" /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-brand-text-muted uppercase tracking-wider border-b border-brand-border-subtle">
                      <th className="pb-2 font-medium">Título</th>
                      <th className="pb-2 font-medium">Status</th>
                      <th className="pb-2 font-medium">Responsável</th>
                      <th className="pb-2 font-medium">Prazo</th>
                      <th className="pb-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border-subtle">
                    {overdue.map((card) => {
                      const col = COLUMN_CONFIG.find((c) => c.status === card.status);
                      const daysLate = card.dueDate
                        ? Math.ceil((Date.now() - new Date(card.dueDate).getTime()) / 86_400_000)
                        : 0;
                      return (
                        <tr key={card.id} className="hover:bg-brand-surface-elevated transition-colors">
                          <td className="py-3 pr-4 font-medium text-brand-text-primary truncate max-w-[200px]">{card.title}</td>
                          <td className="py-3 pr-4">
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-brand-surface-elevated text-brand-text-secondary">
                              {col?.title ?? card.status}
                            </span>
                          </td>
                          <td className="py-3 pr-4 text-brand-text-secondary">
                            {card.assignees?.length
                              ? card.assignees.map((a) => a.name.split(' ')[0]).join(', ')
                              : '—'}
                          </td>
                          <td className="py-3 pr-4">
                            <div className="flex flex-col">
                              <span className="text-brand-error font-medium text-xs">
                                {card.dueDate ? format(parseISO(card.dueDate), 'dd/MM/yyyy', { locale: ptBR }) : '—'}
                              </span>
                              {daysLate > 0 && <span className="text-[10px] text-brand-error/70">{daysLate}d de atraso</span>}
                            </div>
                          </td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => router.push(`/dashboard/${card.boardId}`)}
                              className="flex items-center gap-1 text-xs text-brand-accent hover:text-brand-accent-hover font-medium transition-colors ml-auto"
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
