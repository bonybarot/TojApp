import React, { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { Screen, StickyFooter } from '../../components/Screen';
import { SmartImage } from '../../components/SmartImage';
import { DemoBanner, EmptyState } from '../../components/States';
import { ApiError, uuid } from '../../api/client';
import { useRootNavigation } from '../../hooks';
import { useCartStore } from '../../store/cartStore';
import { useOrderStore } from '../../store/orderStore';
import { useProductStore } from '../../store/productStore';
import { detailLines, pickupBlockers, subtotalOf } from '../../utils/cart';
import { formatPrice } from '../../utils/format';
import { borderRadius, colors, typography, FONT_CAP } from '../../utils/theme';

const Option: React.FC<{ title: string; sub?: string; selected: boolean; disabled?: boolean; onPress: () => void }> = ({ title, sub, selected, disabled, onPress }) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    accessibilityRole="radio"
    accessibilityState={{ selected, disabled: !!disabled }}
    style={[styles.opt, selected && styles.optOn, disabled && styles.optOff]}
  >
    <View style={[styles.radio, selected && styles.radioOn]} />
    <View style={styles.optText}>
      <Text style={typography.h3}>{title}</Text>
      {!!sub && <Text style={styles.sub}>{sub}</Text>}
    </View>
  </Pressable>
);

/** Order rejected because the bag no longer matches the server's stock, prices or availability. */
const STALE_BAG = ['INSUFFICIENT_STOCK', 'PRICE_CHANGED', 'VARIANT_UNAVAILABLE', 'PICKUP_NOT_AVAILABLE', 'CART_EMPTY'];

const CheckoutScreen: React.FC = () => {
  const nav = useRootNavigation();
  const lines = useCartStore(s => s.lines);
  const pickup = useProductStore(s => s.pickup);
  const [card, setCard] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // One key per checkout visit and payment choice: a retried tap after a timeout cannot create a second
  // order, and a switch to the other payment cannot replay the first one (it gets CART_EMPTY instead).
  const keys = useRef({ store: uuid(), card: uuid() }).current;

  const detailed = detailLines(lines);
  const subtotal = subtotalOf(detailed);
  const blockers = pickupBlockers(detailed);

  if (detailed.length === 0 && !placing) {
    return (
      <Screen>
        <EmptyState title="Your bag is empty" actionLabel="Back to shop" onAction={() => nav.navigate('Tabs', { screen: 'Shop' })} />
      </Screen>
    );
  }

  const place = async () => {
    setError(null);
    if (blockers.length) {
      setError(`Store pickup is not available for: ${blockers.map(b => b.product.title).join(', ')}. Remove them to continue.`);
      return;
    }
    if (detailed.some(d => d.maxQuantity < d.line.quantity)) {
      setError('Some items in your bag are no longer available in the requested quantity.');
      // Catalogue stock may be stale (restock, own cancel): refetch so the next tap judges fresh stock.
      useProductStore.getState().loadProducts();
      return;
    }
    setPlacing(true);
    try {
      await useCartStore.getState().settled();
      const id = await useOrderStore.getState().placeOrder({
        pickupLocationId: pickup.id,
        paymentMethod: card ? 'CARD_SIMULATED' : 'PAY_AT_STORE',
        idempotencyKey: card ? keys.card : keys.store,
        expectedTotal: subtotal,
      });
      useCartStore.getState().clearCart();
      // The order took stock: refresh it so product pages do not offer what was just bought.
      useProductStore.getState().loadProducts();
      nav.reset({ index: 1, routes: [{ name: 'Tabs' }, { name: 'OrderConfirmation', params: { orderId: id } }] });
    } catch (e) {
      if (e instanceof ApiError && STALE_BAG.includes(e.code)) {
        // Catalogue is loaded once per launch; fetch fresh stock and prices, then the clamped cart.
        await Promise.all([useProductStore.getState().loadProducts(), useCartStore.getState().refresh()]).catch(() => {});
        // CART_EMPTY with lines still showing: the sign-in merge has not reached the server yet.
        setError(
          e.code === 'CART_EMPTY' && useCartStore.getState().lines.length
            ? 'Your bag has not synced to your account yet. Check your connection and try again.'
            : `${e.message}. Your bag has been updated, please review it and place the order again.`,
        );
      } else if (e instanceof ApiError && e.code === 'NETWORK') {
        setError('We could not confirm your order. Tap Place order again (it will not be placed twice), or check My Orders.');
      } else {
        setError((e as Error).message);
      }
      setPlacing(false);
    }
  };

  return (
    <Screen
      scroll
      footer={
        <StickyFooter>
          {!!error && <Text style={styles.error} accessibilityRole="alert">{error}</Text>}
          <Button title={`Place demo order · ${formatPrice(subtotal)}`} onPress={place} loading={placing} />
        </StickyFooter>
      }
    >
      <View style={styles.body}>
        <Text style={styles.h} maxFontSizeMultiplier={FONT_CAP}>PICKUP LOCATION</Text>
        <View style={styles.card}>
          <Text style={typography.h3}>{pickup.name}</Text>
          <Text style={styles.sub}>{pickup.address}</Text>
          <Text style={styles.sub}>{pickup.hours}</Text>
        </View>
        {blockers.length > 0 && (
          <Text style={styles.error}>Not available for pickup: {blockers.map(b => b.product.title).join(', ')}</Text>
        )}

        <Text style={styles.h} maxFontSizeMultiplier={FONT_CAP}>PAYMENT</Text>
        <Option title="Pay at store" selected={!card} onPress={() => setCard(false)} />
        <Option title="Card" sub="Simulated — no card details are collected or charged" selected={card} onPress={() => setCard(true)} />

        <Text style={styles.h} maxFontSizeMultiplier={FONT_CAP}>ORDER SUMMARY</Text>
        {detailed.map(d => (
          <View key={d.line.lineId} style={styles.item}>
            <SmartImage uri={d.product.image} label={d.product.title} style={styles.thumb} />
            <View style={styles.itemText}>
              <Text style={typography.body} numberOfLines={1}>{d.product.title}</Text>
              <Text style={styles.sub}>{d.line.color} · {d.line.size} · Qty {d.line.quantity}</Text>
            </View>
            <Text style={typography.body} maxFontSizeMultiplier={FONT_CAP}>{formatPrice(d.lineTotal)}</Text>
          </View>
        ))}
        <View style={styles.sumRow}><Text style={styles.sub}>Subtotal</Text><Text style={typography.body}>{formatPrice(subtotal)}</Text></View>
        <View style={styles.sumRow}><Text style={styles.sub}>Pickup</Text><Text style={typography.body}>Free</Text></View>
        <View style={styles.sumRow}><Text style={typography.h2} maxFontSizeMultiplier={FONT_CAP}>Total</Text><Text style={typography.h2} maxFontSizeMultiplier={FONT_CAP}>{formatPrice(subtotal)}</Text></View>

        <View style={styles.banner}>
          <DemoBanner text="Demo checkout: no payment is taken. The order is saved on the local demo server only." />
        </View>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  optOff: { opacity: 0.5 },
  optText: { flex: 1 },
  itemText: { flex: 1, marginLeft: 12 },
  banner: { marginTop: 16 },
  body: { padding: 16 },
  h: { ...typography.label, color: colors.textSecondary, marginTop: 22, marginBottom: 10 },
  opt: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, padding: 14, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, marginBottom: 8 },
  optOn: { borderColor: colors.primary },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.disabled },
  radioOn: { borderColor: colors.primary, backgroundColor: colors.primary },
  sub: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  card: { padding: 14, backgroundColor: colors.surface, borderRadius: borderRadius.md },
  item: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  thumb: { width: 52, height: 64, borderRadius: 6 },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  error: { ...typography.caption, color: colors.error, textAlign: 'center', marginBottom: 8 },
});

export default CheckoutScreen;
