'use client';

import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Clock,
  Paperclip,
  Plus,
  Tag,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { api } from '@/lib/api';
import { cardsApi } from '@/lib/cards';
import { useUsers } from '@/hooks/useUsers';
import { cardsKey } from '@/hooks/useCards';
import { cn } from '@/lib/utils';
import { PRIORITY_META, type Card, type CardPriority } from '@/types';

interface CardEditModalProps {
  card: Card;
  boardId: string;
  onClose: () => void;
}

const ACTION_ICON: Record<string, string> = {
  created: '🟢',
  moved: '↔️',
  assigned: '👤',
  unassigned: '👤',
  updated: '✏️',
  attachment_added: '📎',
  tag_added: '🏷️',
  tag_removed: '🏷️',
  due_date_set: '📅',
};

export function CardEditModal({ card, boardId, onClose }: CardEditModalProps) {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description ?? '');
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#6B7280');

  const { data: detail = card } = useQuery({
    queryKey: ['card', card.id],
    queryFn: () => cardsApi.get(card.id),
    initialData: card,
  });

  const { data: users = [] } = useUsers();

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
      updateCard.mutate({ description });
    }
  }

  const descriptionDirty = description !== (detail.description ?? '');

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 pt-14 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mb-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-3 px-6 pt-6 pb-4 border-b border-gray-100">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            className="flex-1 text-xl font-bold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1 -mx-1"
          />
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
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
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Description
              </h4>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a more detailed description…"
                rows={4}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
              />
              {descriptionDirty && (
                <button
                  onClick={handleDescriptionSave}
                  disabled={updateCard.isPending}
                  className="mt-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {updateCard.isPending ? 'Saving…' : 'Save'}
                </button>
              )}
            </section>

            {/* Tags */}
            <section>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Tag size={11} /> Tags
              </h4>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {detail.tags?.map((tag) => (
                  <span
                    key={tag.id}
                    className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full text-white font-medium"
                    style={{ backgroundColor: tag.color }}
                  >
                    {tag.name}
                    <button
                      onClick={() => removeTag.mutate(tag.id)}
                      className="hover:opacity-70 transition-opacity"
                      aria-label={`Remove tag ${tag.name}`}
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
                  placeholder="New tag…"
                  className="flex-1 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="color"
                  value={newTagColor}
                  onChange={(e) => setNewTagColor(e.target.value)}
                  className="w-8 h-8 rounded border border-gray-200 cursor-pointer p-0.5"
                  title="Tag color"
                />
                <button
                  onClick={() =>
                    newTagName.trim() &&
                    addTag.mutate({ name: newTagName.trim(), color: newTagColor })
                  }
                  disabled={!newTagName.trim() || addTag.isPending}
                  className="p-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
                  aria-label="Add tag"
                >
                  <Plus size={14} />
                </button>
              </div>
            </section>

            {/* Attachments */}
            <section>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Paperclip size={11} /> Attachments
              </h4>
              <div className="space-y-1.5 mb-2">
                {detail.attachments?.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 group"
                  >
                    <Paperclip size={13} className="text-gray-400 shrink-0" />
                    <span className="flex-1 text-sm text-gray-700 truncate">
                      {att.originalName}
                    </span>
                    <span className="text-xs text-gray-400 shrink-0">
                      {(att.size / 1024).toFixed(0)} KB
                    </span>
                    <button
                      onClick={() => deleteAttachment.mutate(att.id)}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
                      aria-label="Delete attachment"
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
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs border border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-600 disabled:opacity-50 transition-colors"
              >
                <Upload size={13} />
                {uploadAttachment.isPending ? 'Uploading…' : 'Attach a file'}
              </button>
            </section>
          </div>

          {/* Right column — metadata */}
          <div className="w-52 shrink-0 space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                Assignee
              </label>
              <select
                defaultValue={detail.assignedToId ?? ''}
                onChange={(e) =>
                  updateCard.mutate({ assignedToId: e.target.value || undefined })
                }
                className="w-full px-2.5 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                Priority
              </label>
              <select
                defaultValue={detail.priority}
                onChange={(e) =>
                  updateCard.mutate({ priority: e.target.value as CardPriority })
                }
                className="w-full px-2.5 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {Object.entries(PRIORITY_META).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                Due date
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
                className="w-full px-2.5 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                Status
              </label>
              <span
                className={cn(
                  'inline-block text-xs font-medium px-2.5 py-1 rounded-full',
                  detail.status === 'done'
                    ? 'bg-green-100 text-green-700'
                    : detail.status === 'in_review'
                    ? 'bg-yellow-100 text-yellow-700'
                    : detail.status === 'in_progress'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600',
                )}
              >
                {detail.status.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>

        {/* History */}
        {(detail.history?.length ?? 0) > 0 && (
          <div className="border-t border-gray-100 px-6 py-4">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1">
              <Clock size={11} /> Activity
            </h4>
            <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
              {detail.history?.map((entry) => (
                <div key={entry.id} className="flex items-start gap-3">
                  <span className="text-base leading-none shrink-0 mt-0.5">
                    {ACTION_ICON[entry.action] ?? '•'}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm text-gray-700 leading-snug">
                      {entry.description}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {entry.user?.name} ·{' '}
                      {formatDistanceToNow(parseISO(entry.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
