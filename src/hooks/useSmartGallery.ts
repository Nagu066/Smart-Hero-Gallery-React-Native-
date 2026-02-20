import {useCallback, useEffect, useMemo, useState} from 'react';

import {fetchGalleryItems} from '../api/galleryApi';
import {GalleryItem} from '../types/gallery';
import {buildPages} from '../utils/buildPages';

export const useSmartGallery = (): {
  loading: boolean;
  error: string | null;
  items: GalleryItem[];
  pages: ReturnType<typeof buildPages>;
  refresh: () => Promise<void>;
} => {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchGalleryItems();
      setItems(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown gallery error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh().catch(() => {});
  }, [refresh]);

  const pages = useMemo(() => buildPages(items, {lookahead: 12}), [items]);

  return {
    loading,
    error,
    items,
    pages,
    refresh,
  };
};
