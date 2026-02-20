import {TARGET_VIDEO_ASPECT_RATIO} from '../constants/cdn';
import {GalleryItem, PageLayout} from '../types/gallery';

const DEFAULT_LOOKAHEAD = 12;

const getScore = (item: GalleryItem): number => {
  if (typeof item.aspectRatio !== 'number' || Number.isNaN(item.aspectRatio)) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.abs(item.aspectRatio - TARGET_VIDEO_ASPECT_RATIO);
};

const pickClosestVideo = (items: GalleryItem[], lookahead: number): GalleryItem | null => {
  const limit = Math.max(1, Math.min(items.length, lookahead));
  const windowItems = items.slice(0, limit);

  let best: GalleryItem | null = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (const item of windowItems) {
    if (item.type !== 'video') {
      continue;
    }

    const score = getScore(item);
    if (score < bestScore) {
      best = item;
      bestScore = score;
    }
  }

  return best;
};

const takeById = (items: GalleryItem[], id: string): GalleryItem | null => {
  const index = items.findIndex(entry => entry._id === id);
  if (index < 0) {
    return null;
  }

  const [picked] = items.splice(index, 1);
  return picked;
};

const takeFirst = (items: GalleryItem[], type: GalleryItem['type']): GalleryItem | null => {
  const index = items.findIndex(entry => entry.type === type);
  if (index < 0) {
    return null;
  }

  const [picked] = items.splice(index, 1);
  return picked;
};

const buildSinglePage = (remaining: GalleryItem[], lookahead: number): PageLayout | null => {
  if (remaining.length < 3) {
    return null;
  }

  const selectedVideo = pickClosestVideo(remaining, lookahead);

  if (!selectedVideo) {
    const left = takeFirst(remaining, 'image');
    const rightTop = takeFirst(remaining, 'image');
    const rightBottom = takeFirst(remaining, 'image');

    if (!left || !rightTop || !rightBottom) {
      return null;
    }

    return {left, rightTop, rightBottom};
  }

  const video = takeById(remaining, selectedVideo._id);
  if (!video) {
    return null;
  }

  const rightTopImage = takeFirst(remaining, 'image');
  const rightBottomImage = takeFirst(remaining, 'image');

  if (rightTopImage && rightBottomImage) {
    return {
      left: video,
      rightTop: rightTopImage,
      rightBottom: rightBottomImage,
    };
  }

  const fallbackRightImage = rightTopImage ?? rightBottomImage ?? takeFirst(remaining, 'image');
  const leftImage = takeFirst(remaining, 'image');

  if (!fallbackRightImage || !leftImage) {
    if (rightTopImage) {
      remaining.unshift(rightTopImage);
    }
    if (rightBottomImage) {
      remaining.unshift(rightBottomImage);
    }
    remaining.unshift(video);
    return null;
  }

  return {
    left: leftImage,
    rightTop: video,
    rightBottom: fallbackRightImage,
  };
};

export const buildPages = (
  items: GalleryItem[],
  opts?: {
    lookahead?: number;
  },
): PageLayout[] => {
  const remaining = [...items];
  const pages: PageLayout[] = [];
  const lookahead = opts?.lookahead ?? DEFAULT_LOOKAHEAD;

  while (remaining.length >= 3) {
    const page = buildSinglePage(remaining, lookahead);
    if (!page) {
      break;
    }
    pages.push(page);
  }

  return pages;
};
