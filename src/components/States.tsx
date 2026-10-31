import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, typography } from '../utils/theme';
import { Button } from './Button';

interface StateProps {
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<StateProps> = ({ title, message, actionLabel, onAction }) => (
  <View style={styles.wrap}>
    <Text style={styles.title}>{title}</Text>
    {!!message && <Text style={styles.msg}>{message}</Text>}
    {!!actionLabel && !!onAction && (
      <Button title={actionLabel} onPress={onAction} style={styles.btn} />
    )}
  </View>
);

export const ErrorState: React.FC<{ message?: string; onRetry: () => void }> = ({
  message = 'Please check your connection and try again.',
  onRetry,
}) => (
  <EmptyState title="Something went wrong" message={message} actionLabel="Try again" onAction={onRetry} />
);

export const LoadingState: React.FC = () => (
  <View style={styles.wrap} accessibilityRole="progressbar">
    <ActivityIndicator color={colors.primary} />
  </View>
);

/** Banner clarifying that a flow is simulated. */
export const DemoBanner: React.FC<{ text: string }> = ({ text }) => (
  <View style={styles.demo}>
    <Text style={styles.demoText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  title: { ...typography.h2, color: colors.text, textAlign: 'center' },
  msg: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: 8 },
  btn: { marginTop: 20, alignSelf: 'stretch' },
  demo: { backgroundColor: colors.surface, borderRadius: 8, padding: 12, borderWidth: 1, borderColor: colors.border },
  demoText: { ...typography.caption, color: colors.textSecondary },
});
