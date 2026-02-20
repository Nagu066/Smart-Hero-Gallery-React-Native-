import {
  CDN_BASE,
  PREVIEW_PREFIX,
  PROCESSED_MOBILE_PREFIX,
} from '../constants/cdn';

const normalizeSrc = (src: string): string => (src.startsWith('/') ? src.slice(1) : src);

export type ImageUrlSet = {
  preview: string;
  processed: string;
  original: string;
};

export type VideoUrlSet = {
  processed: string;
  original: string;
  posterPreview: string;
  posterProcessed: string;
  posterOriginal: string;
};

export const buildImageUrls = (src: string): ImageUrlSet => {
  const normalized = normalizeSrc(src);

  return {
    preview: `${CDN_BASE}${PREVIEW_PREFIX}${normalized}`,
    processed: `${CDN_BASE}${PROCESSED_MOBILE_PREFIX}${normalized}`,
    original: `${CDN_BASE}/${normalized}`,
  };
};

export const buildVideoUrls = (src: string): VideoUrlSet => {
  const normalized = normalizeSrc(src);
  const posterName = `${normalized}.webp`;

  return {
    processed: `${CDN_BASE}${PROCESSED_MOBILE_PREFIX}${normalized}`,
    original: `${CDN_BASE}/${normalized}`,
    posterPreview: `${CDN_BASE}${PREVIEW_PREFIX}${posterName}`,
    posterProcessed: `${CDN_BASE}${PROCESSED_MOBILE_PREFIX}${posterName}`,
    posterOriginal: `${CDN_BASE}/${posterName}`,
  };
};
