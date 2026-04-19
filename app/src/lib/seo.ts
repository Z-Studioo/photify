import type { MetaDescriptor } from 'react-router';

/**
 * Public site origin used for canonicals, OG, Twitter, and JSON-LD.
 * Override at build time via VITE_PUBLIC_SITE_URL.
 */
export const SITE_URL: string = (
  (typeof import.meta !== 'undefined' &&
    (import.meta.env?.VITE_PUBLIC_SITE_URL as string | undefined)) ||
  'https://photify.co'
).replace(/\/$/, '');

export const SITE_NAME = 'Photify';
export const SITE_LOCALE = 'en_GB';
export const SITE_LANG = 'en-GB';
export const SITE_TWITTER = '@photify';

const LOGO_URL =
  'https://mhlmbpnyckrqyznwmbwo.supabase.co/storage/v1/object/public/photify/public/Vector%201.png';

export const DEFAULT_OG_IMAGE = LOGO_URL;

export function absoluteUrl(path?: string | null): string {
  if (!path) return SITE_URL;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export function clampDescription(
  input: string | null | undefined,
  max = 160
): string | undefined {
  if (!input) return undefined;
  const text = input.replace(/\s+/g, ' ').trim();
  if (!text) return undefined;
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

export function clampTitle(input: string | null | undefined, max = 60): string | undefined {
  if (!input) return undefined;
  const text = input.replace(/\s+/g, ' ').trim();
  if (!text) return undefined;
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

export interface BuildMetaOptions {
  title: string;
  description?: string;
  path: string;
  image?: string | null;
  imageAlt?: string;
  type?: 'website' | 'article' | 'product';
  noindex?: boolean;
  /** One JSON-LD object or an array of them. */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  /** Extra locale alternates. */
  alternates?: { hrefLang: string; href: string }[];
}

/**
 * Build a Route.MetaFunction return array with title, description, canonical,
 * robots, Open Graph, Twitter Card, and optional JSON-LD structured data.
 */
export function buildMeta(opts: BuildMetaOptions): MetaDescriptor[] {
  const {
    title,
    description,
    path,
    image,
    imageAlt,
    type = 'website',
    noindex = false,
    jsonLd,
    alternates,
  } = opts;

  const canonical = absoluteUrl(path);
  const ogImage = image ? absoluteUrl(image) : DEFAULT_OG_IMAGE;
  const safeTitle = clampTitle(title) ?? SITE_NAME;
  const safeDescription = clampDescription(description);

  const tags: MetaDescriptor[] = [
    { charSet: 'utf-8' },
    {
      name: 'viewport',
      content: 'width=device-width, initial-scale=1.0, viewport-fit=cover',
    },
    { title: safeTitle },
    {
      name: 'robots',
      content: noindex
        ? 'noindex,nofollow'
        : 'index,follow,max-image-preview:large,max-snippet:-1',
    },
    { tagName: 'link', rel: 'canonical', href: canonical },

    { property: 'og:type', content: type },
    { property: 'og:site_name', content: SITE_NAME },
    { property: 'og:locale', content: SITE_LOCALE },
    { property: 'og:url', content: canonical },
    { property: 'og:title', content: safeTitle },
    { property: 'og:image', content: ogImage },
    { property: 'og:image:alt', content: imageAlt || safeTitle },

    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:site', content: SITE_TWITTER },
    { name: 'twitter:title', content: safeTitle },
    { name: 'twitter:image', content: ogImage },
  ];

  if (safeDescription) {
    tags.push({ name: 'description', content: safeDescription });
    tags.push({ property: 'og:description', content: safeDescription });
    tags.push({ name: 'twitter:description', content: safeDescription });
  }

  if (alternates) {
    alternates.forEach(({ hrefLang, href }) => {
      tags.push({
        tagName: 'link',
        rel: 'alternate',
        hrefLang,
        href,
      });
    });
  }

  if (jsonLd) {
    const arr = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
    arr.forEach(obj => {
      tags.push({ 'script:ld+json': obj } as unknown as MetaDescriptor);
    });
  }

  return tags;
}

// ---------------------------------------------------------------------------
// Structured-data helpers
// ---------------------------------------------------------------------------

export function organizationJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: LOGO_URL,
    sameAs: [],
  };
}

export function websiteJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/products?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export interface BreadcrumbCrumb {
  name: string;
  path: string;
}

export function breadcrumbJsonLd(crumbs: BreadcrumbCrumb[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: absoluteUrl(c.path),
    })),
  };
}

export interface ProductJsonLdInput {
  name: string;
  description?: string | null;
  image?: string | string[] | null;
  sku?: string | null;
  /** Page URL for the product (path or absolute). */
  url: string;
  brand?: string;
  price?: number | null;
  priceCurrency?: string;
  availability?:
    | 'InStock'
    | 'OutOfStock'
    | 'PreOrder'
    | 'Discontinued'
    | 'LimitedAvailability';
}

export function productJsonLd(input: ProductJsonLdInput): Record<string, unknown> {
  const images = (
    Array.isArray(input.image) ? input.image : input.image ? [input.image] : []
  ).filter(Boolean);

  const productUrl = absoluteUrl(input.url);

  const obj: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: input.name,
    url: productUrl,
    brand: { '@type': 'Brand', name: input.brand || SITE_NAME },
  };

  if (input.description) obj.description = clampDescription(input.description, 5000);
  if (images.length) obj.image = images;
  if (input.sku) obj.sku = input.sku;

  if (typeof input.price === 'number' && Number.isFinite(input.price) && input.price > 0) {
    obj.offers = {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: input.priceCurrency || 'GBP',
      price: input.price.toFixed(2),
      availability: `https://schema.org/${input.availability || 'InStock'}`,
    };
  }

  return obj;
}

export interface ItemListEntry {
  name: string;
  path: string;
  image?: string | null;
}

export function itemListJsonLd(
  items: ItemListEntry[],
  name = 'Item list'
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      url: absoluteUrl(item.path),
      ...(item.image ? { image: item.image } : {}),
    })),
  };
}
