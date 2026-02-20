import React from 'react';
import {Dimensions, StyleSheet, View} from 'react-native';
import FastImage from 'react-native-fast-image';
import ImageZoom from 'react-native-image-pan-zoom';

type Props = {
  uri: string;
  alt?: string;
};

const {width, height} = Dimensions.get('window');

export const ZoomableImage = ({uri, alt}: Props): React.JSX.Element => {
  return (
    <View style={styles.container}>
      <ImageZoom
        cropWidth={width}
        cropHeight={height}
        imageWidth={width}
        imageHeight={height}
        minScale={1}
        maxScale={4}
        enableDoubleClickZoom
      >
        <FastImage
          source={{uri}}
          accessibilityLabel={alt}
          resizeMode={FastImage.resizeMode.contain}
          style={styles.image}
        />
      </ImageZoom>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  image: {
    width,
    height,
  },
});
