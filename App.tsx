import { NavigationContainer } from '@react-navigation/native';
import { useEffect } from 'react';
import { StatusBar, useWindowDimensions } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { navigationRef } from './src/navigation/ref';
import { RootNavigator } from './src/navigation/RootNavigator';
// Loaded at start (not lazily on first use): it also registers the AppState and session-lost listeners.
import { useUserStore } from './src/store/userStore';

// Light theme only for now; status bar is always dark-content.
function App() {
  const { fontScale } = useWindowDimensions();
  useEffect(() => {
    useUserStore.getState().restore();
  }, []);
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      {/* Text size changed while open: iOS keeps stale text layout, so remount on the same screens. */}
      <NavigationContainer key={fontScale} ref={navigationRef} initialState={navigationRef.current?.getRootState()}>
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;
