import { NavigationContainer } from '@react-navigation/native';
import { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { navigationRef } from './src/navigation/ref';
import { RootNavigator } from './src/navigation/RootNavigator';
// Loaded at start (not lazily on first use): it also registers the AppState and session-lost listeners.
import { useUserStore } from './src/store/userStore';

// Light theme only for now; status bar is always dark-content.
function App() {
  useEffect(() => {
    useUserStore.getState().restore();
  }, []);
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <NavigationContainer ref={navigationRef}>
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;
