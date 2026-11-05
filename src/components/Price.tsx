import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Product } from '../types';
import { formatPrice } from '../utils/format';
import { colors, typography } from '../utils/theme';

export const Price: React.FC<{ product: Product; large?: boolean }> = ({ product, large }) => (
  <View style={styles.row}>
    <Text style={[styles.price, large && styles.large, !!product.compareAtPrice && { color: colors.error }]}>
      {formatPrice(product.price)}
    </Text>
    {!!product.compareAtPrice && (
      <Text style={styles.compare}>{formatPrice(product.compareAtPrice)}</Text>
    )}
  </View>
);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  price: { ...typography.h3, color: colors.text },
  large: { fontSize: 22 },
  compare: { ...typography.caption, color: colors.textSecondary, textDecorationLine: 'line-through' },
});
