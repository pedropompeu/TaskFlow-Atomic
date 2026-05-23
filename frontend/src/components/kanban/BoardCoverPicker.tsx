'use client';

import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Palette, X, Upload, Trash2 } from 'lucide-react';
import { boardsApi } from '@/lib/boards';
import { cn } from '@/lib/utils';

const PRESET_COLORS = [
  '#1D4ED8', '#7C3AED', '#DB2777', '#DC2626',
  '#EA580C', '#D97706', '#16A34A', '#0891B2',
  '#374151', '#1D1D1B',
];

const PRESET_GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
  'linear-gradient(135deg, #2d3436 0%, #636e72 100%)',
];

type Tab = 'color' | 'gradient' | 'image';

interface BoardCoverPickerProps {
  boardId: string;
  isOwner: boolean;
  hasCover: boolean;
}

export function BoardCoverPicker({ boardId, isOwner, hasCover }: BoardCoverPickerProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('color');
  const fileRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['board', boardId] });
  };

  const updateCover = useMutation({
    mutationFn: (data: { coverType: string | null; coverValue: string | null }) =>
      boardsApi.update(boardId, data),
    onSuccess: invalidate,
  });

  const uploadCover = useMutation({
    mutationFn: (file: File) => boardsApi.uploadCover(boardId, file),
    onSuccess: invalidate,
  });

  const removeCover = () => {
    updateCover.mutate({ coverType: null, coverValue: null });
    setOpen(false);
  };

  const selectColor = (value: string) => {
    updateCover.mutate({ coverType: 'color', coverValue: value });
    setOpen(false);
  };

  const selectGradient = (value: string) => {
    updateCover.mutate({ coverType: 'gradient', coverValue: value });
    setOpen(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadCover.mutate(file);
    setOpen(false);
    e.target.value = '';
  };

  if (!isOwner) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        title="Aparência do board"
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-atomic-gray-600 hover:text-atomic-dark border border-atomic-gray-300/50 hover:border-atomic-gray-300 bg-white/70 hover:bg-white rounded-lg transition-all"
      >
        <Palette size={14} />
        <span className="hidden sm:inline">Aparência</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 w-64 bg-white rounded-xl shadow-xl border border-atomic-gray-300/30 p-3">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-atomic-dark uppercase tracking-wide">Aparência do board</span>
              <button onClick={() => setOpen(false)} className="text-atomic-gray-500 hover:text-atomic-dark">
                <X size={14} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-3 bg-atomic-ice rounded-lg p-0.5">
              {(['color', 'gradient', 'image'] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn(
                    'flex-1 text-xs py-1 rounded-md font-medium transition-all capitalize',
                    tab === t
                      ? 'bg-white text-atomic-dark shadow-sm'
                      : 'text-atomic-gray-500 hover:text-atomic-dark',
                  )}
                >
                  {t === 'color' ? 'Cor' : t === 'gradient' ? 'Gradiente' : 'Imagem'}
                </button>
              ))}
            </div>

            {/* Color tab */}
            {tab === 'color' && (
              <div className="grid grid-cols-5 gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => selectColor(color)}
                    className="w-9 h-9 rounded-lg border-2 border-white shadow hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
                <label
                  className="w-9 h-9 rounded-lg border-2 border-dashed border-atomic-gray-300 flex items-center justify-center cursor-pointer hover:border-atomic-orange transition-colors"
                  title="Cor personalizada"
                >
                  <span className="text-[10px] text-atomic-gray-500">+</span>
                  <input
                    type="color"
                    className="sr-only"
                    onChange={(e) => selectColor(e.target.value)}
                  />
                </label>
              </div>
            )}

            {/* Gradient tab */}
            {tab === 'gradient' && (
              <div className="grid grid-cols-4 gap-2">
                {PRESET_GRADIENTS.map((grad) => (
                  <button
                    key={grad}
                    onClick={() => selectGradient(grad)}
                    className="w-full h-10 rounded-lg border-2 border-white shadow hover:scale-105 transition-transform"
                    style={{ backgroundImage: grad }}
                  />
                ))}
              </div>
            )}

            {/* Image tab */}
            {tab === 'image' && (
              <div>
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploadCover.isPending}
                  className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-atomic-gray-300 rounded-lg text-sm text-atomic-gray-500 hover:border-atomic-orange hover:text-atomic-orange transition-colors disabled:opacity-50"
                >
                  <Upload size={16} />
                  {uploadCover.isPending ? 'Enviando…' : 'Escolher imagem'}
                </button>
                <p className="text-[11px] text-atomic-gray-500 mt-2 text-center">
                  JPEG, PNG ou WebP · máx. 5 MB
                </p>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={handleFileChange}
                />
              </div>
            )}

            {/* Remove cover */}
            {hasCover && (
              <button
                onClick={removeCover}
                className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs text-red-500 hover:text-red-600 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
              >
                <Trash2 size={12} />
                Restaurar padrão
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
