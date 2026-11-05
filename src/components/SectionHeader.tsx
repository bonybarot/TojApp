import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, typography } from '../utils/theme';

export const SectionHeader: React.FC<{ title: string; action?: string; onAction?: () => void }> = ({
  title,
  action,
  onAction,
}) => (
  <View style={styles.row}>
    <Text style={styles.title} accessibilityRole="header">
      {title}
    </Text>
    {!!action && (
      <Pressable onPress={onAction} hitSlop={10} accessibilityRole="button">
        <Text style={styles.action}>{action}</Text>
      </Pressable>
    )}
  </View>
);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingHorizontal: 16, marginTop: 28, marginBottom: 10 },
  title: { ...typography.h2, color: colors.text },
  action: { ...typography.caption, color: colors.textSecondary, textDecorationLine: 'underline' },
});
