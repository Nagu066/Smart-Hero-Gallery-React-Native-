import React, {memo, useCallback, useEffect, useMemo, useState} from 'react';
import {ActivityIndicator, Pressable, StyleSheet, Text, View} from 'react-native';
import FastImage from 'react-native-fast-image';
import Video from 'react-native-video';

import {GalleryItem} from '../types/gallery';
import {buildImageUrls, buildVideoUrls} from '../utils/mediaUrls';

type Props = {
  item: GalleryItem;
  onPress: (item: GalleryItem) => void;
  isVideoPlayable: boolean;
  shouldMountVideo: boolean;
};

const ImageTile = ({item}: {item: GalleryItem}): React.JSX.Element => {
  const urls = useMemo(() => buildImageUrls(item.src), [item.src]);

  const [mainUri, setMainUri] = useState(urls.processed);
  const [previewLoaded, setPreviewLoaded] = useState(false);
  const [mainLoaded, setMainLoaded] = useState(false);

  useEffect(() => {
    setMainUri(urls.processed);
    setPreviewLoaded(false);
    setMainLoaded(false);
  }, [urls.processed]);

  const onMainError = useCallback(() => {
    if (mainUri === urls.processed) {
      setMainUri(urls.original);
      return;
    }

    if (mainUri === urls.original) {
      setMainLoaded(true);
    }
  }, [mainUri, urls.original, urls.processed]);

  return (
    <View style={styles.fill} pointerEvents="none">
      <FastImage
        source={{uri: urls.preview}}
        resizeMode={FastImage.resizeMode.cover}
        style={[styles.fill, !previewLoaded && !mainLoaded && styles.hidden]}
        onLoad={() => setPreviewLoaded(true)}
        onError={() => setPreviewLoaded(false)}
      />

      <FastImage
        source={{uri: mainUri}}
        resizeMode={FastImage.resizeMode.cover}
        style={[styles.fill, !mainLoaded && styles.hidden]}
        onLoad={() => setMainLoaded(true)}
        onError={onMainError}
      />

      {!mainLoaded ? (
        <View style={styles.overlayCenter} pointerEvents="none">
          <ActivityIndicator color="#fff" />
        </View>
      ) : null}
    </View>
  );
};

const VideoTile = ({
  item,
  isVideoPlayable,
  shouldMountVideo,
}: {
  item: GalleryItem;
  isVideoPlayable: boolean;
  shouldMountVideo: boolean;
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
    if (!shouldMountVideo) {
      setShowPoster(true);
    }
  }, [shouldMountVideo]);

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

  return (
    <View style={styles.fill} pointerEvents="none">
      {shouldMountVideo ? (
        <Video
          key={videoUri}
          source={{uri: videoUri}}
          style={styles.fill}
          repeat
          muted
          paused={!isVideoPlayable || failed}
          useTextureView
          resizeMode="cover"
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
          resizeMode={FastImage.resizeMode.cover}
          style={styles.fill}
          onError={onPosterError}
        />
      ) : null}

      {showPoster ? (
        <View style={styles.overlayCenter} pointerEvents="none">
          <ActivityIndicator color="#fff" />
        </View>
      ) : null}

      {failed ? (
        <Pressable
          style={styles.retryOverlay}
          pointerEvents="auto"
          onPress={event => {
            event.stopPropagation();
            onRetry();
          }}
        >
          <Text style={styles.retryText}>Tap to retry</Text>
        </Pressable>
      ) : null}
    </View>
  );
};

const GalleryTileComponent = ({item, onPress, isVideoPlayable, shouldMountVideo}: Props): React.JSX.Element => {
  const handlePress = useCallback(() => {
    onPress(item);
  }, [item, onPress]);

  return (
    <Pressable style={styles.container} onPress={handlePress}>
      {item.type === 'image' ? (
        <ImageTile item={item} />
      ) : (
        <VideoTile item={item} isVideoPlayable={isVideoPlayable} shouldMountVideo={shouldMountVideo} />
      )}
    </Pressable>
  );
};

export const GalleryTile = memo(GalleryTileComponent);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#dce1eb',
  },
  fill: {
    ...StyleSheet.absoluteFillObject,
  },
  hidden: {
    opacity: 0,
  },
  overlayCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  retryOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
