import React, { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../utils/theme';

interface Props {
  children: React.ReactNode;
  scroll?: boolean;
  edges?: Edge[];
  footer?: React.ReactNode;
  padded?: boolean;
}

/** Common screen shell: safe area, optional scroll + keyboard handling, sticky footer. */
export const Screen: React.FC<Props> = ({
  children,
  scroll,
  edges = ['bottom'],
  footer,
  padded,
}) => {
  // KAV compares its parent-relative frame with the window-absolute keyboard top,
  // so offset it by where its parent sits on screen (below any stack header).
  // measure() pageY, not measureInWindow: on Android the latter excludes the status bar.
  const ref = useRef<View>(null);
  const [top, setTop] = useState(0);
  return (
    <SafeAreaView
      ref={ref}
      style={styles.root}
      edges={edges}
      onLayout={() =>
        ref.current?.measure((_x, _y, _w, _h, _px, pageY) => setTop(pageY))
      }
    >
      {/* Android 15+ forces edge-to-edge, so adjustResize no longer shrinks the window: pad on both. */}
      <KeyboardAvoidingView
        style={styles.root}
        behavior="padding"
        keyboardVerticalOffset={top}
      >
        {scroll ? (
          <ScrollView
            style={styles.root}
            contentContainerStyle={padded && styles.padded}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.root, padded && styles.padded]}>{children}</View>
        )}
        {footer}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export const StickyFooter: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <View style={styles.footer}>{children}</View>;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  padded: { padding: 16 },
  footer: {
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
});
