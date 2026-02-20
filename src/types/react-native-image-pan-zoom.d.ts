declare module 'react-native-image-pan-zoom' {
  import React from 'react';
  import {StyleProp, ViewStyle} from 'react-native';

  type Props = {
    cropWidth: number;
    cropHeight: number;
    imageWidth: number;
    imageHeight: number;
    minScale?: number;
    maxScale?: number;
    enableDoubleClickZoom?: boolean;
    style?: StyleProp<ViewStyle>;
    children?: React.ReactNode;
  };

  export default class ImageZoom extends React.Component<Props> {}
}
