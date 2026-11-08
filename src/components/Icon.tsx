import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../utils/theme';

type Name = 'search' | 'chevron' | 'close' | 'check';

/** Tiny view-drawn icon set (no icon dependency). */
export const Icon: React.FC<{ name: Name; size?: number; color?: string }> = ({
  name,
  size = 20,
  color = colors.text,
}) => {
  if (name === 'search') {
    const c = size * 0.65;
    return (
      <View style={{ width: size, height: size }}>
        <View style={[styles.lens, { width: c, height: c, borderRadius: c, borderColor: color }]} />
        <View
          style={[styles.handle, { width: size * 0.4, backgroundColor: color }]}
        />
      </View>
    );
  }
  if (name === 'chevron') {
    const s = size * 0.4;
    return (
      <View
        style={[styles.chevron, { width: s, height: s, borderColor: color }]}
      />
    );
  }
  return <Text allowFontScaling={false} style={{ fontSize: size, color, lineHeight: size + 2 }}>{name === 'close' ? '×' : '✓'}</Text>;
};

const styles = StyleSheet.create({
  lens: { borderWidth: 2 },
  handle: { position: 'absolute', right: 1, bottom: 2, height: 2, transform: [{ rotate: '45deg' }] },
  chevron: { borderTopWidth: 2, borderRightWidth: 2, transform: [{ rotate: '45deg' }] },
});
