import { NavigationContainer } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { StatusBar, useWindowDimensions } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorState } from './src/components/States';
import { navigationRef } from './src/navigation/ref';
import { RootNavigator } from './src/navigation/RootNavigator';
// Loaded at start (not lazily on first use): it also registers the AppState and session-lost listeners.
import { useUserStore } from './src/store/userStore';

// A render crash shows a retry screen instead of a blank app. Retry remounts navigation at the
// state App last rendered with (launch: Home), not the screen that crashed.
// ponytail: no crash reporting; a provider is an owner decision.
export class CrashBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <ErrorState message="The app hit an unexpected problem." onRetry={() => this.setState({ failed: false })} />
    ) : (
      this.props.children
    );
  }
}

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
      <CrashBoundary>
        <NavigationContainer key={fontScale} ref={navigationRef} initialState={navigationRef.current?.getRootState()}>
          <RootNavigator />
        </NavigationContainer>
      </CrashBoundary>
    </SafeAreaProvider>
  );
}

export default App;
