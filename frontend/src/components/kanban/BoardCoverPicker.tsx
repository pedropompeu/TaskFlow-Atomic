'use client';

import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Palette, X, Upload, Trash2 } from 'lucide-react';
import { boardsApi } from '@/lib/boards';
import { cn } from '@/lib/utils';

const PRESET_COLORS = [
  '#0B0E14',  // Slate-900 (padrão)
  '#0F1A2C',  // Azul noturno
  '#0D1F18',  // Floresta escura
  '#1A0D20',  // Violeta profundo
  '#1F0D0D',  // Carmim escuro
  '#1A1200',  // Âmbar dusk
  '#0A1628',  // Oceano
  '#101C30',  // Aço noturno
  '#1A1530',  // Índigo noite
  '#0F1520',  // Ardósia
];

const PRESET_GRADIENTS = [
  'linear-gradient(135deg, #0F1A2C 0%, #1C3A5C 100%)',
  'linear-gradient(135deg, #0D1F18 0%, #1A4030 100%)',
  'linear-gradient(135deg, #1A0D20 0%, #3D1A55 100%)',
  'linear-gradient(135deg, #1F0D0D 0%, #4A1818 100%)',
  'linear-gradient(135deg, #1A1200 0%, #3D2800 100%)',
  'linear-gradient(135deg, #0B0E14 0%, #1C2540 100%)',
  'linear-gradient(135deg, #0A1628 0%, #243050 100%)',
  'linear-gradient(135deg, #131B2C 0%, #3D5070 100%)',
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
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-all border',
          open
            ? 'text-brand-accent border-brand-accent/50 bg-brand-accent-muted/30'
            : 'text-brand-text-secondary hover:text-brand-text-primary border-brand-border-subtle hover:border-brand-border bg-brand-surface hover:bg-brand-surface-elevated',
        )}
      >
        <Palette size={14} />
        <span className="hidden sm:inline">Aparência</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 w-72 bg-brand-surface-elevated border border-brand-border rounded-2xl shadow-brand-modal overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-brand-border-subtle">
              <span className="text-[11px] font-bold text-brand-text-muted uppercase tracking-[0.07em]">
                Aparência do quadro
              </span>
              <button
                onClick={() => setOpen(false)}
                className="p-1 text-brand-text-muted hover:text-brand-text-primary hover:bg-brand-surface rounded-md transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Tabs */}
              <div className="flex gap-1 bg-brand-surface rounded-lg p-0.5">
                {(['color', 'gradient', 'image'] as Tab[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={cn(
                      'flex-1 text-xs py-1.5 rounded-md font-medium transition-all',
                      tab === t
                        ? 'bg-brand-surface-elevated text-brand-text-primary shadow-sm'
                        : 'text-brand-text-muted hover:text-brand-text-secondary',
                    )}
                  >
                    {t === 'color' ? 'Cor sólida' : t === 'gradient' ? 'Gradiente' : 'Imagem'}
                  </button>
                ))}
              </div>

              {/* Color tab */}
              {tab === 'color' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-5 gap-2">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => selectColor(color)}
                        className={cn(
                          'w-full aspect-square rounded-lg border-2 transition-all hover:scale-105 hover:brightness-125',
                          updateCover.isPending && updateCover.variables?.coverValue === color
                            ? 'border-brand-accent scale-105'
                            : 'border-brand-border-subtle hover:border-brand-border',
                        )}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                    <label
                      className="w-full aspect-square rounded-lg border-2 border-dashed border-brand-border-subtle flex items-center justify-center cursor-pointer hover:border-brand-accent hover:bg-brand-accent-muted/20 transition-colors"
                      title="Cor personalizada"
                    >
                      <span className="text-brand-text-muted text-[11px] font-bold">+</span>
                      <input
                        type="color"
                        className="sr-only"
                        onChange={(e) => selectColor(e.target.value)}
                      />
                    </label>
                  </div>
                  <p className="text-[11px] text-brand-text-muted text-center">
                    Cores escuras recomendadas para o tema do dashboard
                  </p>
                </div>
              )}

              {/* Gradient tab */}
              {tab === 'gradient' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-4 gap-2">
                    {PRESET_GRADIENTS.map((grad) => (
                      <button
                        key={grad}
                        onClick={() => selectGradient(grad)}
                        className={cn(
                          'w-full h-12 rounded-xl border-2 transition-all hover:scale-105',
                          updateCover.isPending && updateCover.variables?.coverValue === grad
                            ? 'border-brand-accent'
                            : 'border-brand-border-subtle hover:border-brand-border',
                        )}
                        style={{ backgroundImage: grad }}
                      />
                    ))}
                  </div>
                  <p className="text-[11px] text-brand-text-muted text-center">
                    Gradientes da paleta Slate Protocol
                  </p>
                </div>
              )}

              {/* Image tab */}
              {tab === 'image' && (
                <div className="space-y-2">
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={uploadCover.isPending}
                    className="w-full flex flex-col items-center justify-center gap-2 py-5 border-2 border-dashed border-brand-border rounded-xl text-brand-text-secondary hover:border-brand-accent hover:text-brand-accent hover:bg-brand-accent-muted/10 disabled:opacity-50 transition-all"
                  >
                    <Upload size={18} />
                    <span className="text-sm font-medium">
                      {uploadCover.isPending ? 'Enviando…' : 'Escolher imagem'}
                    </span>
                  </button>
                  <p className="text-[11px] text-brand-text-muted text-center">
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
                  className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-brand-error py-2 rounded-lg border border-brand-error/20 hover:bg-brand-error-subtle transition-colors"
                >
                  <Trash2 size={12} />
                  Restaurar aparência padrão
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
