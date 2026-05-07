import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as fabric from 'fabric';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Check,
  Image as ImageIcon,
  Loader2,
  Plus,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Minus,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { CropModal } from '@/components/product-configs/1PhotoCollageCreator/crop-modal';
import { uploadDataURLToStorage } from '@/lib/supabase/storage';
import type {
  EventCanvasTemplate,
  TemplatePhotoSlot,
  TextSlot,
} from './templates';

interface TemplateDesignerProps {
  template: EventCanvasTemplate;
  onBack: () => void;
  onDone: (compositeUrl: string) => void;
}

interface PendingCropContext {
  slot: TemplatePhotoSlot;
  imageUrl: string;
}

type SidebarTab = 'text' | 'photos';

type SelectionState =
  | {
      kind: 'text';
      slotId: string;
      bounds: { left: number; top: number; width: number; height: number };
      fontSize: number;
      bold: boolean;
      italic: boolean;
      align: 'left' | 'center' | 'right';
      color: string;
    }
  | {
      kind: 'photo';
      slotId: string;
      bounds: { left: number; top: number; width: number; height: number };
    }
  | null;

const TEXT_COLOR_PRESETS = [
  '#1a1a1a',
  '#ffffff',
  '#f63a9e',
  '#b8336a',
  '#c9a86a',
  '#7a9bb8',
  '#5a8f6a',
  '#5a5a5a',
];

/**
 * Canva-style template designer. The customer can:
 *  - Click any text slot to select it; double-click to edit inline.
 *  - Use the floating toolbar above a selected text to change colour, size,
 *    weight, italics and alignment.
 *  - Click an empty photo slot to upload a photo (via the shared CropModal).
 *  - Click a filled photo slot to swap or remove the photo.
 *  - Use the left sidebar tabs (Text / Photos) to jump to any slot.
 */
export function TemplateDesigner({
  template,
  onBack,
  onDone,
}: TemplateDesignerProps) {
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const slotInputRef = useRef<HTMLInputElement>(null);
  const pendingSlotRef = useRef<TemplatePhotoSlot | null>(null);

  const [isReady, setIsReady] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [viewportScale, setViewportScale] = useState(1);
  const [pendingCrop, setPendingCrop] = useState<PendingCropContext | null>(
    null
  );
  const [filledSlotIds, setFilledSlotIds] = useState<Set<string>>(new Set());
  const [textValues, setTextValues] = useState<Record<string, string>>(() =>
    template.editableTexts.reduce(
      (acc, t) => {
        acc[t.id] = t.defaultText;
        return acc;
      },
      {} as Record<string, string>
    )
  );
  const [selection, setSelection] = useState<SelectionState>(null);
  const [activeTab, setActiveTab] = useState<SidebarTab>('text');

  const textSlotById = useMemo(() => {
    const map: Record<string, TextSlot> = {};
    template.editableTexts.forEach(t => {
      map[t.id] = t;
    });
    return map;
  }, [template.editableTexts]);

  // ── Viewport scale (auto-fit) ──────────────────────────────────────────
  useEffect(() => {
    const calculate = () => {
      if (!viewportRef.current) return;
      const v = viewportRef.current;
      const availableWidth = v.clientWidth - 48;
      const availableHeight = v.clientHeight - 48;
      const scaleX = availableWidth / template.canvasWidth;
      const scaleY = availableHeight / template.canvasHeight;
      const scale = Math.min(scaleX, scaleY, 1);
      setViewportScale(scale > 0 ? scale : 0.2);
    };

    calculate();
    const ro = new ResizeObserver(calculate);
    if (viewportRef.current) ro.observe(viewportRef.current);
    return () => ro.disconnect();
  }, [template.canvasWidth, template.canvasHeight]);

  // ── Selection sync helpers ─────────────────────────────────────────────
  const syncSelectionFromObject = (obj: fabric.Object | null) => {
    if (!obj) {
      setSelection(null);
      return;
    }
    const data = (obj as any).data;
    if (!data) {
      setSelection(null);
      return;
    }
    const bounds = obj.getBoundingRect();

    if (data.kind === 'text-slot') {
      const text = obj as fabric.Textbox;
      setSelection({
        kind: 'text',
        slotId: data.slotId,
        bounds,
        fontSize: text.fontSize ?? 32,
        bold: text.fontWeight === 'bold' || text.fontWeight === 700,
        italic: text.fontStyle === 'italic',
        align: (text.textAlign ?? 'left') as 'left' | 'center' | 'right',
        color: (text.fill as string) ?? '#1a1a1a',
      });
      return;
    }
    if (data.kind === 'photo-fill' || data.kind === 'photo-slot-guide') {
      setSelection({
        kind: 'photo',
        slotId: data.slotId,
        bounds,
      });
      return;
    }
    setSelection(null);
  };

  // ── Initialise fabric canvas once per template ─────────────────────────
  useEffect(() => {
    if (!canvasElRef.current || fabricCanvasRef.current) return;

    canvasElRef.current.width = template.canvasWidth;
    canvasElRef.current.height = template.canvasHeight;

    const fabricCanvas = new fabric.Canvas(canvasElRef.current, {
      width: template.canvasWidth,
      height: template.canvasHeight,
      backgroundColor: '#f3f4f6',
      selection: false,
      preserveObjectStacking: true,
    });
    fabricCanvasRef.current = fabricCanvas;

    let cancelled = false;

    fabric.FabricImage.fromURL(template.background, {
      crossOrigin: 'anonymous',
    })
      .then(bgImg => {
        if (cancelled || !fabricCanvasRef.current) return;
        const widthScale = template.canvasWidth / (bgImg.width || 1);
        const heightScale = template.canvasHeight / (bgImg.height || 1);
        bgImg.set({
          left: 0,
          top: 0,
          originX: 'left',
          originY: 'top',
          scaleX: widthScale,
          scaleY: heightScale,
          selectable: false,
          evented: false,
          hoverCursor: 'default',
        });
        (bgImg as any).data = { kind: 'background' };
        fabricCanvas.add(bgImg);
        fabricCanvas.sendObjectToBack(bgImg);
        fabricCanvas.requestRenderAll();
      })
      .catch(() => {
        const placeholder = new fabric.Rect({
          left: 0,
          top: 0,
          width: template.canvasWidth,
          height: template.canvasHeight,
          fill: '#fce7f3',
          selectable: false,
          evented: false,
        });
        (placeholder as any).data = { kind: 'background' };
        fabricCanvas.add(placeholder);
        fabricCanvas.sendObjectToBack(placeholder);
        fabricCanvas.requestRenderAll();
      });

    template.editableTexts.forEach(slot => addTextSlot(fabricCanvas, slot));
    template.photoSlots.forEach(slot =>
      addPhotoSlotGuide(fabricCanvas, slot)
    );

    // Click an empty photo slot guide → open file picker.
    const handleMouseUp = (e: any) => {
      const target = e.target;
      if (!target) return;
      const data = (target as any).data;
      if (!data) return;
      if (data.kind === 'photo-slot-guide') {
        const slot = template.photoSlots.find(s => s.id === data.slotId);
        if (slot) {
          pendingSlotRef.current = slot;
          slotInputRef.current?.click();
        }
      }
    };
    fabricCanvas.on('mouse:up', handleMouseUp);

    fabricCanvas.on('selection:created', (e: any) =>
      syncSelectionFromObject(e.selected?.[0] ?? null)
    );
    fabricCanvas.on('selection:updated', (e: any) =>
      syncSelectionFromObject(e.selected?.[0] ?? null)
    );
    fabricCanvas.on('selection:cleared', () => setSelection(null));

    // Re-sync floating toolbar position as objects move/render.
    fabricCanvas.on('after:render', () => {
      const active = fabricCanvas.getActiveObject();
      if (active) {
        const bounds = active.getBoundingRect();
        setSelection(prev =>
          prev ? { ...prev, bounds } : prev
        );
      }
    });

    // Persist text edits when the customer leaves edit mode.
    fabricCanvas.on('text:editing:exited', (e: any) => {
      const obj = e.target as fabric.Textbox | undefined;
      if (!obj) return;
      const data = (obj as any).data;
      if (data?.kind !== 'text-slot') return;
      const next = obj.text ?? '';
      setTextValues(prev => ({ ...prev, [data.slotId]: next }));
    });

    setIsReady(true);

    return () => {
      cancelled = true;
      fabricCanvas.off();
      fabricCanvas.getObjects().forEach(obj => fabricCanvas.remove(obj));
      fabricCanvas.dispose();
      fabricCanvasRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template.id]);

  // ── Helpers for adding canvas objects ──────────────────────────────────
  function addTextSlot(canvas: fabric.Canvas, slot: TextSlot) {
    const text = new fabric.Textbox(slot.defaultText, {
      left: slot.x,
      top: slot.y,
      width: slot.width,
      fontFamily: slot.fontFamily,
      fontSize: slot.fontSize,
      fontWeight: slot.fontWeight ?? 'normal',
      fontStyle: slot.fontStyle ?? 'normal',
      fill: slot.color,
      textAlign: slot.textAlign,
      originX: 'left',
      originY: 'top',
      editable: true,
      selectable: true,
      hasBorders: true,
      hasControls: false,
      lockMovementX: true,
      lockMovementY: true,
      lockRotation: true,
      lockScalingX: true,
      lockScalingY: true,
      borderColor: '#6366f1',
      borderDashArray: [6, 4],
      cursorWidth: 2,
      cursorColor: '#6366f1',
      hoverCursor: 'text',
      padding: 4,
    });
    (text as any).data = { kind: 'text-slot', slotId: slot.id };
    canvas.add(text);
  }

  function addPhotoSlotGuide(canvas: fabric.Canvas, slot: TemplatePhotoSlot) {
    const guide = new fabric.Rect({
      left: slot.x,
      top: slot.y,
      width: slot.width,
      height: slot.height,
      fill: 'rgba(99, 102, 241, 0.08)',
      stroke: '#6366f1',
      strokeWidth: 4,
      strokeDashArray: [16, 12],
      strokeUniform: true,
      originX: 'left',
      originY: 'top',
      angle: slot.rotation || 0,
      selectable: true,
      hasControls: false,
      hasBorders: false,
      lockMovementX: true,
      lockMovementY: true,
      lockRotation: true,
      lockScalingX: true,
      lockScalingY: true,
      hoverCursor: 'pointer',
    });
    (guide as any).data = { kind: 'photo-slot-guide', slotId: slot.id };
    canvas.add(guide);

    const icon = new fabric.Text('+', {
      left: slot.x + slot.width / 2,
      top: slot.y + slot.height / 2,
      fontFamily: 'Mona Sans, sans-serif',
      fontSize: Math.min(slot.width, slot.height) * 0.4,
      fill: '#6366f1',
      originX: 'center',
      originY: 'center',
      selectable: false,
      evented: false,
    });
    (icon as any).data = { kind: 'photo-slot-guide-icon', slotId: slot.id };
    canvas.add(icon);
  }

  // ── Sidebar interactions: clicking a slot focuses it on canvas ─────────
  function focusSlot(kind: 'text-slot' | 'photo', slotId: string) {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const matchKind =
      kind === 'text-slot'
        ? ['text-slot']
        : ['photo-fill', 'photo-slot-guide'];
    const obj = canvas.getObjects().find(o => {
      const d = (o as any).data;
      return d && matchKind.includes(d.kind) && d.slotId === slotId;
    });
    if (obj) {
      canvas.setActiveObject(obj);
      canvas.requestRenderAll();
      syncSelectionFromObject(obj);
    }
  }

  // ── Photo slot upload + crop ───────────────────────────────────────────
  function handleSlotFile(file: File) {
    const slot = pendingSlotRef.current;
    if (!slot) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please pick an image file');
      return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      const url = e.target?.result as string;
      setPendingCrop({ slot, imageUrl: url });
    };
    reader.readAsDataURL(file);
  }

  function placeCroppedPhotoIntoSlot(
    slot: TemplatePhotoSlot,
    imageUrl: string,
    cropData: {
      x: number;
      y: number;
      width: number;
      height: number;
      scale: number;
      rotation: number;
    }
  ) {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    fabric.FabricImage.fromURL(imageUrl, { crossOrigin: 'anonymous' })
      .then(img => {
        img.set({
          cropX: cropData.x,
          cropY: cropData.y,
          width: cropData.width,
          height: cropData.height,
        });
        const scaleX = slot.width / cropData.width;
        const scaleY = slot.height / cropData.height;
        img.set({
          left: slot.x,
          top: slot.y,
          originX: 'left',
          originY: 'top',
          scaleX,
          scaleY,
          angle: slot.rotation || 0,
          selectable: true,
          hasControls: false,
          hasBorders: true,
          borderColor: '#6366f1',
          lockMovementX: true,
          lockMovementY: true,
          lockRotation: true,
          lockScalingX: true,
          lockScalingY: true,
          hoverCursor: 'pointer',
        });
        (img as any).data = { kind: 'photo-fill', slotId: slot.id };

        canvas.getObjects().forEach(obj => {
          const d = (obj as any).data;
          if (d?.kind === 'photo-fill' && d.slotId === slot.id) {
            canvas.remove(obj);
          }
        });

        canvas.add(img);

        canvas.getObjects().forEach(obj => {
          const d = (obj as any).data;
          if (
            (d?.kind === 'photo-slot-guide' ||
              d?.kind === 'photo-slot-guide-icon') &&
            d.slotId === slot.id
          ) {
            obj.set({ visible: false });
          }
        });

        canvas.getObjects().forEach(obj => {
          const d = (obj as any).data;
          if (d?.kind === 'text-slot') canvas.bringObjectToFront(obj);
        });

        canvas.requestRenderAll();
        setFilledSlotIds(prev => new Set(prev).add(slot.id));
      })
      .catch(() => {
        toast.error('Failed to load that photo');
      });
  }

  function removePhotoFromSlot(slotId: string) {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    canvas.getObjects().forEach(obj => {
      const d = (obj as any).data;
      if (d?.kind === 'photo-fill' && d.slotId === slotId) {
        canvas.remove(obj);
      }
      if (
        (d?.kind === 'photo-slot-guide' ||
          d?.kind === 'photo-slot-guide-icon') &&
        d.slotId === slotId
      ) {
        obj.set({ visible: true });
      }
    });
    canvas.discardActiveObject();
    canvas.requestRenderAll();
    setFilledSlotIds(prev => {
      const next = new Set(prev);
      next.delete(slotId);
      return next;
    });
    setSelection(null);
  }

  // ── Floating toolbar mutation helpers ──────────────────────────────────
  function withSelectedText(mutator: (obj: fabric.Textbox) => void) {
    const canvas = fabricCanvasRef.current;
    if (!canvas || selection?.kind !== 'text') return;
    const obj = canvas.getObjects().find(o => {
      const d = (o as any).data;
      return d?.kind === 'text-slot' && d.slotId === selection.slotId;
    }) as fabric.Textbox | undefined;
    if (!obj) return;
    mutator(obj);
    canvas.requestRenderAll();
    syncSelectionFromObject(obj);
  }

  const setTextSize = (delta: number) =>
    withSelectedText(obj => {
      const next = Math.max(12, Math.min(600, (obj.fontSize ?? 32) + delta));
      obj.set({ fontSize: next });
    });

  const toggleBold = () =>
    withSelectedText(obj => {
      const isBold = obj.fontWeight === 'bold' || obj.fontWeight === 700;
      obj.set({ fontWeight: isBold ? 'normal' : 'bold' });
    });

  const toggleItalic = () =>
    withSelectedText(obj => {
      const isItalic = obj.fontStyle === 'italic';
      obj.set({ fontStyle: isItalic ? 'normal' : 'italic' });
    });

  const setAlign = (align: 'left' | 'center' | 'right') =>
    withSelectedText(obj => {
      obj.set({ textAlign: align });
    });

  const setTextColor = (color: string) =>
    withSelectedText(obj => {
      obj.set({ fill: color });
    });

  // ── Done: export composite + upload ────────────────────────────────────
  async function handleDone() {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    if (filledSlotIds.size < template.photoSlots.length) {
      toast.error('Add a photo to every slot before continuing');
      setActiveTab('photos');
      return;
    }

    setIsExporting(true);
    const exportToast = toast.loading('Saving your design...');

    const guideObjects = canvas.getObjects().filter(o => {
      const d = (o as any).data;
      return (
        d?.kind === 'photo-slot-guide' ||
        d?.kind === 'photo-slot-guide-icon' ||
        d?.kind === 'text-slot'
      );
    });
    const previousState = guideObjects.map(g => ({
      visible: g.visible !== false,
      hasBorders: (g as any).hasBorders,
    }));

    guideObjects.forEach(g => {
      const d = (g as any).data;
      if (d?.kind === 'text-slot') {
        (g as any).hasBorders = false;
      } else {
        g.set({ visible: false });
      }
    });
    canvas.discardActiveObject();
    canvas.requestRenderAll();

    try {
      const dataUrl = canvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 1,
      });
      const publicUrl = await uploadDataURLToStorage(
        dataUrl,
        'poster-uploads',
        `event-canvas-${template.id}-${Date.now()}.png`
      );
      if (!publicUrl) throw new Error('Upload returned no URL');
      toast.success('Design saved!', { id: exportToast });
      onDone(publicUrl);
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Could not save your design. Please try again.', {
        id: exportToast,
      });
    } finally {
      guideObjects.forEach((g, i) => {
        const d = (g as any).data;
        if (d?.kind === 'text-slot') {
          (g as any).hasBorders = previousState[i].hasBorders;
        } else {
          g.set({ visible: previousState[i].visible });
        }
      });
      canvas.requestRenderAll();
      setIsExporting(false);
    }
  }

  // ── Floating toolbar position (in canvas-wrapper pixel space) ──────────
  const toolbarPosition = useMemo(() => {
    if (!selection) return null;
    return {
      left: selection.bounds.left * viewportScale,
      top: selection.bounds.top * viewportScale,
      width: selection.bounds.width * viewportScale,
      height: selection.bounds.height * viewportScale,
    };
  }, [selection, viewportScale]);

  const slotsRemaining = template.photoSlots.length - filledSlotIds.size;

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className='w-full h-full min-h-0 flex flex-col bg-[#f7f7fb] overflow-hidden'>
      {/* Hidden file input for photo slots */}
      <input
        ref={slotInputRef}
        type='file'
        accept='image/*'
        className='hidden'
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) handleSlotFile(file);
          if (slotInputRef.current) slotInputRef.current.value = '';
        }}
      />

      {/* TOP BAR */}
      <div className='flex items-center justify-between gap-2 px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 bg-white border-b border-gray-200'>
        <button
          onClick={onBack}
          className='inline-flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm text-gray-700 hover:bg-gray-100 transition-colors'
        >
          <ArrowLeft className='w-3.5 h-3.5 sm:w-4 sm:h-4' />
          <span className='hidden sm:inline'>Back to templates</span>
        </button>

        <div className='flex-1 text-center min-w-0'>
          <p className='text-[10px] sm:text-[11px] uppercase tracking-wider text-gray-400 font-semibold'>
            Designing
          </p>
          <h2 className='text-sm sm:text-base font-semibold text-gray-900 truncate'>
            {template.name}
          </h2>
        </div>

        <Button
          onClick={handleDone}
          disabled={isExporting || !isReady}
          className='h-8 sm:h-9 px-3 sm:px-4 bg-[#f63a9e] hover:bg-[#e02d8d] text-white rounded-lg font-semibold text-xs sm:text-sm shadow-md disabled:opacity-50'
        >
          {isExporting ? (
            <>
              <Loader2 className='w-3.5 h-3.5 mr-1 sm:mr-1.5 animate-spin' />
              Saving...
            </>
          ) : (
            <>
              <span className='hidden sm:inline'>Continue to size</span>
              <span className='sm:hidden'>Continue</span>
              <Check className='w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1 sm:ml-1.5' />
            </>
          )}
        </Button>
      </div>

      {/* BODY */}
      <div className='flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden'>
        {/* SIDEBAR */}
        <aside className='order-2 lg:order-1 w-full lg:w-[280px] xl:w-[300px] flex-shrink-0 bg-white lg:border-r border-t lg:border-t-0 border-gray-200 flex flex-col h-[38vh] lg:h-auto lg:min-h-0'>
          {/* Tab switcher */}
          <div className='flex border-b border-gray-200 px-2 sm:px-3 pt-2 gap-1'>
            <SidebarTabButton
              active={activeTab === 'text'}
              onClick={() => setActiveTab('text')}
              icon={<Type className='w-3.5 h-3.5' />}
              label='Text'
              count={template.editableTexts.length}
            />
            <SidebarTabButton
              active={activeTab === 'photos'}
              onClick={() => setActiveTab('photos')}
              icon={<ImageIcon className='w-3.5 h-3.5' />}
              label='Photos'
              count={`${filledSlotIds.size}/${template.photoSlots.length}`}
              warn={slotsRemaining > 0}
            />
          </div>

          <div className='flex-1 overflow-y-auto p-3 sm:p-4 space-y-2'>
            {activeTab === 'text' &&
              template.editableTexts.map(slot => {
                const value = textValues[slot.id] ?? slot.defaultText;
                const isSelected =
                  selection?.kind === 'text' && selection.slotId === slot.id;
                return (
                  <button
                    key={slot.id}
                    type='button'
                    onClick={() => focusSlot('text-slot', slot.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/60 shadow-sm'
                        : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30'
                    }`}
                  >
                    <div className='flex items-center justify-between gap-2 mb-0.5'>
                      <span className='text-[10px] uppercase tracking-wide text-gray-500 font-semibold truncate'>
                        {slot.placeholder ?? slot.id.replace(/-/g, ' ')}
                      </span>
                      <Type className='w-3 h-3 text-gray-400 flex-shrink-0' />
                    </div>
                    <div
                      className='text-sm font-medium text-gray-900 truncate'
                      style={{
                        fontFamily: slot.fontFamily,
                        fontStyle: slot.fontStyle,
                      }}
                    >
                      {value || (
                        <span className='italic text-gray-400'>Empty</span>
                      )}
                    </div>
                  </button>
                );
              })}

            {activeTab === 'text' &&
              template.editableTexts.length === 0 && (
                <p className='text-xs text-gray-500 px-1 py-3 text-center'>
                  This template has no editable text.
                </p>
              )}

            {activeTab === 'photos' &&
              template.photoSlots.map((slot, idx) => {
                const filled = filledSlotIds.has(slot.id);
                const isSelected =
                  selection?.kind === 'photo' && selection.slotId === slot.id;
                return (
                  <div
                    key={slot.id}
                    className={`rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/60'
                        : filled
                          ? 'border-emerald-300 bg-emerald-50/50'
                          : 'border-gray-200 hover:border-indigo-300'
                    }`}
                  >
                    <button
                      type='button'
                      onClick={() => {
                        if (filled) {
                          focusSlot('photo', slot.id);
                        } else {
                          pendingSlotRef.current = slot;
                          slotInputRef.current?.click();
                        }
                      }}
                      className='w-full flex items-center gap-3 px-3 py-2.5 text-left'
                    >
                      <div
                        className={`w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0 ${
                          filled
                            ? 'bg-emerald-500 text-white'
                            : 'bg-indigo-100 text-indigo-600'
                        }`}
                      >
                        {filled ? (
                          <Check className='w-4 h-4' />
                        ) : (
                          <Plus className='w-4 h-4' />
                        )}
                      </div>
                      <div className='flex-1 min-w-0'>
                        <div className='text-sm font-medium text-gray-900'>
                          Photo {idx + 1}
                        </div>
                        <div className='text-[11px] text-gray-500'>
                          {filled
                            ? 'Tap to focus on canvas'
                            : `${Math.round(slot.width)} × ${Math.round(
                                slot.height
                              )} px`}
                        </div>
                      </div>
                    </button>
                    {filled && (
                      <div className='flex items-center gap-1 px-3 pb-2'>
                        <button
                          type='button'
                          onClick={() => {
                            pendingSlotRef.current = slot;
                            slotInputRef.current?.click();
                          }}
                          className='inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white border border-gray-200 text-[11px] font-medium text-gray-700 hover:bg-gray-50'
                        >
                          <RefreshCw className='w-3 h-3' />
                          Replace
                        </button>
                        <button
                          type='button'
                          onClick={() => removePhotoFromSlot(slot.id)}
                          className='inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white border border-gray-200 text-[11px] font-medium text-red-600 hover:bg-red-50 hover:border-red-200'
                        >
                          <Trash2 className='w-3 h-3' />
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

            {activeTab === 'photos' && template.photoSlots.length === 0 && (
              <p className='text-xs text-gray-500 px-1 py-3 text-center'>
                This template doesn&apos;t use photos.
              </p>
            )}
          </div>

          {slotsRemaining > 0 && (
            <div className='border-t border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-700'>
              Add {slotsRemaining} more photo
              {slotsRemaining === 1 ? '' : 's'} to continue.
            </div>
          )}
        </aside>

        {/* CANVAS AREA */}
        <div
          ref={viewportRef}
          className='order-1 lg:order-2 flex-1 relative overflow-hidden bg-[#f7f7fb] flex items-center justify-center min-h-0 p-3 sm:p-4 md:p-6'
        >
          {!isReady && (
            <div className='absolute inset-0 flex items-center justify-center'>
              <Loader2 className='w-8 h-8 animate-spin text-[#f63a9e]' />
            </div>
          )}

          {/* Canvas wrapper — stays exactly the rendered size so the floating
              toolbar can be positioned relative to it. */}
          <div
            className='relative shadow-2xl rounded-md overflow-visible bg-white'
            style={{
              width: template.canvasWidth * viewportScale,
              height: template.canvasHeight * viewportScale,
            }}
          >
            <div
              className='overflow-hidden'
              style={{
                width: template.canvasWidth * viewportScale,
                height: template.canvasHeight * viewportScale,
              }}
            >
              <div
                style={{
                  width: template.canvasWidth,
                  height: template.canvasHeight,
                  transform: `scale(${viewportScale})`,
                  transformOrigin: 'top left',
                }}
              >
                <canvas ref={canvasElRef} />
              </div>
            </div>

            {/* FLOATING TOOLBAR — positioned over the selected element */}
            <AnimatePresence>
              {selection && toolbarPosition && (
                <FloatingToolbar
                  key={`${selection.kind}-${selection.slotId}`}
                  selection={selection}
                  position={toolbarPosition}
                  onSizeChange={setTextSize}
                  onToggleBold={toggleBold}
                  onToggleItalic={toggleItalic}
                  onAlign={setAlign}
                  onColor={setTextColor}
                  onReplacePhoto={() => {
                    const slot = template.photoSlots.find(
                      s =>
                        selection.kind === 'photo' &&
                        s.id === selection.slotId
                    );
                    if (slot) {
                      pendingSlotRef.current = slot;
                      slotInputRef.current?.click();
                    }
                  }}
                  onRemovePhoto={() => {
                    if (selection.kind === 'photo')
                      removePhotoFromSlot(selection.slotId);
                  }}
                  isFilled={
                    selection.kind === 'photo' &&
                    filledSlotIds.has(selection.slotId)
                  }
                  fontFamily={
                    selection.kind === 'text'
                      ? textSlotById[selection.slotId]?.fontFamily
                      : undefined
                  }
                />
              )}
            </AnimatePresence>
          </div>

          {/* Zoom indicator */}
          <div className='absolute bottom-3 right-3 bg-white border border-gray-200 rounded-full px-3 py-1 text-[11px] font-medium text-gray-600 shadow-sm'>
            {Math.round(viewportScale * 100)}%
          </div>
        </div>
      </div>

      {/* Crop modal */}
      {pendingCrop && (
        <CropModal
          isOpen
          imageUrl={pendingCrop.imageUrl}
          slotWidth={pendingCrop.slot.width}
          slotHeight={pendingCrop.slot.height}
          onClose={() => setPendingCrop(null)}
          onCrop={cropData => {
            placeCroppedPhotoIntoSlot(
              pendingCrop.slot,
              pendingCrop.imageUrl,
              cropData
            );
            setPendingCrop(null);
          }}
        />
      )}
    </div>
  );
}

// ── Floating contextual toolbar ────────────────────────────────────────

interface FloatingToolbarProps {
  selection: NonNullable<SelectionState>;
  position: { left: number; top: number; width: number; height: number };
  onSizeChange: (delta: number) => void;
  onToggleBold: () => void;
  onToggleItalic: () => void;
  onAlign: (align: 'left' | 'center' | 'right') => void;
  onColor: (color: string) => void;
  onReplacePhoto: () => void;
  onRemovePhoto: () => void;
  isFilled: boolean;
  fontFamily?: string;
}

function FloatingToolbar({
  selection,
  position,
  onSizeChange,
  onToggleBold,
  onToggleItalic,
  onAlign,
  onColor,
  onReplacePhoto,
  onRemovePhoto,
  isFilled,
}: FloatingToolbarProps) {
  const [showColors, setShowColors] = useState(false);

  // Place toolbar above the selection; if it would clip, drop it below.
  const TOOLBAR_OFFSET = 12;
  const TOOLBAR_HEIGHT = 44;
  const placeAbove = position.top > TOOLBAR_HEIGHT + TOOLBAR_OFFSET;
  const toolbarTop = placeAbove
    ? position.top - TOOLBAR_HEIGHT - TOOLBAR_OFFSET
    : position.top + position.height + TOOLBAR_OFFSET;

  return (
    <motion.div
      initial={{ opacity: 0, y: placeAbove ? 6 : -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: placeAbove ? 6 : -6 }}
      transition={{ duration: 0.12 }}
      style={{
        left: position.left + position.width / 2,
        top: toolbarTop,
        transform: 'translateX(-50%)',
      }}
      className='absolute z-20 pointer-events-auto'
    >
      <div className='flex items-center gap-0.5 bg-white rounded-xl shadow-xl border border-gray-200 p-1 whitespace-nowrap'>
        {selection.kind === 'text' ? (
          <>
            <ToolbarBtn
              onClick={() => onSizeChange(-4)}
              tooltip='Smaller'
            >
              <Minus className='w-3.5 h-3.5' />
            </ToolbarBtn>
            <span className='px-1.5 text-[11px] font-semibold text-gray-700 tabular-nums w-7 text-center'>
              {selection.fontSize}
            </span>
            <ToolbarBtn onClick={() => onSizeChange(4)} tooltip='Larger'>
              <Plus className='w-3.5 h-3.5' />
            </ToolbarBtn>

            <Divider />

            <ToolbarBtn
              onClick={onToggleBold}
              active={selection.bold}
              tooltip='Bold'
            >
              <Bold className='w-3.5 h-3.5' />
            </ToolbarBtn>
            <ToolbarBtn
              onClick={onToggleItalic}
              active={selection.italic}
              tooltip='Italic'
            >
              <Italic className='w-3.5 h-3.5' />
            </ToolbarBtn>

            <Divider />

            <ToolbarBtn
              onClick={() => onAlign('left')}
              active={selection.align === 'left'}
              tooltip='Align left'
            >
              <AlignLeft className='w-3.5 h-3.5' />
            </ToolbarBtn>
            <ToolbarBtn
              onClick={() => onAlign('center')}
              active={selection.align === 'center'}
              tooltip='Align center'
            >
              <AlignCenter className='w-3.5 h-3.5' />
            </ToolbarBtn>
            <ToolbarBtn
              onClick={() => onAlign('right')}
              active={selection.align === 'right'}
              tooltip='Align right'
            >
              <AlignRight className='w-3.5 h-3.5' />
            </ToolbarBtn>

            <Divider />

            <button
              type='button'
              onClick={() => setShowColors(s => !s)}
              className='w-7 h-7 rounded-md flex items-center justify-center hover:bg-gray-100 transition-colors relative'
              title='Text colour'
            >
              <span
                className='w-4 h-4 rounded-full border border-gray-300'
                style={{ backgroundColor: selection.color }}
              />
            </button>
            {showColors && (
              <div className='absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-xl border border-gray-200 p-2 grid grid-cols-4 gap-1.5'>
                {TEXT_COLOR_PRESETS.map(c => (
                  <button
                    key={c}
                    type='button'
                    onClick={() => {
                      onColor(c);
                      setShowColors(false);
                    }}
                    className={`w-6 h-6 rounded-full border-2 transition-all ${
                      selection.color === c
                        ? 'border-indigo-500 scale-110'
                        : 'border-gray-200 hover:scale-105'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <ToolbarBtn onClick={onReplacePhoto} tooltip='Replace photo'>
              <RefreshCw className='w-3.5 h-3.5 mr-1' />
              <span className='text-[11px] font-semibold pr-1'>
                {isFilled ? 'Replace' : 'Add photo'}
              </span>
            </ToolbarBtn>
            {isFilled && (
              <>
                <Divider />
                <ToolbarBtn
                  onClick={onRemovePhoto}
                  tooltip='Remove photo'
                  danger
                >
                  <Trash2 className='w-3.5 h-3.5' />
                </ToolbarBtn>
              </>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}

function ToolbarBtn({
  onClick,
  active,
  danger,
  children,
  tooltip,
}: {
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
  children: React.ReactNode;
  tooltip?: string;
}) {
  return (
    <button
      type='button'
      title={tooltip}
      onClick={onClick}
      className={`min-w-[28px] h-7 px-1.5 rounded-md flex items-center justify-center transition-colors ${
        danger
          ? 'text-red-600 hover:bg-red-50'
          : active
            ? 'bg-indigo-100 text-indigo-700'
            : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className='w-px h-5 bg-gray-200 mx-0.5' />;
}

function SidebarTabButton({
  active,
  onClick,
  icon,
  label,
  count,
  warn,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count?: string | number;
  warn?: boolean;
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      className={`flex-1 inline-flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-semibold rounded-t-md border-b-2 transition-colors ${
        active
          ? 'border-[#f63a9e] text-[#f63a9e]'
          : 'border-transparent text-gray-500 hover:text-gray-800'
      }`}
    >
      {icon}
      <span>{label}</span>
      {count !== undefined && (
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
            warn
              ? 'bg-amber-100 text-amber-700'
              : active
                ? 'bg-pink-100 text-[#f63a9e]'
                : 'bg-gray-100 text-gray-600'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}
