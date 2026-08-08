/**
 * ASDD Social Platforms SSOT (Single Source of Truth)
 * Layer: shared/constants
 * Centralizes all supported social network metadata, limits, UI theming and capabilities.
 */

export type PlatformId =
  | 'ig_reel'
  | 'ig_carousel'
  | 'tiktok'
  | 'whatsapp'
  | 'yt_short'
  | 'linkedin'

export interface SocialPlatform {
  /** Unique platform slug identifier */
  id: PlatformId
  /** User-facing display label */
  label: string
  /** Dynamic CSS theme class for previews */
  themeClass: string
  /** Maximum number of media files allowed in upload/dropzone (1 = single media, >1 = carousel) */
  maxMediaFiles: number
  /** Whether the platform supports a standalone headline/title */
  hasTitle: boolean
  /** Brief description of the format */
  description: string
  /** Standard aspect ratio representation */
  aspectRatio: string
}

export const SOCIAL_PLATFORMS = [
  {
    id: 'ig_reel',
    label: 'Instagram Reel',
    themeClass: 'theme-instagram-reel',
    maxMediaFiles: 1,
    hasTitle: false,
    description: 'Video vertical 9:16 de alto dinamismo con gancho visual y retención.',
    aspectRatio: '9/16',
  },
  {
    id: 'ig_carousel',
    label: 'Instagram Carousel',
    themeClass: 'theme-instagram-carousel',
    maxMediaFiles: 10,
    hasTitle: false,
    description: 'Carrusel secuencial multi-slide para contenido educativo y paso a paso.',
    aspectRatio: '1/1',
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    themeClass: 'theme-tiktok',
    maxMediaFiles: 10,
    hasTitle: false,
    description: 'Video o carrusel de fotos 9:16 con freno de scroll y CTA rápido.',
    aspectRatio: '9/16',
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp / Historia',
    themeClass: 'theme-whatsapp',
    maxMediaFiles: 5,
    hasTitle: false,
    description: 'Estado vertical con comunicación cercana, directa y personal.',
    aspectRatio: '9/16',
  },
  {
    id: 'yt_short',
    label: 'YouTube Short',
    themeClass: 'theme-yt',
    maxMediaFiles: 1,
    hasTitle: true,
    description: 'Short vertical 9:16 con título optimizado para CTR y suscripciones.',
    aspectRatio: '9/16',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    themeClass: 'theme-linkedin',
    maxMediaFiles: 10,
    hasTitle: true,
    description: 'Post o carrusel de documentos estructurado orientado a B2B.',
    aspectRatio: '1/1',
  },
] as const satisfies readonly SocialPlatform[]

export const DEFAULT_PLATFORM: SocialPlatform = SOCIAL_PLATFORMS[0]


export function getPlatformById(id: string): SocialPlatform | undefined {
  return SOCIAL_PLATFORMS.find((p) => p.id === id)
}

export function getPlatformByLabel(label: string): SocialPlatform | undefined {
  return SOCIAL_PLATFORMS.find((p) => p.label.toLowerCase() === label.toLowerCase())
}

/**
 * Resilient lookup resolving by ID, label or partial keyword match.
 * Falls back to DEFAULT_PLATFORM if not found.
 */
export function findPlatform(query?: string): SocialPlatform {
  if (!query) return DEFAULT_PLATFORM
  const q = query.toLowerCase().trim()
  const match = SOCIAL_PLATFORMS.find(
    (p) =>
      p.id.toLowerCase() === q ||
      p.label.toLowerCase() === q ||
      (q.includes('tiktok') && p.id === 'tiktok') ||
      (q.includes('youtube') && p.id === 'yt_short') ||
      (q.includes('short') && p.id === 'yt_short') ||
      (q.includes('whatsapp') && p.id === 'whatsapp') ||
      (q.includes('historia') && p.id === 'whatsapp') ||
      (q.includes('linkedin') && p.id === 'linkedin') ||
      (q.includes('carousel') && p.id === 'ig_carousel') ||
      (q.includes('carrusel') && p.id === 'ig_carousel') ||
      (q.includes('reel') && p.id === 'ig_reel') ||
      (q.includes('instagram') && p.id === 'ig_reel'),
  )
  return match || DEFAULT_PLATFORM
}
