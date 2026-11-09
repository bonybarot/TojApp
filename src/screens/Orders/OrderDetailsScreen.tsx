import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { myReviews } from '../../api/reviews';
import { Button } from '../../components/Button';
import { usePull } from '../../hooks';
import { Screen } from '../../components/Screen';
import { SmartImage } from '../../components/SmartImage';
import { EmptyState, ErrorState, LoadingState } from '../../components/States';
import { RootStackParamList } from '../../navigation/types';
import { CANCELLABLE, useOrderStore } from '../../store/orderStore';
import { useProductStore } from '../../store/productStore';
import { formatDate, formatDateTime, formatPrice } from '../../utils/format';
import { PAYMENT_LABEL, STATUS_COLOR, STATUS_LABEL, timelineFor } from '../../utils/orderStatus';
import { colors, typography, FONT_CAP, LINK_SLOP } from '../../utils/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'OrderDetails'>;

const OrderDetailsScreen: React.FC<Props> = ({ route, navigation }) => {
  const order = useOrderStore(s => s.orders.find(o => o.id === route.params.orderId));
  const cancel = useOrderStore(s => s.cancelOrder);
  const pickup = useProductStore(s => s.pickup);
  const id = route.params.orderId;
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [cancelling, setCancelling] = useState(false);
  // Not in the store yet (list still loading or failed): fetch it before saying "not found".
  const [fetched, setFetched] = useState<'loading' | 'error' | 'done'>('loading');
  const fetchOne = useCallback(
    () =>
      useOrderStore.getState().refreshOne(id).then(
        () => setFetched('done'),
        (e: { status?: number }) => setFetched(e.status === 404 ? 'done' : 'error'),
      ),
    [id],
  );
  const collected = order?.status === 'COLLECTED';
  const pull = usePull(useCallback(() => useOrderStore.getState().refreshOne(id), [id]));
  useFocusEffect(
    useCallback(() => {
      fetchOne();
      if (collected) {
        myReviews().then(l => setReviewed(l.map(r => r.productId)), () => {});
      }
    }, [fetchOne, collected]),
  );
  if (!order && fetched !== 'done') {
    return <Screen>{fetched === 'error' ? <ErrorState onRetry={() => { setFetched('loading'); fetchOne(); }} /> : <LoadingState />}</Screen>;
  }
  if (!order) {
    return <Screen><EmptyState title="Order not found" actionLabel="My orders" onAction={() => navigation.navigate('OrderHistory')} /></Screen>;
  }
  const cancelled = order.status === 'CANCELLED';
  const steps = timelineFor(order.fulfilment);
  const step = steps.indexOf(order.status);
  // Latest time each status was reached (older servers send no timeline).
  const at = (s: string) => order.timeline?.filter(t => t.status === s).pop()?.at;
  const cancelledAt = at('CANCELLED');
  const paid =
    order.paymentStatus === 'PAID' ? 'Paid' : order.paymentStatus === 'REFUNDED' ? 'Refunded' : cancelled ? null : 'Due at pickup';
  const confirmCancel = () =>
    Alert.alert('Cancel order', `Cancel ${order.id}?`, [
      { text: 'Keep order', style: 'cancel' },
      { text: 'Cancel order', style: 'destructive', onPress: () => {
        setCancelling(true);
        cancel(order.id)
          // The cancel restocked its units: refresh so product pages offer them again.
          .then(() => { useProductStore.getState().loadProducts(); })
          .catch((e: Error) => Alert.alert('Could not cancel', e.message)).finally(() => setCancelling(false));
      } },
    ]);

  return (
    <Screen scroll padded pull={pull}>
      <Text style={typography.h1} maxFontSizeMultiplier={FONT_CAP}>{order.id}</Text>
      <Text maxFontSizeMultiplier={FONT_CAP} style={[styles.status, { color: STATUS_COLOR[order.status] }]}>{STATUS_LABEL[order.status].toUpperCase()}</Text>
      <Text style={styles.sub}>Placed {formatDate(order.placedAt)}</Text>
      {cancelled && (
        <Text style={styles.sub}>
          Cancelled{cancelledAt ? ` ${formatDateTime(cancelledAt)}` : ''}{order.cancelReason ? `: ${order.cancelReason}` : ''}
        </Text>
      )}

      {!cancelled && (
        <View style={styles.timeline}>
          {steps.map((s, i) => (
            <View key={s} style={styles.tRow}>
              <View style={[styles.dot, i <= step && styles.dotOn]} />
              <Text style={[styles.tText, i <= step && styles.tTextOn]}>{STATUS_LABEL[s]}</Text>
              {i <= step && at(s) && <Text style={styles.tTime}>{formatDateTime(at(s)!)}</Text>}
            </View>
          ))}
        </View>
      )}

      <Text style={styles.h} maxFontSizeMultiplier={FONT_CAP}>ITEMS</Text>
      {order.items.map((i, n) => (
        <View key={`${i.productId}${i.color}${i.size}`} style={styles.item}>
          <Pressable
            onPress={() => navigation.navigate('ProductDetails', { productId: i.productId })}
            accessibilityRole="link"
            accessibilityLabel={`View ${i.title}`}
          >
            <SmartImage uri={i.image} label={i.title} style={styles.thumb} />
          </Pressable>
          <View style={styles.itemText}>
            <Text style={typography.body} accessibilityRole="link" onPress={() => navigation.navigate('ProductDetails', { productId: i.productId })}>{i.title}</Text>
            <Text style={styles.sub}>{i.color} · {i.size} · Qty {i.quantity}</Text>
            {collected && order.items.findIndex(x => x.productId === i.productId) === n && (
              <Pressable
                onPress={() => navigation.navigate('WriteReview', { productId: i.productId, title: i.title })}
                hitSlop={LINK_SLOP}
                accessibilityRole="button"
                accessibilityLabel={`${reviewed.includes(i.productId) ? 'Edit your review of' : 'Write a review of'} ${i.title}`}
              >
                <Text style={styles.review}>{reviewed.includes(i.productId) ? 'Edit your review' : 'Write a review'}</Text>
              </Pressable>
            )}
          </View>
          <Text style={typography.body} maxFontSizeMultiplier={FONT_CAP}>{formatPrice(i.unitPrice * i.quantity)}</Text>
        </View>
      ))}

      <Text style={styles.h} maxFontSizeMultiplier={FONT_CAP}>{order.fulfilment === 'pickup' ? 'PICKUP' : 'DELIVERY ADDRESS'}</Text>
      {order.fulfilment === 'pickup' ? (
        <>
          <Text style={typography.body}>{order.pickupStore}</Text>
          {!cancelled && pickup.id === order.pickupLocationId && <Text style={styles.sub}>{pickup.address}{'\n'}{pickup.hours}</Text>}
        </>
      ) : order.address ? (
        <Text style={typography.body}>
          {order.address.fullName}{'\n'}{order.address.line1}{order.address.line2 ? `, ${order.address.line2}` : ''}{'\n'}{order.address.city} {order.address.postalCode}
        </Text>
      ) : null}

      <Text style={styles.h} maxFontSizeMultiplier={FONT_CAP}>PAYMENT</Text>
      <Text style={typography.body}>{PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod}{paid ? ` · ${paid}` : ''}</Text>

      <View style={styles.totals}>
        <View style={styles.row}><Text style={styles.sub}>Subtotal</Text><Text style={typography.body}>{formatPrice(order.subtotal)}</Text></View>
        <View style={styles.row}><Text style={styles.sub}>{order.fulfilment === 'pickup' ? 'Pickup' : 'Delivery'}</Text><Text style={typography.body}>{order.deliveryFee ? formatPrice(order.deliveryFee) : 'Free'}</Text></View>
        <View style={styles.row}><Text style={typography.h2} maxFontSizeMultiplier={FONT_CAP}>Total</Text><Text style={typography.h2} maxFontSizeMultiplier={FONT_CAP}>{formatPrice(order.total)}</Text></View>
      </View>

      {CANCELLABLE.includes(order.status) && (
        <Button title="Cancel order" variant="secondary" onPress={confirmCancel} loading={cancelling} style={styles.cancel} />
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  tTextOn: { color: colors.text, fontWeight: '600' },
  itemText: { flex: 1, marginLeft: 12 },
  review: { ...typography.caption, color: colors.primary, fontWeight: '600', marginTop: 6, textDecorationLine: 'underline' },
  cancel: { marginTop: 20 },
  status: { ...typography.label, marginTop: 4 },
  sub: { ...typography.caption, color: colors.textSecondary },
  h: { ...typography.label, color: colors.textSecondary, marginTop: 24, marginBottom: 10 },
  timeline: { marginTop: 20, paddingLeft: 4 },
  tRow: { flexDirection: 'row', alignItems: 'center', minHeight: 30 },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.border, marginRight: 12 },
  dotOn: { backgroundColor: colors.primary },
  tText: { ...typography.body, color: colors.textSecondary, flex: 1 },
  tTime: { ...typography.caption, color: colors.textSecondary },
  item: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  thumb: { width: 52, height: 64, borderRadius: 6 },
  totals: { marginTop: 24, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingTop: 12, gap: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
});

export default OrderDetailsScreen;
