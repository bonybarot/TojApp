import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/Button';
import { QuantityStepper } from '../../components/QuantityStepper';
import { SmartImage } from '../../components/SmartImage';
import { EmptyState, ErrorState, LoadingState } from '../../components/States';
import { usePull, useRootNavigation } from '../../hooks';
import { useCartStore } from '../../store/cartStore';
import { reloadProducts, useProductStore } from '../../store/productStore';
import { useUserStore } from '../../store/userStore';
import { detailLines, pickupBlockers, subtotalOf } from '../../utils/cart';
import { formatPrice } from '../../utils/format';
import { colors, typography, FONT_CAP } from '../../utils/theme';

// Pull: fresh prices and stock; signed in, the server bag too.
const reloadBag = () =>
  Promise.all([reloadProducts(), useUserStore.getState().isLoggedIn && useCartStore.getState().refresh()]);

const CartScreen: React.FC = () => {
  const nav = useRootNavigation();
  const lines = useCartStore(s => s.lines);
  const notice = useCartStore(s => s.notice);
  const { setQuantity, removeLine } = useCartStore.getState();
  const isLoggedIn = useUserStore(s => s.isLoggedIn);
  const pull = usePull(reloadBag);
  // Signed in: server cart is the truth; re-adopt it on focus so a change that failed offline does not linger.
  useFocusEffect(
    useCallback(() => {
      if (isLoggedIn) {
        useCartStore.getState().refresh().catch(() => {});
      }
      // Seen once is enough.
      return () => useCartStore.setState({ notice: null });
    }, [isLoggedIn]),
  );
  // Subscribed so the bag re-renders when the catalogue arrives (detailLines reads it once).
  const products = useProductStore(s => s.products);
  const status = useProductStore(s => s.status);
  const detailed = detailLines(lines);
  const subtotal = subtotalOf(detailed);
  const noPickup = pickupBlockers(detailed).length > 0;
  // Guest bag: lines are not re-checked by the server until sign-in.
  const soldOut = detailed.some(d => d.maxQuantity === 0);
  const blocked = noPickup || soldOut;

  const confirmRemove = (id: string, title: string) =>
    Alert.alert('Remove item', `Remove ${title} from your bag?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeLine(id) },
    ]);

  const checkout = () =>
    isLoggedIn ? nav.navigate('Checkout') : nav.navigate('Login', { redirect: 'Checkout' });

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <Text style={styles.title} maxFontSizeMultiplier={FONT_CAP} accessibilityRole="header">Bag</Text>
      {notice && <Text style={styles.notice} accessibilityRole="alert">{notice}</Text>}
      {lines.length > 0 && products.length === 0 ? (
        status === 'error' ? <ErrorState onRetry={useProductStore.getState().loadProducts} /> : <LoadingState />
      ) : detailed.length === 0 ? (
        <EmptyState
          title="Your bag is empty"
          message="Add something you love and it will show up here."
          actionLabel="Start shopping"
          onAction={() => nav.navigate('Tabs', { screen: 'Shop' })}
        />
      ) : (
        <>
          <FlatList
            data={detailed}
            keyExtractor={d => d.line.lineId}
            {...pull}
            contentContainerStyle={styles.list}
            renderItem={({ item: d }) => (
              <View style={styles.line}>
                <Pressable onPress={() => nav.navigate('ProductDetails', { productId: d.product.id })} accessibilityRole="link" accessibilityLabel={`View ${d.product.title}`}>
                  <SmartImage uri={d.product.image} label={d.product.title} style={styles.img} />
                </Pressable>
                <View style={styles.info}>
                  <Text style={styles.name} numberOfLines={2}>{d.product.title}</Text>
                  <Text style={styles.meta}>{d.line.color} · {d.line.size}</Text>
                  <Text style={styles.price} maxFontSizeMultiplier={FONT_CAP}>{formatPrice(d.lineTotal)}</Text>
                  <View style={styles.actions}>
                    <QuantityStepper
                      value={d.line.quantity}
                      max={d.maxQuantity}
                      onStep={delta => {
                        const now = useCartStore.getState().lines.find(l => l.lineId === d.line.lineId)?.quantity ?? 0;
                        return now + delta <= 0 ? confirmRemove(d.line.lineId, d.product.title) : setQuantity(d.line.lineId, now + delta);
                      }}
                    />
                    <Pressable onPress={() => confirmRemove(d.line.lineId, d.product.title)} hitSlop={10} accessibilityRole="button" accessibilityLabel={`Remove ${d.product.title}`}>
                      <Text style={styles.remove}>Remove</Text>
                    </Pressable>
                  </View>
                  {d.maxQuantity === 0 ? (
                    <Text style={styles.blocked}>Sold out</Text>
                  ) : (
                    d.line.quantity >= d.maxQuantity && <Text style={styles.limit}>Max available quantity</Text>
                  )}
                  {!d.product.pickupAvailable && <Text style={styles.blocked}>Not available for store pickup</Text>}
                </View>
              </View>
            )}
          />
          <View style={styles.summary}>
            <View style={styles.row}><Text style={styles.sumText}>Subtotal</Text><Text style={styles.sumText}>{formatPrice(subtotal)}</Text></View>
            <View style={styles.row}>
              <Text style={styles.sumText}>Store pickup</Text>
              <Text style={styles.sumText}>Free</Text>
            </View>
            <View style={[styles.row, styles.totalRow]}><Text style={styles.total} maxFontSizeMultiplier={FONT_CAP}>Total</Text><Text style={styles.total} maxFontSizeMultiplier={FONT_CAP}>{formatPrice(subtotal)}</Text></View>
            {noPickup && (
              <Text style={styles.blocked} accessibilityRole="alert">
                Orders are store pickup only. Remove items not available for pickup to check out.
              </Text>
            )}
            {soldOut && (
              <Text style={styles.blocked} accessibilityRole="alert">Remove sold-out items to check out.</Text>
            )}
            <Button title={isLoggedIn ? 'Checkout' : 'Sign in to checkout'} onPress={checkout} disabled={blocked} style={styles.checkout} />
          </View>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  list: { padding: 16 },
  totalRow: { marginTop: 6 },
  checkout: { marginTop: 12 },
  root: { flex: 1, backgroundColor: colors.background },
  title: { ...typography.h1, paddingHorizontal: 16, paddingTop: 8 },
  line: { flexDirection: 'row', marginBottom: 18 },
  img: { width: 92, height: 120, borderRadius: 8 },
  info: { flex: 1, marginLeft: 14 },
  name: { ...typography.h3 },
  meta: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  price: { ...typography.body, marginTop: 4 },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  remove: { ...typography.caption, color: colors.textSecondary, textDecorationLine: 'underline' },
  notice: { ...typography.caption, color: colors.warning, paddingHorizontal: 16, paddingTop: 6 },
  limit: { ...typography.caption, color: colors.warning, marginTop: 4 },
  blocked: { ...typography.caption, color: colors.error, marginTop: 4 },
  summary: { padding: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  sumText: { ...typography.body, color: colors.textSecondary },
  total: { ...typography.h2 },
});

export default CartScreen;
