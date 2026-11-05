import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
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
}) => (
  <SafeAreaView style={styles.root} edges={edges}>
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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

export const StickyFooter: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <View style={styles.footer}>{children}</View>
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  padded: { padding: 16 },
  footer: { padding: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, backgroundColor: colors.background },
});
