import React from 'react';
import {StatusBar, StyleSheet} from 'react-native';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';

import {SmartHeroGallery} from './src/components/SmartHeroGallery';

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#f2f4f9" />
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <SmartHeroGallery />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f4f9',
  },
});

export default App;
