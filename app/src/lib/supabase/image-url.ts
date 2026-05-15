// Supabase Storage image transformation helpers.
//
// Supabase serves uploaded files at `/storage/v1/object/public/<bucket>/<path>`
// (the *original* file). On Pro+ projects the same file can be served through
// the on-the-fly image transformer at
// `/storage/v1/render/image/public/<bucket>/<path>?width=…&quality=…&resize=…`,
// which returns an appropriately sized WebP — dramatically smaller than the
// raw multi-MB uploads admins put in the bucket.
//
// These helpers are pure URL rewrites: they do not touch storage and they
// gracefully fall through for non-Supabase URLs (external CDN images,
// data URLs, local `/assets/...` paths) so callers can use them
// unconditionally.

export type SupabaseImageResize = 'cover' | 'contain' | 'fill';

export interface SupabaseImageTransform {
  /** Target width in pixels (the renderer scales to fit). */
  width?: number;
  /** Target height in pixels. Usually omit and let width drive aspect ratio. */
  height?: number;
  /** 1–100. Defaults to Supabase's own default (~80) when omitted. */
  quality?: number;
  /** How the image is fit into the target box. Defaults to `contain`. */
  resize?: SupabaseImageResize;
}

const OBJECT_PATH_SEGMENT = '/storage/v1/object/public/';
const RENDER_PATH_SEGMENT = '/storage/v1/render/image/public/';

/**
 * Returns true when the given URL looks like a Supabase Storage public object
 * URL that we can rewrite into a transform URL.
 */
function isSupabasePublicObjectUrl(url: string): boolean {
  return (
    typeof url === 'string' &&
    url.includes(OBJECT_PATH_SEGMENT) &&
    /^https?:\/\//i.test(url)
  );
}

/**
 * Convert a Supabase Storage public object URL into a transformed render URL.
 *
 * - Non-Supabase URLs (or already-transformed URLs) are returned unchanged so
 *   this can be sprinkled throughout the UI without conditional logic.
 * - Existing query parameters on the original URL are preserved.
 */
export function getTransformedImageUrl(
  url: string | null | undefined,
  transform: SupabaseImageTransform = {}
): string {
  if (!url) return '';
  if (!isSupabasePublicObjectUrl(url)) return url;
  if (url.includes(RENDER_PATH_SEGMENT)) return url;

  const transformed = url.replace(OBJECT_PATH_SEGMENT, RENDER_PATH_SEGMENT);

  const [base, existingQuery] = transformed.split('?');
  const params = new URLSearchParams(existingQuery ?? '');

  if (transform.width) params.set('width', String(Math.round(transform.width)));
  if (transform.height)
    params.set('height', String(Math.round(transform.height)));
  if (transform.quality)
    params.set(
      'quality',
      String(Math.max(1, Math.min(100, Math.round(transform.quality))))
    );
  params.set('resize', transform.resize ?? 'contain');

  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

/**
 * Build a `srcset` string for an `<img>` from a single source URL. Useful for
 * retina / high-DPI screens where we still want the browser to pick the
 * lightest acceptable variant.
 *
 * Example:
 *   buildImageSrcSet(src, [400, 800, 1200], { quality: 75 })
 *   // => "https://…?width=400&quality=75&resize=contain 400w, …"
 */
export function buildImageSrcSet(
  url: string | null | undefined,
  widths: number[],
  transform: Omit<SupabaseImageTransform, 'width'> = {}
): string | undefined {
  if (!url || !isSupabasePublicObjectUrl(url)) return undefined;
  return widths
    .map(
      w => `${getTransformedImageUrl(url, { ...transform, width: w })} ${w}w`
    )
    .join(', ');
}
