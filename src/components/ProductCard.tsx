import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useWishlistStore } from '../store/wishlistStore';
import { Product } from '../types';
import { isSoldOut } from '../utils/catalogue';
import { colors, typography } from '../utils/theme';
import { Price } from './Price';
import { SmartImage } from './SmartImage';

interface Props {
  product: Product;
  onPress: () => void;
}

export const ProductCard: React.FC<Props> = ({ product, onPress }) => {
  const liked = useWishlistStore(s => s.ids.includes(product.id));
  const toggle = useWishlistStore(s => s.toggle);
  const soldOut = isSoldOut(product);
  return (
    <Pressable
      style={styles.card}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${product.title}${soldOut ? ', sold out' : ''}`}
    >
      <View>
        <SmartImage uri={product.image} label={product.title} style={styles.image} />
        {soldOut ? (
          <Text style={[styles.badge, { backgroundColor: colors.textSecondary }]}>SOLD OUT</Text>
        ) : (
          (!!product.compareAtPrice || !!product.tag) && (
            <Text
              style={[
                styles.badge,
                { backgroundColor: product.compareAtPrice ? colors.error : colors.primary },
              ]}
            >
              {product.compareAtPrice ? 'SALE' : product.tag?.toUpperCase()}
            </Text>
          )
        )}
        <Pressable
          style={styles.heart}
          onPress={() => toggle(product.id)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`${liked ? 'Remove' : 'Add'} ${product.title} ${liked ? 'from' : 'to'} wishlist`}
        >
          <Text style={[styles.heartText, liked && { color: colors.error }]}>{liked ? '♥' : '♡'}</Text>
        </Pressable>
      </View>
      <Text style={styles.title} numberOfLines={1}>
        {product.title}
      </Text>
      <Price product={product} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: { flex: 1, margin: 6 },
  image: { width: '100%', aspectRatio: 3 / 4, borderRadius: 8, overflow: 'hidden' },
  title: { ...typography.body, marginTop: 8, marginBottom: 2, color: colors.text },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    color: colors.onPrimary,
    ...typography.label,
    fontSize: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    overflow: 'hidden',
    borderRadius: 3,
  },
  heart: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartText: { fontSize: 20, color: colors.text },
});
