import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, MIN_TOUCH, typography } from '../utils/theme';

export const QuantityStepper: React.FC<{
  value: number;
  max: number;
  /** Delta, not a new value: fast taps can outrun a re-render. */
  onStep: (delta: 1 | -1) => void;
}> = ({ value, max, onStep }) => (
  <View style={styles.row}>
    <Pressable
      style={styles.btn}
      hitSlop={SLOP}
      onPress={() => onStep(-1)}
      accessibilityRole="button"
      accessibilityLabel="Decrease quantity"
    >
      <Text style={styles.sym}>−</Text>
    </Pressable>
    <Text style={styles.value} accessibilityLabel={`Quantity ${value}`}>
      {value}
    </Text>
    <Pressable
      style={[styles.btn, value >= max && styles.dim]}
      hitSlop={SLOP}
      disabled={value >= max}
      onPress={() => onStep(1)}
      accessibilityRole="button"
      accessibilityLabel="Increase quantity"
    >
      <Text style={styles.sym}>+</Text>
    </Pressable>
  </View>
);

// 38 tall to keep the bordered pill compact; the slop brings the target to MIN_TOUCH.
const SLOP = { top: (MIN_TOUCH - 38) / 2, bottom: (MIN_TOUCH - 38) / 2 };

const styles = StyleSheet.create({
  dim: { opacity: 0.35 },
  row: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 8 },
  btn: { width: MIN_TOUCH, height: 38, alignItems: 'center', justifyContent: 'center' },
  sym: { fontSize: 20, color: colors.text },
  value: { ...typography.h3, minWidth: 28, textAlign: 'center' },
});
