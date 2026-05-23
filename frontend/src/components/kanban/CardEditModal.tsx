'use client';

import { useRef, useState } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowRightLeft,
  Calendar,
  Check,
  Clock,
  Paperclip,
  Pencil,
  Plus,
  PlusCircle,
  Tag,
  Trash2,
  Upload,
  UserCheck,
  UserMinus,
  X,
} from 'lucide-react';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { api } from '@/lib/api';
import { cardsApi } from '@/lib/cards';
import { cardsKey, useAddAssignee, useRemoveAssignee } from '@/hooks/useCards';
import { useMembers } from '@/hooks/useMembers';
import { cn } from '@/lib/utils';
import { PRIORITY_META, type Card, type CardPriority } from '@/types';

const AVATAR_COLORS = ['#F78E2F', '#A559FD', '#43AC8D', '#1D84B7', '#FDCC32'];

const ACCENT_COLORS = [
  '#F78E2F', '#A559FD', '#43AC8D', '#1D84B7',
  '#FDCC32', '#EF4444', '#EC4899', '#6B7280',
];

interface CardEditModalProps {
  card: Card;
  boardId: string;
  onClose: () => void;
}

function ActionIcon({ action }: { action: string }) {
  const base = 'shrink-0';
  switch (action) {
    case 'created':          return <PlusCircle    size={14} className={cn(base, 'text-green-500')} />;
    case 'moved':            return <ArrowRightLeft size={14} className={cn(base, 'text-blue-500')} />;
    case 'assigned':         return <UserCheck      size={14} className={cn(base, 'text-atomic-orange')} />;
    case 'unassigned':       return <UserMinus      size={14} className={cn(base, 'text-stone-400')} />;
    case 'updated':          return <Pencil         size={14} className={cn(base, 'text-stone-500')} />;
    case 'attachment_added': return <Paperclip      size={14} className={cn(base, 'text-stone-500')} />;
    case 'tag_added':        return <Tag            size={14} className={cn(base, 'text-purple-500')} />;
    case 'tag_removed':      return <Tag            size={14} className={cn(base, 'text-stone-400')} />;
    case 'due_date_set':     return <Calendar       size={14} className={cn(base, 'text-atomic-orange')} />;
    default:                 return <div className="w-2 h-2 rounded-full bg-stone-300 m-auto" />;
  }
}

const STATUS_LABEL: Record<string, string> = {
  todo: 'A Fazer',
  in_progress: 'Em Andamento',
  in_review: 'Em Revisão',
  done: 'Concluído',
};

export function CardEditModal({ card, boardId, onClose }: CardEditModalProps) {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description ?? '');
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#6B7280');
  const [descSaveState, setDescSaveState] = useState<'idle' | 'saved' | 'error'>('idle');

  const { data: detail = card } = useQuery({
    queryKey: ['card', card.id],
    queryFn: () => cardsApi.get(card.id),
    placeholderData: card,
  });

  const { data: members } = useMembers(boardId);
  const addAssignee = useAddAssignee(boardId);
  const removeAssignee = useRemoveAssignee(boardId);

  const allMembers = members ? [members.owner, ...members.members] : [];
  const assignedIds = new Set(detail.assignees?.map((a) => a.id) ?? []);
  const availableToAdd = allMembers.filter((m) => !assignedIds.has(m.id));

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: cardsKey(boardId) });
    qc.invalidateQueries({ queryKey: ['card', card.id] });
  };

  const updateCard = useMutation({
    mutationFn: (data: Partial<Card>) => cardsApi.update(card.id, data),
    onSuccess: invalidate,
  });

  const addTag = useMutation({
    mutationFn: (data: { name: string; color: string }) =>
      api.post(`/cards/${card.id}/tags`, data),
    onSuccess: () => { invalidate(); setNewTagName(''); },
  });

  const removeTag = useMutation({
    mutationFn: (tagId: string) => api.delete(`/cards/${card.id}/tags/${tagId}`),
    onSuccess: invalidate,
  });

  const uploadAttachment = useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append('file', file);
      return api.post(`/cards/${card.id}/attachments`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: invalidate,
  });

  const deleteAttachment = useMutation({
    mutationFn: (attachmentId: string) =>
      api.delete(`/cards/${card.id}/attachments/${attachmentId}`),
    onSuccess: invalidate,
  });

  function handleTitleBlur() {
    const t = title.trim();
    if (t && t !== card.title) updateCard.mutate({ title: t });
  }

  function handleDescriptionSave() {
    if (description !== (detail.description ?? '')) {
      setDescSaveState('idle');
      updateCard.mutate(
        { description },
        {
          onSuccess: () => {
            setDescSaveState('saved');
            setTimeout(() => setDescSaveState('idle'), 2000);
          },
          onError: () => {
            setDescSaveState('error');
            setTimeout(() => setDescSaveState('idle'), 2000);
          },
        },
      );
    }
  }

  const descriptionDirty = description !== (detail.description ?? '');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 pt-14 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mb-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-3 px-6 pt-6 pb-4 border-b border-stone-100">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            className="flex-1 text-xl font-bold text-stone-900 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-orange-500 rounded px-1 -mx-1"
          />
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex gap-6 p-6">
          {/* Left column */}
          <div className="flex-1 min-w-0 space-y-6">

            {/* Description */}
            <section>
              <h4 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">
                Descrição
              </h4>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Adicione uma descrição detalhada…"
                rows={4}
                className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-y"
              />
              {(descriptionDirty || descSaveState !== 'idle') && (
                <button
                  onClick={handleDescriptionSave}
                  disabled={updateCard.isPending || descSaveState === 'saved'}
                  className={cn(
                    'mt-1.5 px-3 py-1.5 text-white text-xs font-medium rounded-lg transition-all flex items-center gap-1.5',
                    descSaveState === 'error'
                      ? 'bg-red-500 animate-shake'
                      : descSaveState === 'saved'
                      ? 'bg-green-600'
                      : 'bg-orange-600 hover:bg-orange-700',
                    updateCard.isPending && 'opacity-60',
                  )}
                >
                  {updateCard.isPending ? (
                    'Salvando…'
                  ) : descSaveState === 'saved' ? (
                    <><Check size={12} /> Salvo</>
                  ) : descSaveState === 'error' ? (
                    'Erro ao salvar'
                  ) : (
                    'Salvar'
                  )}
                </button>
              )}
            </section>

            {/* Tags */}
            <section>
              <h4 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Tag size={11} /> Tags
              </h4>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {detail.tags?.map((tag) => (
                  <span
                    key={tag.id}
                    className="flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full tracking-wide transition-opacity hover:opacity-75"
                    style={{
                      backgroundColor: `${tag.color}1A`,
                      color: tag.color,
                      border: `1px solid ${tag.color}40`,
                    }}
                  >
                    {tag.name}
                    <button
                      onClick={() => removeTag.mutate(tag.id)}
                      className="hover:opacity-70 transition-opacity"
                      aria-label={`Remover tag ${tag.name}`}
                    >
                      <X size={9} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-1.5">
                <input
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newTagName.trim()) {
                      addTag.mutate({ name: newTagName.trim(), color: newTagColor });
                    }
                  }}
                  placeholder="Nova tag…"
                  className="flex-1 px-2.5 py-1.5 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <input
                  type="color"
                  value={newTagColor}
                  onChange={(e) => setNewTagColor(e.target.value)}
                  className="w-8 h-8 rounded border border-stone-200 cursor-pointer p-0.5"
                  title="Cor da tag"
                />
                <button
                  onClick={() =>
                    newTagName.trim() &&
                    addTag.mutate({ name: newTagName.trim(), color: newTagColor })
                  }
                  disabled={!newTagName.trim() || addTag.isPending}
                  className="p-1.5 bg-stone-100 text-stone-600 rounded-lg hover:bg-stone-200 disabled:opacity-50 transition-colors"
                  aria-label="Adicionar tag"
                >
                  <Plus size={14} />
                </button>
              </div>
            </section>

            {/* Attachments */}
            <section>
              <h4 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Paperclip size={11} /> Anexos
              </h4>
              <div className="space-y-1.5 mb-2">
                {detail.attachments?.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center gap-2 bg-stone-50 rounded-lg px-3 py-2 group"
                  >
                    <Paperclip size={13} className="text-stone-400 shrink-0" />
                    <span className="flex-1 text-sm text-stone-700 truncate">
                      {att.originalName}
                    </span>
                    <span className="text-xs text-stone-400 shrink-0">
                      {(att.size / 1024).toFixed(0)} KB
                    </span>
                    <button
                      onClick={() => deleteAttachment.mutate(att.id)}
                      className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-red-500 transition-all"
                      aria-label="Excluir anexo"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadAttachment.mutate(file);
                  e.target.value = '';
                }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadAttachment.isPending}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs border border-dashed border-stone-300 rounded-lg text-stone-500 hover:border-orange-400 hover:text-orange-600 disabled:opacity-50 transition-colors"
              >
                <Upload size={13} />
                {uploadAttachment.isPending ? 'Enviando…' : 'Anexar arquivo'}
              </button>
            </section>
          </div>

          {/* Right column — metadata */}
          <div className="w-52 shrink-0 space-y-5">
            <div>
              <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1.5">
                Responsáveis
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2 min-h-[24px]">
                {detail.assignees?.map((u, i) => (
                  <span
                    key={u.id}
                    className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
                  >
                    {u.name.split(' ')[0]}
                    <button
                      onClick={() => removeAssignee.mutate({ id: card.id, userId: u.id })}
                      className="hover:opacity-70 transition-opacity"
                      aria-label={`Remover ${u.name}`}
                    >
                      <X size={9} />
                    </button>
                  </span>
                ))}
              </div>
              {availableToAdd.length > 0 && (
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      addAssignee.mutate({ id: card.id, userId: e.target.value });
                      e.target.value = '';
                    }
                  }}
                  className="w-full px-2.5 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-stone-500"
                >
                  <option value="">+ Adicionar…</option>
                  {availableToAdd.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1.5">
                Prioridade
              </label>
              <select
                defaultValue={detail.priority}
                onChange={(e) =>
                  updateCard.mutate({ priority: e.target.value as CardPriority })
                }
                className="w-full px-2.5 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
              >
                {Object.entries(PRIORITY_META).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1.5">
                Cor de destaque
              </label>
              <div className="flex flex-wrap gap-1.5 items-center">
                {ACCENT_COLORS.map((color) => (
                  <button
                    key={color}
                    title={color}
                    onClick={() => updateCard.mutate({ accentColor: color })}
                    style={{ backgroundColor: color }}
                    className={cn(
                      'w-6 h-6 rounded-full transition-all hover:scale-110',
                      detail.accentColor === color
                        ? 'ring-2 ring-offset-1 ring-stone-400'
                        : 'opacity-80 hover:opacity-100',
                    )}
                  />
                ))}
                {detail.accentColor && (
                  <button
                    title="Remover cor"
                    onClick={() => updateCard.mutate({ accentColor: null })}
                    className="w-6 h-6 rounded-full border border-stone-300 bg-stone-100 flex items-center justify-center text-stone-400 hover:text-red-500 hover:border-red-300 transition-all"
                  >
                    <X size={10} />
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1.5">
                Prazo
              </label>
              <input
                type="datetime-local"
                defaultValue={
                  detail.dueDate
                    ? format(parseISO(detail.dueDate), "yyyy-MM-dd'T'HH:mm")
                    : ''
                }
                onChange={(e) =>
                  updateCard.mutate({
                    dueDate: e.target.value
                      ? new Date(e.target.value).toISOString()
                      : undefined,
                  })
                }
                className="w-full px-2.5 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1.5">
                Status
              </label>
              <span
                className={cn(
                  'inline-block text-xs font-medium px-2.5 py-1 rounded-full',
                  detail.status === 'done'
                    ? 'bg-green-100 text-green-700'
                    : detail.status === 'in_review'
                    ? 'bg-amber-100 text-amber-700'
                    : detail.status === 'in_progress'
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-stone-100 text-stone-600',
                )}
              >
                {STATUS_LABEL[detail.status] ?? detail.status}
              </span>
            </div>
          </div>
        </div>

        {/* History — sempre visível */}
        <div className="border-t border-stone-100 px-6 py-4">
          <h4 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3 flex items-center gap-1">
            <Clock size={11} /> Atividade
          </h4>
          {!detail.history?.length ? (
            <p className="text-sm text-stone-400 text-center py-3">Nenhuma atividade ainda</p>
          ) : (
            <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
              {detail.history.map((entry) => (
                <div key={entry.id} className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-stone-50 border border-stone-100 flex items-center justify-center shrink-0 mt-0.5">
                    <ActionIcon action={entry.action} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-stone-700 leading-snug">
                      {entry.description}
                    </p>
                    <p className="text-xs text-stone-400 mt-0.5">
                      {entry.user?.name} ·{' '}
                      {formatDistanceToNow(parseISO(entry.createdAt), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
