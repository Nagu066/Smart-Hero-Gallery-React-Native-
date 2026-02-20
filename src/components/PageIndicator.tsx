import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

type Props = {
  total: number;
  current: number;
};

export const PageIndicator = ({total, current}: Props): React.JSX.Element | null => {
  if (total < 1) {
    return null;
  }

  const displayIndex = Math.min(Math.max(current + 1, 1), total);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{`${displayIndex}/${total}`}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  text: {
    color: '#f4f6fb',
    fontSize: 13,
    fontWeight: '600',
  },
});
