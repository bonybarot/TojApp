import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Button } from '../../components/Button';
import { Chip } from '../../components/Chip';
import { Price } from '../../components/Price';
import { Screen, StickyFooter } from '../../components/Screen';
import { SmartImage } from '../../components/SmartImage';
import { EmptyState } from '../../components/States';
import { PICKUP_STORE } from '../../data/stores';
import { RootStackParamList } from '../../navigation/types';
import { useCartStore } from '../../store/cartStore';
import { useProductStore } from '../../store/productStore';
import { useWishlistStore } from '../../store/wishlistStore';
import { isSoldOut, stockFor } from '../../utils/catalogue';
import { colors, typography } from '../../utils/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductDetails'>;

const HeartButton: React.FC<{ productId: string }> = ({ productId }) => {
  const liked = useWishlistStore(s => s.ids.includes(productId));
  const toggle = useWishlistStore(s => s.toggle);
  return (
    <Pressable
      onPress={() => toggle(productId)}
      hitSlop={10}
      style={styles.heart}
      accessibilityRole="button"
      accessibilityLabel={liked ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <Text style={[styles.heartIcon, liked && styles.heartOn]}>
        {liked ? '♥' : '♡'}
      </Text>
    </Pressable>
  );
};

const ProductDetailsScreen: React.FC<Props> = ({ route, navigation }) => {
  const product = useProductStore(s =>
    s.products.find(p => p.id === route.params.productId),
  );
  const addToCart = useCartStore(s => s.addToCart);
  const { width, height } = useWindowDimensions();
  // Square on tall phones; capped on short screens so title, price and sizes show above the fold.
  const imageHeight = Math.min(width, height * 0.45);
  const [color, setColor] = useState<string>('');
  const [size, setSize] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [added, setAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (product && !color) {
      setColor(
        (
          product.colors.find(c =>
            product.sizes.some(z => stockFor(product, c.name, z) > 0),
          ) ?? product.colors[0]
        ).name,
      );
    }
  }, [product, color]);

  useEffect(
    () => () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    },
    [],
  );

  if (!product) {
    return (
      <Screen>
        <EmptyState
          title="Product not found"
          message="It may no longer be available."
          actionLabel="Go back"
          onAction={navigation.goBack}
        />
      </Screen>
    );
  }

  const soldOut = isSoldOut(product);
  // Checkout is pickup-only (Q-2): a product without pickup cannot be ordered yet.
  const orderable = product.pickupAvailable;
  const left = size ? stockFor(product, color, size) : null;
  const availability = soldOut
    ? 'Sold out'
    : left === null
    ? 'Select a size'
    : left === 0
    ? 'Unavailable in this colour and size'
    : left <= 3
    ? `Only ${left} left`
    : 'In stock';

  const onAdd = () => {
    if (!size) {
      setMsg({ text: 'Please select a size.', ok: false });
      return;
    }
    const r = addToCart(product.id, color, size);
    if (r === 'unavailable') {
      setMsg({ text: 'This size is currently unavailable.', ok: false });
      return;
    }
    setMsg(
      r === 'limit'
        ? {
            text: 'You have the maximum available quantity in your bag.',
            ok: false,
          }
        : null,
    );
    setAdded(true);
    timer.current = setTimeout(() => setAdded(false), 1800);
  };

  return (
    <Screen
      scroll
      footer={
        <StickyFooter>
          {!!msg && (
            <Text
              style={[
                styles.msg,
                { color: msg.ok ? colors.success : colors.error },
              ]}
              accessibilityRole="alert"
            >
              {msg.text}
            </Text>
          )}
          {added ? (
            <Button
              title="Added ✓  View bag"
              variant="secondary"
              onPress={() => navigation.navigate('Tabs', { screen: 'Cart' })}
            />
          ) : (
            <Button
              title={soldOut ? 'Sold out' : orderable ? 'Add to bag' : 'Not available for pickup'}
              disabled={soldOut || !orderable}
              onPress={onAdd}
            />
          )}
        </StickyFooter>
      }
    >
      <View>
        <FlatList
          data={product.images}
          horizontal
          pagingEnabled
          keyExtractor={u => u}
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={e =>
            setPage(Math.round(e.nativeEvent.contentOffset.x / width))
          }
          renderItem={({ item }) => (
            <SmartImage
              uri={item}
              label={product.title}
              style={{ width, height: imageHeight }}
            />
          )}
        />
        <HeartButton productId={product.id} />
      </View>
      {product.images.length > 1 && (
        <View style={styles.dots}>
          {product.images.map((u, i) => (
            <View key={u} style={[styles.dot, i === page && styles.dotOn]} />
          ))}
        </View>
      )}
      <View style={styles.body}>
        {!!product.tag && (
          <Text style={styles.tag}>{product.tag.toUpperCase()}</Text>
        )}
        <Text style={styles.title}>{product.title}</Text>
        <Price product={product} large />

        <Text style={styles.label}>COLOUR — {color.toUpperCase()}</Text>
        <View style={styles.row}>
          {product.colors.map(c => (
            <Pressable
              key={c.name}
              onPress={() => {
                setColor(c.name);
                setMsg(null);
              }}
              accessibilityRole="button"
              accessibilityLabel={c.name}
              accessibilityState={{ selected: color === c.name }}
              style={[styles.swatchWrap, color === c.name && styles.swatchOn]}
            >
              <View style={[styles.swatch, { backgroundColor: c.hex }]} />
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>SIZE</Text>
        <View style={styles.row}>
          {product.sizes.map(z => (
            <Chip
              key={z}
              label={z}
              selected={size === z}
              disabled={stockFor(product, color, z) === 0}
              onPress={() => {
                setSize(z);
                setMsg(null);
              }}
            />
          ))}
        </View>
        <Text
          style={[
            styles.avail,
            left === null && !soldOut && styles.availIdle,
            (soldOut || left === 0) && styles.availBad,
            !!left && left <= 3 && styles.availLow,
          ]}
        >
          {availability}
        </Text>

        <View style={styles.box}>
          <Text style={styles.boxTitle}>Store pickup</Text>
          <Text style={styles.boxText}>
            {product.pickupAvailable
              ? `Available at ${PICKUP_STORE.name}, ${PICKUP_STORE.address}.`
              : 'Not available for this item. Orders are store pickup only for now, so it cannot be ordered yet. Save it to your wishlist.'}
          </Text>
        </View>

        <Text style={styles.label}>DESCRIPTION</Text>
        <Text style={styles.desc}>{product.description}</Text>
        {product.details.map(d => (
          <Text key={d} style={styles.desc}>
            • {d}
          </Text>
        ))}
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  heart: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartIcon: { fontSize: 24, color: colors.text },
  heartOn: { color: colors.error },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
  },
  availIdle: { color: colors.textSecondary },
  availBad: { color: colors.error },
  availLow: { color: colors.warning },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border },
  dotOn: { backgroundColor: colors.primary },
  body: { padding: 16 },
  tag: { ...typography.label, color: colors.accent, marginBottom: 4 },
  title: { ...typography.h1, marginBottom: 6 },
  label: {
    ...typography.label,
    color: colors.textSecondary,
    marginTop: 22,
    marginBottom: 10,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  swatchWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchOn: { borderColor: colors.primary },
  swatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avail: { ...typography.caption, color: colors.success, marginTop: 10 },
  box: {
    marginTop: 22,
    padding: 14,
    backgroundColor: colors.surface,
    borderRadius: 8,
  },
  boxTitle: { ...typography.h3 },
  boxText: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  desc: { ...typography.body, color: colors.text, marginBottom: 4 },
  msg: { ...typography.caption, textAlign: 'center', marginBottom: 8 },
});

export default ProductDetailsScreen;
