import React, { useState } from 'react';
import { Image, ImageStyle, StyleProp, StyleSheet, Text, View } from 'react-native';
import { colors, typography } from '../utils/theme';

interface Props {
  uri?: string;
  style?: StyleProp<ImageStyle>;
  label?: string;
}

/** Remote image with a polished fallback when it fails to load. */
export const SmartImage: React.FC<Props> = ({ uri, style, label }) => {
  const [failed, setFailed] = useState(false);
  if (!uri || failed) {
    return (
      <View style={[styles.fallback, style as object]} accessibilityElementsHidden>
        <Text allowFontScaling={false} style={styles.mark}>{(label ?? 'TOJ').slice(0, 1).toUpperCase()}</Text>
      </View>
    );
  }
  return (
    <Image
      source={{ uri }}
      style={[styles.image, style]}
      resizeMode="cover"
      onError={() => setFailed(true)}
    />
  );
};

const styles = StyleSheet.create({
  image: { backgroundColor: colors.surface },
  fallback: { backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  mark: { ...typography.display, color: colors.disabled },
});
