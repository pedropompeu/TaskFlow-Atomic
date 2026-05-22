'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, LayoutDashboard, Kanban, Check, CheckCheck } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useNotifications, useMarkRead, useMarkAllRead } from '@/hooks/useNotifications';
import type { AppNotification } from '@/types';

function notificationMeta(n: AppNotification): { icon: React.ReactNode; message: string; link?: string } {
  switch (n.type) {
    case 'board_invite':
      return {
        icon: <LayoutDashboard size={14} className="text-atomic-orange shrink-0 mt-0.5" />,
        message: `Você foi convidado para o quadro "${n.payload.boardTitle}"`,
        link: n.payload.boardId ? `/dashboard/${n.payload.boardId}` : undefined,
      };
    case 'card_assigned':
      return {
        icon: <Kanban size={14} className="text-atomic-purple shrink-0 mt-0.5" />,
        message: `Você foi atribuído ao card "${n.payload.cardTitle}"`,
        link: n.payload.boardId ? `/dashboard/${n.payload.boardId}` : undefined,
      };
    default:
      return { icon: <Bell size={14} />, message: 'Nova notificação' };
  }
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { data: notifications = [] } = useNotifications();
  const markRead = useMarkRead();
  const markAll = useMarkAllRead();

  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function handleClick(n: AppNotification) {
    if (!n.read) markRead.mutate(n.id);
    const meta = notificationMeta(n);
    if (meta.link) {
      router.push(meta.link);
      setOpen(false);
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'relative p-2 rounded-lg transition-colors',
          open
            ? 'bg-atomic-ice text-atomic-dark'
            : 'text-atomic-gray-500 hover:text-atomic-dark hover:bg-atomic-ice',
        )}
        aria-label="Notificações"
      >
        <Bell size={18} />
        <AnimatePresence>
          {unread > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
            >
              {unread > 9 ? '9+' : unread}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ type: 'spring', duration: 0.25 }}
            className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-atomic-gray-300/30 z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-atomic-gray-300/20">
              <span className="text-sm font-semibold text-atomic-dark">
                Notificações
                {unread > 0 && (
                  <span className="ml-1.5 text-[11px] bg-red-100 text-red-600 font-medium px-1.5 py-0.5 rounded-full">
                    {unread}
                  </span>
                )}
              </span>
              {unread > 0 && (
                <button
                  onClick={() => markAll.mutate()}
                  className="flex items-center gap-1 text-xs text-atomic-gray-500 hover:text-atomic-dark transition-colors"
                >
                  <CheckCheck size={12} />
                  Marcar todas
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-atomic-gray-500/60">
                  <Bell size={28} className="mb-2 opacity-30" />
                  <p className="text-xs">Nenhuma notificação</p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {notifications.map((n) => {
                    const meta = notificationMeta(n);
                    return (
                      <motion.button
                        key={n.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => handleClick(n)}
                        className={cn(
                          'w-full flex items-start gap-3 px-4 py-3 text-left transition-colors',
                          n.read
                            ? 'hover:bg-atomic-ice/50'
                            : 'bg-atomic-orange/5 hover:bg-atomic-orange/10',
                        )}
                      >
                        <div className="mt-0.5">{meta.icon}</div>
                        <div className="flex-1 min-w-0">
                          <p className={cn('text-xs leading-snug', n.read ? 'text-atomic-gray-600' : 'text-atomic-dark font-medium')}>
                            {meta.message}
                          </p>
                          <p className="text-[11px] text-atomic-gray-500 mt-0.5">
                            {formatDistanceToNow(parseISO(n.createdAt), { addSuffix: true, locale: ptBR })}
                          </p>
                        </div>
                        {!n.read && (
                          <div className="w-1.5 h-1.5 rounded-full bg-atomic-orange mt-1.5 shrink-0" />
                        )}
                      </motion.button>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
