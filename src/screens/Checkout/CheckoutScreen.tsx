import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { Screen, StickyFooter } from '../../components/Screen';
import { SmartImage } from '../../components/SmartImage';
import { DemoBanner, EmptyState } from '../../components/States';
import { PICKUP_STORE } from '../../data/stores';
import { useRootNavigation } from '../../hooks';
import { useAddressStore } from '../../store/addressStore';
import { useCartStore } from '../../store/cartStore';
import { useOrderStore } from '../../store/orderStore';
import { deliveryFeeFor, detailLines, pickupBlockers, subtotalOf } from '../../utils/cart';
import { formatPrice } from '../../utils/format';
import { borderRadius, colors, typography } from '../../utils/theme';
import { FulfilmentMethod } from '../../types';

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

const CheckoutScreen: React.FC = () => {
  const nav = useRootNavigation();
  const lines = useCartStore(s => s.lines);
  const addresses = useAddressStore(s => s.addresses);
  const selectedId = useAddressStore(s => s.selectedId);
  const [method, setMethod] = useState<FulfilmentMethod>('delivery');
  const [card, setCard] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detailed = detailLines(lines);
  const subtotal = subtotalOf(detailed);
  const blockers = pickupBlockers(detailed);
  const pickupOk = blockers.length === 0;
  const fulfilment: FulfilmentMethod = method === 'pickup' && !pickupOk ? 'delivery' : method;
  const fee = deliveryFeeFor(subtotal, fulfilment);
  const address = addresses.find(a => a.id === selectedId);
  const payment = card ? 'Card (simulated)' : fulfilment === 'pickup' ? 'Pay at store' : 'Cash on delivery';

  if (detailed.length === 0 && !placing) {
    return (
      <Screen>
        <EmptyState title="Your bag is empty" actionLabel="Back to shop" onAction={() => nav.navigate('Tabs', { screen: 'Shop' })} />
      </Screen>
    );
  }

  const place = async () => {
    setError(null);
    if (fulfilment === 'delivery' && !address) {
      setError('Add a delivery address to continue.');
      return;
    }
    if (detailed.some(d => d.maxQuantity < d.line.quantity)) {
      setError('Some items in your bag are no longer available in the requested quantity.');
      return;
    }
    setPlacing(true);
    await new Promise<void>(r => setTimeout(r, 1200));
    const id = useOrderStore.getState().placeOrder({
      items: detailed.map(d => ({
        productId: d.product.id,
        title: d.product.title,
        image: d.product.image,
        color: d.line.color,
        size: d.line.size,
        quantity: d.line.quantity,
        unitPrice: d.product.price,
      })),
      subtotal,
      deliveryFee: fee,
      total: subtotal + fee,
      fulfilment,
      address: fulfilment === 'delivery' ? address : undefined,
      pickupStore: fulfilment === 'pickup' ? PICKUP_STORE.name : undefined,
      paymentMethod: payment,
    });
    useCartStore.getState().clearCart();
    nav.reset({ index: 1, routes: [{ name: 'Tabs' }, { name: 'OrderConfirmation', params: { orderId: id } }] });
  };

  return (
    <Screen
      scroll
      footer={
        <StickyFooter>
          {!!error && <Text style={styles.error} accessibilityRole="alert">{error}</Text>}
          <Button title={`Place demo order · ${formatPrice(subtotal + fee)}`} onPress={place} loading={placing} />
        </StickyFooter>
      }
    >
      <View style={styles.body}>
        <Text style={styles.h}>FULFILMENT</Text>
        <Option title="Delivery" sub={fee === 0 ? 'Free' : formatPrice(fee)} selected={fulfilment === 'delivery'} onPress={() => setMethod('delivery')} />
        <Option
          title="Store pickup"
          sub={pickupOk ? `Free · ${PICKUP_STORE.name}` : `Not available for: ${blockers.map(b => b.product.title).join(', ')}`}
          selected={fulfilment === 'pickup'}
          disabled={!pickupOk}
          onPress={() => setMethod('pickup')}
        />

        <Text style={styles.h}>{fulfilment === 'pickup' ? 'PICKUP LOCATION' : 'DELIVERY ADDRESS'}</Text>
        {fulfilment === 'pickup' ? (
          <View style={styles.card}>
            <Text style={typography.h3}>{PICKUP_STORE.name}</Text>
            <Text style={styles.sub}>{PICKUP_STORE.address}</Text>
            <Text style={styles.sub}>{PICKUP_STORE.hours}</Text>
          </View>
        ) : (
          <View style={styles.card}>
            {address ? (
              <>
                <Text style={typography.h3}>{address.label} · {address.fullName}</Text>
                <Text style={styles.sub}>{address.line1}{address.line2 ? `, ${address.line2}` : ''}</Text>
                <Text style={styles.sub}>{address.city} {address.postalCode} · {address.phone}</Text>
              </>
            ) : (
              <Text style={styles.sub}>No address saved yet.</Text>
            )}
            <Pressable onPress={() => nav.navigate('Addresses', { selecting: true })} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.linkBtn} accessibilityRole="button">
              <Text style={styles.link}>{address ? 'Change address' : 'Add address'}</Text>
            </Pressable>
          </View>
        )}

        <Text style={styles.h}>PAYMENT</Text>
        <Option title={fulfilment === 'pickup' ? 'Pay at store' : 'Cash on delivery'} selected={!card} onPress={() => setCard(false)} />
        <Option title="Card" sub="Simulated — no card details are collected or charged" selected={card} onPress={() => setCard(true)} />

        <Text style={styles.h}>ORDER SUMMARY</Text>
        {detailed.map(d => (
          <View key={d.line.lineId} style={styles.item}>
            <SmartImage uri={d.product.image} label={d.product.title} style={styles.thumb} />
            <View style={styles.itemText}>
              <Text style={typography.body} numberOfLines={1}>{d.product.title}</Text>
              <Text style={styles.sub}>{d.line.color} · {d.line.size} · Qty {d.line.quantity}</Text>
            </View>
            <Text style={typography.body}>{formatPrice(d.lineTotal)}</Text>
          </View>
        ))}
        <View style={styles.sumRow}><Text style={styles.sub}>Subtotal</Text><Text style={typography.body}>{formatPrice(subtotal)}</Text></View>
        <View style={styles.sumRow}><Text style={styles.sub}>{fulfilment === 'pickup' ? 'Pickup' : 'Delivery'}</Text><Text style={typography.body}>{fee === 0 ? 'Free' : formatPrice(fee)}</Text></View>
        <View style={styles.sumRow}><Text style={typography.h2}>Total</Text><Text style={typography.h2}>{formatPrice(subtotal + fee)}</Text></View>

        <View style={styles.banner}>
          <DemoBanner text="Demo checkout: no payment is taken and no real order is sent to a store." />
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
  linkBtn: { minHeight: 44, justifyContent: 'center', marginTop: 4 },
  link: { ...typography.caption, color: colors.text, textDecorationLine: 'underline' },
  item: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  thumb: { width: 52, height: 64, borderRadius: 6 },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  error: { ...typography.caption, color: colors.error, textAlign: 'center', marginBottom: 8 },
});

export default CheckoutScreen;
