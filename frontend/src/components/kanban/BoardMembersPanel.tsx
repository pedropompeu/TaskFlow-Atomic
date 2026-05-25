'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, Trash2, Crown, Users, Loader2 } from 'lucide-react';
import { useMembers, useInviteMember, useRemoveMember } from '@/hooks/useMembers';
import type { BoardMemberEntry } from '@/types';

const AVATAR_COLORS = ['#F78E2F', '#A559FD', '#43AC8D', '#1D84B7', '#FDCC32'];

function MemberAvatar({ name, index }: { name: string; index: number }) {
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
      style={{ backgroundColor: AVATAR_COLORS[index % AVATAR_COLORS.length] }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

interface Props {
  boardId: string;
  currentUserId: string;
  isOwner: boolean;
  onClose: () => void;
}

export function BoardMembersPanel({ boardId, currentUserId, isOwner, onClose }: Props) {
  const { data, isLoading } = useMembers(boardId);
  const invite = useInviteMember(boardId);
  const remove = useRemoveMember(boardId);

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!email.trim()) return;
    invite.mutate(email.trim(), {
      onSuccess: () => setEmail(''),
      onError: (err: any) => {
        const msg = err?.response?.data?.message;
        setError(Array.isArray(msg) ? msg[0] : (msg ?? 'Erro ao convidar'));
      },
    });
  }

  const allMembers: (BoardMemberEntry & { isOwner: boolean })[] = data
    ? [
        { ...data.owner, isOwner: true },
        ...data.members.map((m) => ({ ...m, isOwner: false })),
      ]
    : [];

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={onClose} />

        {/* Panel */}
        <motion.div
          className="relative z-10 w-full max-w-md bg-brand-surface-elevated border border-brand-border rounded-2xl shadow-brand-modal overflow-hidden"
          initial={{ scale: 0.95, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 12 }}
          transition={{ type: 'spring', duration: 0.3 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border-subtle">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-brand-accent" />
              <h2 className="font-semibold text-brand-text-primary">Membros do quadro</h2>
              {data && (
                <span className="text-[11px] font-bold bg-brand-surface text-brand-text-muted px-1.5 py-0.5 rounded-full tabular-nums">
                  {allMembers.length}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-brand-text-muted hover:text-brand-text-primary hover:bg-brand-surface rounded-lg transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Invite form (owner only) */}
          {isOwner && (
            <form onSubmit={handleInvite} className="px-5 pt-4 pb-3">
              <label className="block text-[11px] font-semibold text-brand-text-muted uppercase tracking-[0.06em] mb-2">
                Convidar por e-mail
              </label>
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  placeholder="usuario@email.com"
                  className="flex-1 px-3 py-2 text-sm border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent/30 bg-brand-surface text-brand-text-primary placeholder-brand-text-muted"
                />
                <button
                  type="submit"
                  disabled={invite.isPending || !email.trim()}
                  className="flex items-center gap-1.5 px-3 py-2 bg-brand-accent text-brand-accent-fg text-sm font-medium rounded-lg hover:bg-brand-accent-hover disabled:opacity-50 transition-colors"
                >
                  {invite.isPending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <UserPlus size={14} />
                  )}
                  Convidar
                </button>
              </div>
              {error && <p className="mt-1.5 text-xs text-brand-error">{error}</p>}
            </form>
          )}

          {/* Members list */}
          <div className="px-5 pb-5 space-y-1 max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 size={20} className="animate-spin text-brand-text-muted" />
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {allMembers.map((member, i) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-brand-surface transition-colors group"
                  >
                    <MemberAvatar name={member.name} index={i} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-brand-text-primary truncate flex items-center gap-1.5">
                        {member.name}
                        {member.id === currentUserId && (
                          <span className="text-[10px] text-brand-text-muted font-normal">(você)</span>
                        )}
                      </p>
                      <p className="text-xs text-brand-text-muted truncate">{member.email}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {member.isOwner ? (
                        <span className="flex items-center gap-1 text-[11px] text-brand-warning-fg bg-brand-warning-subtle px-1.5 py-0.5 rounded-full font-medium">
                          <Crown size={10} />
                          Dono
                        </span>
                      ) : (
                        <span className="text-[11px] text-brand-text-muted bg-brand-surface px-1.5 py-0.5 rounded-full">
                          Editor
                        </span>
                      )}
                      {isOwner && !member.isOwner && (
                        <button
                          onClick={() => remove.mutate(member.id)}
                          disabled={remove.isPending}
                          className="opacity-0 group-hover:opacity-100 p-1 text-brand-text-muted hover:text-brand-error transition-all"
                          aria-label={`Remover ${member.name}`}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
