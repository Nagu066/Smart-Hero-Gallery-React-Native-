import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  ListRenderItem,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import Video from 'react-native-video';

import {GalleryItem} from '../types/gallery';
import {buildImageUrls, buildVideoUrls} from '../utils/mediaUrls';
import {ZoomableImage} from './ZoomableImage';

type Props = {
  visible: boolean;
  items: GalleryItem[];
  initialIndex: number;
  onClose: () => void;
};

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

const FullscreenVideo = ({
  item,
  isActive,
  isModalVisible,
}: {
  item: GalleryItem;
  isActive: boolean;
  isModalVisible: boolean;
}): React.JSX.Element => {
  const urls = useMemo(() => buildVideoUrls(item.src), [item.src]);

  const [videoUri, setVideoUri] = useState(urls.processed);
  const [posterUri, setPosterUri] = useState(urls.posterPreview);
  const [showPoster, setShowPoster] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setVideoUri(urls.processed);
    setPosterUri(urls.posterPreview);
    setShowPoster(true);
    setFailed(false);
  }, [urls.posterPreview, urls.processed]);

  useEffect(() => {
    if (!isActive || !isModalVisible) {
      setShowPoster(true);
      return;
    }

    // Slide became active: clear prior offscreen failure state.
    setFailed(false);
  }, [isActive, isModalVisible]);

  const onPosterError = useCallback(() => {
    if (posterUri === urls.posterPreview) {
      setPosterUri(urls.posterProcessed);
      return;
    }

    if (posterUri === urls.posterProcessed) {
      setPosterUri(urls.posterOriginal);
    }
  }, [posterUri, urls.posterOriginal, urls.posterPreview, urls.posterProcessed]);

  const onVideoError = useCallback(() => {
    if (videoUri === urls.processed) {
      setVideoUri(urls.original);
      setShowPoster(true);
      return;
    }

    setFailed(true);
    setShowPoster(true);
  }, [videoUri, urls.original, urls.processed]);

  const onRetry = useCallback(() => {
    setFailed(false);
    setShowPoster(true);
    setVideoUri(urls.processed);
  }, [urls.processed]);

  const shouldMountVideo = isModalVisible && isActive;

  return (
    <View style={styles.page}>
      {shouldMountVideo ? (
        <Video
          key={videoUri}
          source={{uri: videoUri}}
          controls
          paused={failed}
          resizeMode="contain"
          style={styles.fullMedia}
          onLoadStart={() => {
            setShowPoster(true);
          }}
          onLoad={() => {
            setShowPoster(false);
            setFailed(false);
          }}
          onReadyForDisplay={() => {
            setShowPoster(false);
          }}
          onError={onVideoError}
        />
      ) : null}

      {showPoster ? (
        <FastImage
          source={{uri: posterUri}}
          resizeMode={FastImage.resizeMode.contain}
          style={styles.fullMedia}
          onError={onPosterError}
        />
      ) : null}

      {showPoster ? (
        <View style={styles.centerOverlay}>
          <ActivityIndicator color="#fff" />
        </View>
      ) : null}

      {failed ? (
        <Pressable style={styles.retryOverlay} onPress={onRetry}>
          <Text style={styles.retryText}>Tap to retry</Text>
        </Pressable>
      ) : null}
    </View>
  );
};

export const FullscreenCarouselModal = ({
  visible,
  items,
  initialIndex,
  onClose,
}: Props): React.JSX.Element => {
  const flatListRef = useRef<FlatList<GalleryItem>>(null);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    if (!visible) {
      return;
    }

    setCurrentIndex(initialIndex);
    requestAnimationFrame(() => {
      flatListRef.current?.scrollToIndex({index: initialIndex, animated: false});
    });
  }, [initialIndex, visible]);

  const viewabilityConfig = useMemo(
    () => ({
      viewAreaCoveragePercentThreshold: 60,
    }),
    [],
  );

  const onViewableItemsChanged = useRef(({viewableItems}: {viewableItems: Array<{index: number | null}>}) => {
    const first = viewableItems[0];
    if (first?.index != null) {
      setCurrentIndex(first.index);
    }
  });

  const onMomentumScrollEnd = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setCurrentIndex(nextIndex);
  }, []);

  const goPrev = useCallback(() => {
    if (currentIndex <= 0) {
      return;
    }

    flatListRef.current?.scrollToIndex({index: currentIndex - 1, animated: true});
  }, [currentIndex]);

  const goNext = useCallback(() => {
    if (currentIndex >= items.length - 1) {
      return;
    }

    flatListRef.current?.scrollToIndex({index: currentIndex + 1, animated: true});
  }, [currentIndex, items.length]);

  const renderItem: ListRenderItem<GalleryItem> = useCallback(
    ({item, index}) => {
      const isActive = currentIndex === index;

      if (item.type === 'video') {
        return <FullscreenVideo item={item} isActive={isActive} isModalVisible={visible} />;
      }

      const imageUri = buildImageUrls(item.src).original;

      return (
        <View style={styles.page}>
          <ZoomableImage uri={imageUri} alt={item.alt} />
        </View>
      );
    },
    [currentIndex, visible],
  );

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.container}>
        <FlatList
          ref={flatListRef}
          data={items}
          keyExtractor={item => item._id}
          horizontal
          pagingEnabled
          renderItem={renderItem}
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged.current}
          viewabilityConfig={viewabilityConfig}
          onMomentumScrollEnd={onMomentumScrollEnd}
          extraData={currentIndex}
          getItemLayout={(_, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
        />

        <Pressable style={[styles.arrowButton, styles.leftArrow]} onPress={goPrev}>
          <Text style={styles.arrowText}>{'‹'}</Text>
        </Pressable>

        <Pressable style={[styles.arrowButton, styles.rightArrow]} onPress={goNext}>
          <Text style={styles.arrowText}>{'›'}</Text>
        </Pressable>

        <Pressable style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeText}>Close</Text>
        </Pressable>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  page: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullMedia: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  centerOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  retryOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  arrowButton: {
    position: 'absolute',
    top: '50%',
    marginTop: -24,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  leftArrow: {
    left: 12,
  },
  rightArrow: {
    right: 12,
  },
  arrowText: {
    color: '#fff',
    fontSize: 28,
    marginTop: -2,
  },
  closeButton: {
    position: 'absolute',
    top: 44,
    right: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  closeText: {
    color: '#fff',
    fontWeight: '700',
  },
});
