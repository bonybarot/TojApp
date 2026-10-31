import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../utils/theme';

export const ProductGridSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <View style={styles.grid} accessibilityElementsHidden>
    {Array.from({ length: count }, (_, i) => (
      <View key={i} style={styles.cell}>
        <View style={styles.img} />
        <View style={styles.line} />
        <View style={[styles.line, styles.short]} />
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  short: { width: '35%' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10 },
  cell: { width: '50%', padding: 6 },
  img: { aspectRatio: 3 / 4, backgroundColor: colors.surface, borderRadius: 8 },
  line: { height: 12, width: '70%', backgroundColor: colors.surface, borderRadius: 4, marginTop: 10 },
});
