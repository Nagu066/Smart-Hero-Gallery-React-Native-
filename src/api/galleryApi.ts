import {EXPERIENCE_GALLERY_URL} from '../constants/cdn';
import {GalleryItem} from '../types/gallery';

type GalleryApiItem = {
  _id?: string;
  src?: string;
  type?: 'image' | 'video';
  alt?: string;
  aspectRatio?: number;
};

type GalleryApiResponse = {
  data?: {
    gallery?: GalleryApiItem[];
  };
};

const normalizeItem = (item: GalleryApiItem, index: number): GalleryItem | null => {
  if (!item.src || (item.type !== 'image' && item.type !== 'video')) {
    return null;
  }

  return {
    _id: item._id ?? `${item.type}-${item.src}-${index}`,
    type: item.type,
    src: item.src,
    alt: item.alt,
    aspectRatio: item.aspectRatio,
  };
};

export const fetchGalleryItems = async (): Promise<GalleryItem[]> => {
  const response = await fetch(EXPERIENCE_GALLERY_URL);

  if (!response.ok) {
    throw new Error(`Gallery request failed: ${response.status}`);
  }

  const json = (await response.json()) as GalleryApiResponse;
  const gallery = json.data?.gallery ?? [];

  return gallery
    .map((item, index) => normalizeItem(item, index))
    .filter((item): item is GalleryItem => item !== null);
};
