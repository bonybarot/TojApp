import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { borderRadius, colors, typography } from '../utils/theme';

interface Props extends TextInputProps {
  label: string;
  error?: string;
}

export const Input: React.FC<Props> = ({ label, error, style, ...rest }) => (
  <View style={styles.wrap}>
    <Text style={styles.label}>{label.toUpperCase()}</Text>
    <TextInput
      accessibilityLabel={label}
      placeholderTextColor={colors.disabled}
      style={[styles.input, !!error && styles.inputError, style]}
      {...rest}
    />
    {!!error && (
      <Text style={styles.error} accessibilityRole="alert">
        {error}
      </Text>
    )}
  </View>
);

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  label: { ...typography.label, color: colors.textSecondary, marginBottom: 6 },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: 14,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.background,
  },
  inputError: { borderColor: colors.error },
  error: { ...typography.caption, color: colors.error, marginTop: 4 },
});
