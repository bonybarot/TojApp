import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { ProductReviews, productReviews, stars } from '../../api/reviews';
import { Button } from '../../components/Button';
import { Chip } from '../../components/Chip';
import { Price } from '../../components/Price';
import { Screen, StickyFooter } from '../../components/Screen';
import { SmartImage } from '../../components/SmartImage';
import { EmptyState, ErrorState, LoadingState } from '../../components/States';
import { RootStackParamList } from '../../navigation/types';
import { Rating } from '../../types';
import { useCartStore } from '../../store/cartStore';
import { formatDate } from '../../utils/format';
import { useProductStore } from '../../store/productStore';
import { useWishlistStore } from '../../store/wishlistStore';
import { isSoldOut, stockFor } from '../../utils/catalogue';
import { colors, typography, FONT_CAP } from '../../utils/theme';

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
      <Text allowFontScaling={false} style={[styles.heartIcon, liked && styles.heartOn]}>
        {liked ? '♥' : '♡'}
      </Text>
    </Pressable>
  );
};

/** ADR-0028. Read-only here; customers write from a collected order. */
const plural = (n: number) => `${n} ${n === 1 ? 'review' : 'reviews'}`;
const Summary: React.FC<{ r: Rating }> = ({ r }) => (
  <Text style={styles.rSummary} maxFontSizeMultiplier={FONT_CAP} accessibilityLabel={`Rated ${r.average} out of 5 from ${plural(r.count)}`}>
    <Text style={styles.rStars} maxFontSizeMultiplier={FONT_CAP}>{stars(r.average)}</Text>  {r.average.toFixed(1)} · {plural(r.count)}
  </Text>
);

const Reviews: React.FC<{ r: ProductReviews | null }> = ({ r }) => {
  if (!r) {
    return null;
  }
  return (
    <>
      <Text style={styles.label} maxFontSizeMultiplier={FONT_CAP}>REVIEWS</Text>
      {r.average === null ? (
        <Text style={styles.boxText}>No reviews yet. Customers who collect this item can review it from My Orders.</Text>
      ) : (
        <Summary r={{ ...r, average: r.average }} />
      )}
      {r.items.map(x => (
        <View key={x.id} style={styles.review} accessible accessibilityLabel={`${x.rating} out of 5 by ${x.author}. ${x.body}`}>
          <Text style={styles.rStars} maxFontSizeMultiplier={FONT_CAP}>{stars(x.rating)}</Text>
          {!!x.body && <Text style={styles.desc}>{x.body}</Text>}
          <Text style={styles.boxText}>{x.author} · {formatDate(x.createdAt)} · Verified purchase</Text>
        </View>
      ))}
    </>
  );
};

const ProductDetailsScreen: React.FC<Props> = ({ route, navigation }) => {
  const product = useProductStore(s =>
    s.products.find(p => p.id === route.params.productId),
  );
  const addToCart = useCartStore(s => s.addToCart);
  const pickup = useProductStore(s => s.pickup);
  const status = useProductStore(s => s.status);
  const { width, height } = useWindowDimensions();
  // Square on tall phones; capped on short screens so title, price and sizes show above the fold.
  const imageHeight = Math.min(width, height * 0.45);
  const [color, setColor] = useState<string>('');
  const [size, setSize] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [added, setAdded] = useState(false);
  const [reviews, setReviews] = useState<ProductReviews | null>(null);
  useEffect(() => {
    productReviews(route.params.productId).then(setReviews, () => setReviews(null));
  }, [route.params.productId]);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // The size row can sit below the fold; scroll to it when the customer must pick one.
  const scrollRef = useRef<ScrollView>(null);
  const bodyY = useRef(0);
  const sizeY = useRef(0);

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

  // Fresh reviews win (a review written this session); the catalogue figure shows until they load.
  const rating: Rating | null | undefined = reviews
    ? reviews.average === null ? null : { average: reviews.average, count: reviews.count }
    : product?.rating;

  // Catalogue still loading or failed (cold start offline, deep in My Orders): not a missing product.
  if (!product && status !== 'ready') {
    return <Screen>{status === 'error' ? <ErrorState onRetry={useProductStore.getState().loadProducts} /> : <LoadingState />}</Screen>;
  }
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
      scrollRef.current?.scrollTo({ y: Math.max(0, bodyY.current + sizeY.current - 120) });
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
    if (timer.current) { clearTimeout(timer.current); }
    timer.current = setTimeout(() => setAdded(false), 1800);
  };

  return (
    <Screen
      scroll
      scrollRef={scrollRef}
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
      <View style={styles.body} onLayout={e => { bodyY.current = e.nativeEvent.layout.y; }}>
        {!!product.tag && (
          <Text style={styles.tag}>{product.tag.toUpperCase()}</Text>
        )}
        <Text style={styles.title} maxFontSizeMultiplier={FONT_CAP}>{product.title}</Text>
        <Price product={product} large />
        {!!rating && <Summary r={rating} />}

        <Text style={styles.label} maxFontSizeMultiplier={FONT_CAP}>COLOUR — {color.toUpperCase()}</Text>
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

        <Text style={styles.label} maxFontSizeMultiplier={FONT_CAP} onLayout={e => { sizeY.current = e.nativeEvent.layout.y; }}>SIZE</Text>
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
          <Text style={styles.boxTitle} maxFontSizeMultiplier={FONT_CAP}>Store pickup</Text>
          <Text style={styles.boxText}>
            {product.pickupAvailable
              ? `Available at ${pickup.name}, ${pickup.address}.`
              : 'Not available for this item. Orders are store pickup only for now, so it cannot be ordered yet. Save it to your wishlist.'}
          </Text>
        </View>

        <Text style={styles.label} maxFontSizeMultiplier={FONT_CAP}>DESCRIPTION</Text>
        <Text style={styles.desc}>{product.description}</Text>
        {product.details.map(d => (
          <Text key={d} style={styles.desc}>
            • {d}
          </Text>
        ))}
        <Reviews r={reviews} />
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
  rSummary: { ...typography.body, marginBottom: 8 },
  rStars: { color: colors.warning, fontSize: 16 },
  review: { paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
});

export default ProductDetailsScreen;
