import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  ListRenderItem,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import FastImage from 'react-native-fast-image';

import {useSmartGallery} from '../hooks/useSmartGallery';
import {GalleryItem, PageLayout} from '../types/gallery';
import {buildImageUrls, buildVideoUrls} from '../utils/mediaUrls';
import {FullscreenCarouselModal} from './FullscreenCarouselModal';
import {GalleryTile} from './GalleryTile';
import {PageIndicator} from './PageIndicator';

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const PAGE_WIDTH = SCREEN_WIDTH;

const flattenPage = (page: PageLayout): GalleryItem[] => [page.left, page.rightTop, page.rightBottom];

const uniqueOrderedItems = (pages: PageLayout[]): GalleryItem[] => {
  const map = new Map<string, GalleryItem>();

  pages.forEach(page => {
    flattenPage(page).forEach(item => {
      if (!map.has(item._id)) {
        map.set(item._id, item);
      }
    });
  });

  return Array.from(map.values());
};

export const SmartHeroGallery = (): React.JSX.Element => {
  const {loading, error, pages, refresh} = useSmartGallery();

  const listRef = useRef<FlatList<PageLayout>>(null);
  const lastPrefetchPageRef = useRef<number>(-1);
  const [currentPage, setCurrentPage] = useState(0);
  const [hideNudge, setHideNudge] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalInitialIndex, setModalInitialIndex] = useState(0);

  const orderedItems = useMemo(() => uniqueOrderedItems(pages), [pages]);

  const prefetchNextPages = useCallback(
    (pageIndex: number) => {
      if (lastPrefetchPageRef.current === pageIndex) {
        return;
      }
      lastPrefetchPageRef.current = pageIndex;

      // Keep prefetch lightweight for iOS memory stability.
      const nextPage = pages[pageIndex + 1];
      if (!nextPage) {
        return;
      }

      const preloadUris: Array<{uri: string}> = [];

      flattenPage(nextPage).forEach(item => {
        if (item.type === 'image') {
          const imageUrls = buildImageUrls(item.src);
          preloadUris.push({uri: imageUrls.processed});
          return;
        }

        const videoUrls = buildVideoUrls(item.src);
        preloadUris.push({uri: videoUrls.posterProcessed});
      });

      if (preloadUris.length > 0) {
        FastImage.preload(preloadUris);
      }
    },
    [pages],
  );

  useEffect(() => {
    prefetchNextPages(currentPage);
  }, [currentPage, prefetchNextPages]);

  const viewabilityConfig = useMemo(
    () => ({
      viewAreaCoveragePercentThreshold: 60,
    }),
    [],
  );

  const onViewableItemsChanged = useRef(({viewableItems}: {viewableItems: Array<{index: number | null}>}) => {
    const first = viewableItems[0];
    if (first?.index == null) {
      return;
    }

    setCurrentPage(first.index);
    if (first.index > 0) {
      setHideNudge(true);
    }
  });

  const openItem = useCallback(
    (item: GalleryItem) => {
      const index = orderedItems.findIndex(entry => entry._id === item._id);
      setModalInitialIndex(index < 0 ? 0 : index);
      setModalVisible(true);
    },
    [orderedItems],
  );

  const closeModal = useCallback(() => {
    setModalVisible(false);
  }, []);

  const onNudgePress = useCallback(() => {
    if (pages.length < 2) {
      return;
    }

    listRef.current?.scrollToIndex({index: 1, animated: true});
    setHideNudge(true);
  }, [pages.length]);

  const renderPage: ListRenderItem<PageLayout> = useCallback(
    ({item, index}) => {
      const isVisiblePage = currentPage === index && !modalVisible;
      const shouldMountVideo = isVisiblePage;

      return (
        <View style={styles.pageOuter}>
          <View style={styles.pageContainer}>
            <View style={styles.leftColumn}>
              <GalleryTile
                item={item.left}
                onPress={openItem}
                isVideoPlayable={isVisiblePage}
                shouldMountVideo={shouldMountVideo}
              />
            </View>

            <View style={styles.rightColumn}>
              <View style={styles.rightTile}>
                <GalleryTile
                  item={item.rightTop}
                  onPress={openItem}
                  isVideoPlayable={isVisiblePage}
                  shouldMountVideo={shouldMountVideo}
                />
              </View>
              <View style={styles.rightTile}>
                <GalleryTile
                  item={item.rightBottom}
                  onPress={openItem}
                  isVideoPlayable={isVisiblePage}
                  shouldMountVideo={shouldMountVideo}
                />
              </View>
            </View>

            {index === 0 && !hideNudge ? (
              <Pressable style={styles.nudgeButton} onPress={onNudgePress}>
                <Text style={styles.nudgeText}>{'›'}</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      );
    },
    [currentPage, hideNudge, modalVisible, onNudgePress, openItem],
  );

  if (loading) {
    return (
      <View style={styles.stateContainer}>
        <ActivityIndicator size="large" color="#ea4f7a" />
        <Text style={styles.stateText}>Loading gallery...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.stateContainer}>
        <Text style={styles.errorTitle}>Could not load gallery</Text>
        <Text style={styles.stateText}>{error}</Text>
        <Pressable
          style={styles.retryButton}
          onPress={() => {
            refresh().catch(() => {});
          }}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  if (!pages.length) {
    return (
      <View style={styles.stateContainer}>
        <Text style={styles.stateText}>No pages could be built from this gallery.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        style={styles.list}
        data={pages}
        keyExtractor={(_, index) => `page-${index}`}
        horizontal
        pagingEnabled
        snapToInterval={PAGE_WIDTH}
        decelerationRate="fast"
        renderItem={renderPage}
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged.current}
        viewabilityConfig={viewabilityConfig}
        removeClippedSubviews={Platform.OS === 'android'}
        initialNumToRender={2}
        maxToRenderPerBatch={Platform.OS === 'ios' ? 1 : 2}
        windowSize={Platform.OS === 'ios' ? 3 : 4}
        getItemLayout={(_, index) => ({
          length: PAGE_WIDTH,
          offset: PAGE_WIDTH * index,
          index,
        })}
      />

      <PageIndicator total={pages.length} current={currentPage} />

      <FullscreenCarouselModal
        visible={modalVisible}
        items={orderedItems}
        initialIndex={modalInitialIndex}
        onClose={closeModal}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 4,
    paddingBottom: 6,
  },
  list: {
    flex: 1,
  },
  pageOuter: {
    width: PAGE_WIDTH,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  pageContainer: {
    flex: 1,
    borderRadius: 14,
    padding: 6,
    gap: 8,
    flexDirection: 'row',
    backgroundColor: '#f7f9fd',
  },
  leftColumn: {
    flex: 1,
  },
  rightColumn: {
    flex: 1,
    gap: 8,
  },
  rightTile: {
    flex: 1,
  },
  nudgeButton: {
    position: 'absolute',
    right: -14,
    top: '50%',
    marginTop: -22,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: {width: 0, height: 4},
    shadowRadius: 8,
    elevation: 5,
  },
  nudgeText: {
    width: 44,
    height: 44,
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    lineHeight: 44,
    fontSize: 30,
    color: '#ea4f7a',
    fontWeight: '700',
  },
  stateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 10,
  },
  errorTitle: {
    color: '#cc315d',
    fontSize: 18,
    fontWeight: '700',
  },
  stateText: {
    color: '#4f576a',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#ea4f7a',
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
});
