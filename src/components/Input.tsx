import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { borderRadius, colors, typography, FONT_CAP } from '../utils/theme';

interface Props extends TextInputProps {
  label: string;
  error?: string;
}

export const Input: React.FC<Props> = ({ label, error, style, ...rest }) => (
  <View style={styles.wrap}>
    <Text style={styles.label} maxFontSizeMultiplier={FONT_CAP}>{label.toUpperCase()}</Text>
    <TextInput
      accessibilityLabel={label}
      placeholderTextColor={colors.disabled}
      style={[styles.input, rest.editable === false && styles.readOnly, !!error && styles.inputError, style]}
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
  readOnly: { backgroundColor: colors.surface, color: colors.textSecondary },
  inputError: { borderColor: colors.error },
  error: { ...typography.caption, color: colors.error, marginTop: 4 },
});
