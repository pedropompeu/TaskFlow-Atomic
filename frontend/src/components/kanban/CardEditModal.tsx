'use client';

import { useRef, useState } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowRightLeft,
  Calendar,
  Check,
  CheckSquare,
  Clock,
  Download,
  ListChecks,
  MessageSquare,
  Paperclip,
  Pencil,
  Plus,
  PlusCircle,
  Send,
  Square,
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
import { useCreateComment, useDeleteComment } from '@/hooks/useComments';
import { useMe } from '@/hooks/useMe';
import { useCreateChecklistItem, useUpdateChecklistItem, useDeleteChecklistItem } from '@/hooks/useChecklist';
import { boardTagsKey } from '@/hooks/useBoardTags';
import { TagPickerPanel } from './TagPickerPanel';
import { cn } from '@/lib/utils';
import { PRIORITY_META, type Card, type CardPriority } from '@/types';

const AVATAR_COLORS = ['#F78E2F', '#A559FD', '#43AC8D', '#1D84B7', '#FDCC32'];

const ACCENT_COLORS = [
  // Slate Protocol palette
  '#527DA3',  // Slate accent
  '#7499BF',  // Slate lighter
  '#A8BDD4',  // Slate soft
  '#4A8C6F',  // Success green
  '#7DC4A0',  // Green light
  '#C9A870',  // Amber
  '#C47070',  // Error red
  '#8C4A4A',  // Deep red
  // Complementares
  '#A559FD',  // Violeta
  '#FDCC32',  // Âmbar vivo
  '#4E5A6B',  // Cinza médio
  '#6B7A8D',  // Cinza claro
];

interface CardEditModalProps {
  card: Card;
  boardId: string;
  onClose: () => void;
}

function ActionIcon({ action }: { action: string }) {
  const base = 'shrink-0';
  switch (action) {
    case 'created':          return <PlusCircle    size={14} className={cn(base, 'text-brand-success')} />;
    case 'moved':            return <ArrowRightLeft size={14} className={cn(base, 'text-brand-accent')} />;
    case 'assigned':         return <UserCheck      size={14} className={cn(base, 'text-brand-accent-hover')} />;
    case 'unassigned':       return <UserMinus      size={14} className={cn(base, 'text-brand-text-muted')} />;
    case 'updated':          return <Pencil         size={14} className={cn(base, 'text-brand-text-muted')} />;
    case 'attachment_added': return <Paperclip      size={14} className={cn(base, 'text-brand-text-secondary')} />;
    case 'tag_added':        return <Tag            size={14} className={cn(base, 'text-brand-accent')} />;
    case 'tag_removed':      return <Tag            size={14} className={cn(base, 'text-brand-text-muted')} />;
    case 'due_date_set':     return <Calendar       size={14} className={cn(base, 'text-brand-warning')} />;
    default:                 return <div className="w-2 h-2 rounded-full bg-brand-border-strong m-auto" />;
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
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [descSaveState, setDescSaveState] = useState<'idle' | 'saved' | 'error'>('idle');
  const [newComment, setNewComment] = useState('');
  const [newChecklistText, setNewChecklistText] = useState('');

  const { data: detail = card } = useQuery({
    queryKey: ['card', card.id],
    queryFn: () => cardsApi.get(card.id),
    placeholderData: card,
  });

  const { data: members } = useMembers(boardId);
  const addAssignee = useAddAssignee(boardId);
  const removeAssignee = useRemoveAssignee(boardId);
  const createComment = useCreateComment(card.id, boardId);
  const deleteComment = useDeleteComment(card.id, boardId);
  const { data: me } = useMe();
  const createChecklistItem = useCreateChecklistItem(card.id);
  const updateChecklistItem = useUpdateChecklistItem(card.id);
  const deleteChecklistItem = useDeleteChecklistItem(card.id);

  const allMembers = members ? [members.owner, ...members.members] : [];
  const assignedIds = new Set(detail.assignees?.map((a) => a.id) ?? []);
  const availableToAdd = allMembers.filter((m) => !assignedIds.has(m.id));

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: cardsKey(boardId) });
    qc.invalidateQueries({ queryKey: ['card', card.id] });
    qc.invalidateQueries({ queryKey: boardTagsKey(boardId) });
  };

  const updateCard = useMutation({
    mutationFn: (data: Partial<Card>) => cardsApi.update(card.id, data),
    onSuccess: invalidate,
  });

  const addTag = useMutation({
    mutationFn: (data: { name: string; color: string }) =>
      api.post(`/cards/${card.id}/tags`, data),
    onSuccess: () => { invalidate(); },
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

  function handleSubmitComment() {
    const text = newComment.trim();
    if (!text || createComment.isPending) return;
    createComment.mutate(text, { onSuccess: () => setNewComment('') });
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center p-4 pt-14 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="bg-brand-surface-elevated border border-brand-border rounded-2xl shadow-brand-modal w-full max-w-3xl mb-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-3 px-6 pt-6 pb-4 border-b border-brand-border-subtle">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            className="flex-1 text-xl font-bold text-brand-text-primary bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-brand-accent rounded px-1 -mx-1"
          />
          <button
            onClick={onClose}
            className="p-1.5 text-brand-text-muted hover:text-brand-text-primary hover:bg-brand-surface rounded-lg transition-colors shrink-0"
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
              <h4 className="text-xs font-semibold text-brand-text-muted uppercase tracking-wider mb-2">
                Descrição
              </h4>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Adicione uma descrição detalhada…"
                rows={4}
                className="w-full px-3 py-2 text-sm bg-brand-surface border border-brand-border rounded-lg text-brand-text-primary placeholder-brand-text-muted focus:outline-none focus:border-brand-accent resize-y"
              />
              {(descriptionDirty || descSaveState !== 'idle') && (
                <button
                  onClick={handleDescriptionSave}
                  disabled={updateCard.isPending || descSaveState === 'saved'}
                  className={cn(
                    'mt-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5',
                    descSaveState === 'error'
                      ? 'bg-brand-error-subtle text-brand-error animate-shake'
                      : descSaveState === 'saved'
                      ? 'bg-brand-success-subtle text-brand-success-fg'
                      : 'bg-brand-accent text-brand-accent-fg hover:bg-brand-accent-hover',
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
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-brand-text-muted uppercase tracking-wider flex items-center gap-1">
                  <Tag size={11} /> Tags
                </h4>
                <button
                  onClick={() => setShowTagPicker(true)}
                  className="flex items-center gap-1 text-[11px] font-medium text-brand-text-muted hover:text-brand-accent transition-colors px-1.5 py-0.5 rounded hover:bg-brand-surface"
                >
                  <Plus size={11} /> Nova tag
                </button>
              </div>
              {/* Tags ativas no card */}
              {(detail.tags?.length ?? 0) > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {detail.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full tracking-wide"
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
              ) : (
                <button
                  onClick={() => setShowTagPicker(true)}
                  className="text-xs text-brand-text-muted hover:text-brand-accent transition-colors"
                >
                  Nenhuma tag — clique em Nova tag para adicionar
                </button>
              )}
            </section>

            {/* Checklist */}
            <section>
              <h4 className="text-xs font-semibold text-brand-text-muted uppercase tracking-wider mb-2 flex items-center gap-1">
                <ListChecks size={11} /> Checklist
                {(detail.checklists?.length ?? 0) > 0 && (
                  <span className="ml-1 text-brand-text-muted font-normal normal-case">
                    ({detail.checklists.filter((i) => i.done).length}/{detail.checklists.length})
                  </span>
                )}
              </h4>
              {/* Barra de progresso */}
              {(detail.checklists?.length ?? 0) > 0 && (
                <div className="w-full h-1.5 bg-brand-surface rounded-full mb-2 overflow-hidden">
                  <div
                    className="h-full bg-brand-accent rounded-full transition-all"
                    style={{
                      width: `${(detail.checklists.filter((i) => i.done).length / detail.checklists.length) * 100}%`,
                    }}
                  />
                </div>
              )}
              {/* Itens */}
              <div className="space-y-1 mb-2">
                {detail.checklists?.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 group">
                    <button
                      onClick={() => updateChecklistItem.mutate({ itemId: item.id, done: !item.done })}
                      className="shrink-0 text-brand-text-muted hover:text-brand-accent transition-colors"
                      aria-label={item.done ? 'Desmarcar' : 'Marcar como feito'}
                    >
                      {item.done
                        ? <CheckSquare size={15} className="text-brand-accent" />
                        : <Square size={15} />
                      }
                    </button>
                    <span className={cn(
                      'flex-1 text-sm text-brand-text-secondary leading-snug',
                      item.done && 'line-through text-brand-text-muted',
                    )}>
                      {item.text}
                    </span>
                    <button
                      onClick={() => deleteChecklistItem.mutate(item.id)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-brand-text-muted hover:text-brand-error transition-all shrink-0"
                      aria-label="Remover item"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
              {/* Input novo item */}
              <div className="flex gap-1.5">
                <input
                  value={newChecklistText}
                  onChange={(e) => setNewChecklistText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newChecklistText.trim()) {
                      createChecklistItem.mutate(newChecklistText.trim(), {
                        onSuccess: () => setNewChecklistText(''),
                      });
                    }
                  }}
                  placeholder="Novo item…"
                  className="flex-1 px-2.5 py-1.5 text-xs bg-brand-surface border border-brand-border rounded-lg text-brand-text-primary placeholder-brand-text-muted focus:outline-none focus:border-brand-accent"
                />
                <button
                  onClick={() =>
                    newChecklistText.trim() &&
                    createChecklistItem.mutate(newChecklistText.trim(), {
                      onSuccess: () => setNewChecklistText(''),
                    })
                  }
                  disabled={!newChecklistText.trim() || createChecklistItem.isPending}
                  className="p-1.5 bg-brand-surface text-brand-text-secondary rounded-lg hover:bg-brand-surface-overlay disabled:opacity-50 transition-colors"
                  aria-label="Adicionar item"
                >
                  <Plus size={14} />
                </button>
              </div>
            </section>

            {/* Comentários */}
            <section>
              <h4 className="text-xs font-semibold text-brand-text-muted uppercase tracking-wider mb-3 flex items-center gap-1">
                <MessageSquare size={11} /> Comentários
                {(detail.comments?.length ?? 0) > 0 && (
                  <span className="ml-1 text-brand-text-muted font-normal normal-case">
                    ({detail.comments.length})
                  </span>
                )}
              </h4>
              {/* Input */}
              <div className="flex gap-2 mb-3">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.ctrlKey) handleSubmitComment();
                  }}
                  placeholder="Adicionar comentário… (Ctrl+Enter para enviar)"
                  rows={2}
                  className="flex-1 px-3 py-2 text-sm bg-brand-surface border border-brand-border rounded-lg text-brand-text-primary placeholder-brand-text-muted focus:outline-none focus:border-brand-accent resize-none"
                />
                <button
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || createComment.isPending}
                  className="self-end p-2 bg-brand-accent text-brand-accent-fg rounded-lg hover:bg-brand-accent-hover disabled:opacity-40 transition-colors shrink-0"
                  aria-label="Enviar comentário"
                >
                  <Send size={14} />
                </button>
              </div>
              {/* Lista */}
              {!detail.comments?.length ? (
                <p className="text-sm text-brand-text-muted text-center py-2">Nenhum comentário ainda</p>
              ) : (
                <div className="space-y-3 max-h-40 overflow-y-auto pr-1">
                  {detail.comments.map((comment) => (
                    <div key={comment.id} className="flex items-start gap-2.5 group">
                      <div className="w-6 h-6 rounded-full bg-brand-accent-muted flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[10px] font-bold text-brand-accent">
                          {comment.user?.name?.[0]?.toUpperCase() ?? '?'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-xs font-semibold text-brand-text-primary">
                            {comment.user?.name}
                          </span>
                          <span className="text-xs text-brand-text-muted">
                            {formatDistanceToNow(parseISO(comment.createdAt), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-brand-text-secondary mt-0.5 whitespace-pre-wrap break-words">
                          {comment.content}
                        </p>
                      </div>
                      {(me?.id === comment.userId || me?.id === members?.owner?.id) && (
                        <button
                          onClick={() => deleteComment.mutate(comment.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-brand-text-muted hover:text-brand-error transition-all shrink-0 mt-0.5"
                          aria-label="Excluir comentário"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Attachments */}
            <section>
              <h4 className="text-xs font-semibold text-brand-text-muted uppercase tracking-wider mb-2 flex items-center gap-1">
                <Paperclip size={11} /> Anexos
              </h4>
              <div className="space-y-1.5 mb-2">
                {detail.attachments?.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center gap-2 bg-brand-surface rounded-lg px-3 py-2 group"
                  >
                    <Paperclip size={13} className="text-brand-text-muted shrink-0" />
                    <span className="flex-1 text-sm text-brand-text-primary truncate">
                      {att.originalName}
                    </span>
                    <span className="text-xs text-brand-text-muted shrink-0">
                      {(att.size / 1024).toFixed(0)} KB
                    </span>
                    <a
                      href={`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/uploads/${att.filename}`}
                      download={att.originalName}
                      className="opacity-0 group-hover:opacity-100 text-brand-text-muted hover:text-brand-accent transition-all"
                      aria-label="Baixar anexo"
                    >
                      <Download size={13} />
                    </a>
                    <button
                      onClick={() => deleteAttachment.mutate(att.id)}
                      className="opacity-0 group-hover:opacity-100 text-brand-text-muted hover:text-brand-error transition-all"
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
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs border border-dashed border-brand-border rounded-lg text-brand-text-secondary hover:border-brand-accent hover:text-brand-accent disabled:opacity-50 transition-colors"
              >
                <Upload size={13} />
                {uploadAttachment.isPending ? 'Enviando…' : 'Anexar arquivo'}
              </button>
            </section>
          </div>

          {/* Right column — metadata */}
          <div className="w-52 shrink-0 space-y-5">
            <div>
              <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-wider mb-1.5">
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
                  className="w-full px-2.5 py-2 text-sm border border-brand-border rounded-lg focus:outline-none focus:border-brand-accent bg-brand-surface text-brand-text-secondary"
                >
                  <option value="">+ Adicionar…</option>
                  {availableToAdd.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-wider mb-1.5">
                Prioridade
              </label>
              <select
                defaultValue={detail.priority}
                onChange={(e) =>
                  updateCard.mutate({ priority: e.target.value as CardPriority })
                }
                className="w-full px-2.5 py-2 text-sm border border-brand-border rounded-lg focus:outline-none focus:border-brand-accent bg-brand-surface text-brand-text-primary"
              >
                {Object.entries(PRIORITY_META).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-wider mb-2">
                Cor de destaque
              </label>
              {/* Preview da cor atual */}
              {detail.accentColor && (
                <div
                  className="flex items-center gap-2 mb-2 px-2 py-1.5 rounded-lg border border-brand-border-subtle bg-brand-surface"
                  style={{ borderLeftColor: detail.accentColor, borderLeftWidth: 3 }}
                >
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: detail.accentColor }} />
                  <span className="text-[11px] font-mono text-brand-text-muted flex-1">{detail.accentColor}</span>
                  <button
                    title="Remover cor"
                    onClick={() => updateCard.mutate({ accentColor: null })}
                    className="text-brand-text-muted hover:text-brand-error transition-colors"
                  >
                    <X size={11} />
                  </button>
                </div>
              )}
              {/* Grade de swatches */}
              <div className="grid grid-cols-6 gap-1.5">
                {ACCENT_COLORS.map((color) => (
                  <button
                    key={color}
                    title={color}
                    onClick={() => updateCard.mutate({ accentColor: color })}
                    style={{ backgroundColor: color }}
                    className={cn(
                      'w-full aspect-square rounded-lg transition-all hover:scale-110 hover:brightness-110',
                      detail.accentColor === color
                        ? 'ring-2 ring-offset-1 ring-offset-brand-surface-elevated ring-white/60 scale-105'
                        : 'opacity-75 hover:opacity-100',
                    )}
                  />
                ))}
                {/* Color picker personalizado */}
                <label
                  title="Cor personalizada"
                  className="w-full aspect-square rounded-lg border-2 border-dashed border-brand-border-subtle flex items-center justify-center cursor-pointer hover:border-brand-accent hover:bg-brand-accent-muted/20 transition-colors"
                >
                  <span className="text-brand-text-muted text-[11px] font-bold">+</span>
                  <input
                    type="color"
                    className="sr-only"
                    value={detail.accentColor ?? '#527DA3'}
                    onChange={(e) => updateCard.mutate({ accentColor: e.target.value })}
                  />
                </label>
              </div>
              <p className="text-[11px] text-brand-text-muted mt-1.5">
                Define a cor da borda esquerda do card
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-wider mb-1.5">
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
                className="w-full px-2.5 py-2 text-sm border border-brand-border rounded-lg bg-brand-surface text-brand-text-primary focus:outline-none focus:border-brand-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-wider mb-1.5">
                Status
              </label>
              <span
                className={cn(
                  'inline-block text-xs font-medium px-2.5 py-1 rounded-full',
                  detail.status === 'done'
                    ? 'bg-brand-success-subtle text-brand-success-fg'
                    : detail.status === 'in_review'
                    ? 'bg-brand-warning-subtle text-brand-warning-fg'
                    : detail.status === 'in_progress'
                    ? 'bg-brand-accent-muted text-brand-accent'
                    : 'bg-brand-surface-elevated text-brand-text-muted',
                )}
              >
                {STATUS_LABEL[detail.status] ?? detail.status}
              </span>
            </div>
          </div>
        </div>

        {/* History — sempre visível */}
        <div className="border-t border-brand-border-subtle px-6 py-4">
          <h4 className="text-xs font-semibold text-brand-text-muted uppercase tracking-wider mb-3 flex items-center gap-1">
            <Clock size={11} /> Atividade
          </h4>
          {!detail.history?.length ? (
            <p className="text-sm text-brand-text-muted text-center py-3">Nenhuma atividade ainda</p>
          ) : (
            <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
              {detail.history.map((entry) => (
                <div key={entry.id} className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-brand-surface border border-brand-border-subtle flex items-center justify-center shrink-0 mt-0.5">
                    <ActionIcon action={entry.action} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-brand-text-secondary leading-snug">
                      {entry.description}
                    </p>
                    <p className="text-xs text-brand-text-muted mt-0.5">
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

      {/* Tag Picker Panel */}
      {showTagPicker && (
        <TagPickerPanel
          boardId={boardId}
          cardTags={detail.tags ?? []}
          onAdd={(name, color) => addTag.mutate({ name, color })}
          onRemove={(tagId) => removeTag.mutate(tagId)}
          onClose={() => setShowTagPicker(false)}
          isPending={addTag.isPending || removeTag.isPending}
        />
      )}
    </motion.div>
  );
}
