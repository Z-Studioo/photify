// Event Canvas - Template Types
// Static templates the customer can pick and personalise (text + photo slots).
// Backgrounds are baked into the asset image; only the declared text and photo
// slots are editable.

export type EventCanvasOccasion =
  | 'birthday'
  | 'wedding'
  | 'engagement'
  | 'anniversary'
  | 'baby-shower'
  | 'graduation';

export interface EventCanvasOccasionMeta {
  id: EventCanvasOccasion;
  label: string;
  description: string;
}

/**
 * A single editable text region rendered on top of the template background.
 * Coordinates and sizes are in template canvas pixels (relative to the
 * background image's natural pixel size).
 */
export interface TextSlot {
  id: string;
  defaultText: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontFamily: string;
  fontSize: number;
  fontWeight?: number | 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  color: string;
  textAlign: 'left' | 'center' | 'right';
  /**
   * Optional placeholder shown in inputs when defaultText has been cleared.
   * Falls back to defaultText.
   */
  placeholder?: string;
}

/**
 * A region the customer can drop a photo into. Mirrors the shape used by the
 * 1-Photo Collage Creator so the existing crop modal contract still applies.
 */
export interface TemplatePhotoSlot {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
}

/**
 * Aspect ratio is locked to 3:4 to align with every entry in `POSTER_SIZES`.
 * This keeps the size-step from ever hitting a dead end.
 */
export type EventCanvasAspectRatio = '3:4';

export interface EventCanvasTemplate {
  id: string;
  name: string;
  occasion: EventCanvasOccasion;
  /** Small thumbnail shown in the gallery grid. Path under /public. */
  thumbnail: string;
  /** Full-resolution background image used as the bottom layer in the editor. */
  background: string;
  /**
   * Natural pixel dimensions of the background image. Used to set up the
   * fabric.js canvas so slot coordinates land where intended.
   */
  canvasWidth: number;
  canvasHeight: number;
  aspectRatio: EventCanvasAspectRatio;
  editableTexts: TextSlot[];
  photoSlots: TemplatePhotoSlot[];
}
