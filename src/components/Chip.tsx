import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { borderRadius, colors, MIN_TOUCH, typography } from '../utils/theme';

export const Chip: React.FC<{
  label: string;
  selected?: boolean;
  disabled?: boolean;
  onPress: () => void;
}> = ({ label, selected, disabled, onPress }) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="button"
    accessibilityState={{ selected: !!selected, disabled: !!disabled }}
    accessibilityLabel={disabled ? `${label}, unavailable` : label}
    style={[styles.chip, selected && styles.selected, disabled && styles.disabled]}
  >
    <Text
      style={[
        styles.text,
        selected && styles.textOn,
        disabled && styles.textOff,
      ]}
    >
      {label}
    </Text>
  </Pressable>
);

const styles = StyleSheet.create({
  textOn: { color: colors.onPrimary },
  textOff: { color: colors.disabled, textDecorationLine: 'line-through' },
  chip: {
    minHeight: MIN_TOUCH,
    minWidth: MIN_TOUCH,
    paddingHorizontal: 14,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  selected: { backgroundColor: colors.primary, borderColor: colors.primary },
  disabled: { backgroundColor: colors.surface },
  text: { ...typography.body, color: colors.text },
});
