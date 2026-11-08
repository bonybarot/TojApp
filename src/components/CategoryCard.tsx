import React from 'react';
import { ImageStyle, Pressable, StyleSheet, Text, View } from 'react-native';
import { Category } from '../types';
import { colors, FONT_CAP, typography } from '../utils/theme';
import { SmartImage } from './SmartImage';

export const CategoryCard: React.FC<{
  category: Category;
  onPress: () => void;
  tall?: boolean;
}> = ({ category, onPress, tall }) => (
  <Pressable
    style={styles.card}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={`${category.title} category`}
  >
    <SmartImage
      uri={category.image}
      label={category.title}
      style={[styles.image, tall ? styles.tall : styles.wide] as unknown as ImageStyle}
    />
    <View style={styles.scrim} />
    <Text style={styles.title} maxFontSizeMultiplier={FONT_CAP} numberOfLines={1} adjustsFontSizeToFit>{category.title.toUpperCase()}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  card: { flex: 1, margin: 6, borderRadius: 8, overflow: 'hidden', justifyContent: 'flex-end' },
  image: { width: '100%' },
  tall: { aspectRatio: 3 / 4 },
  wide: { aspectRatio: 16 / 9 },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.28)' },
  title: { position: 'absolute', left: 14, right: 14, bottom: 12, color: colors.onPrimary, ...typography.label, fontSize: 13 },
});
