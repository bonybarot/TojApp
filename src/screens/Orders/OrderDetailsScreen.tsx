import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { Screen } from '../../components/Screen';
import { SmartImage } from '../../components/SmartImage';
import { EmptyState } from '../../components/States';
import { RootStackParamList } from '../../navigation/types';
import { CANCELLABLE, useOrderStore } from '../../store/orderStore';
import { formatDate, formatPrice } from '../../utils/format';
import { PAYMENT_LABEL, STATUS_COLOR, STATUS_LABEL, timelineFor } from '../../utils/orderStatus';
import { colors, typography } from '../../utils/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'OrderDetails'>;

const OrderDetailsScreen: React.FC<Props> = ({ route, navigation }) => {
  const order = useOrderStore(s => s.orders.find(o => o.id === route.params.orderId));
  const cancel = useOrderStore(s => s.cancelOrder);
  const id = route.params.orderId;
  useFocusEffect(
    useCallback(() => {
      useOrderStore.getState().refreshOne(id).catch(() => {});
    }, [id]),
  );
  if (!order) {
    return <Screen><EmptyState title="Order not found" actionLabel="My orders" onAction={() => navigation.navigate('OrderHistory')} /></Screen>;
  }
  const cancelled = order.status === 'CANCELLED';
  const steps = timelineFor(order.fulfilment);
  const step = steps.indexOf(order.status);
  const confirmCancel = () =>
    Alert.alert('Cancel order', `Cancel ${order.id}?`, [
      { text: 'Keep order', style: 'cancel' },
      { text: 'Cancel order', style: 'destructive', onPress: () => { cancel(order.id).catch((e: Error) => Alert.alert('Could not cancel', e.message)); } },
    ]);

  return (
    <Screen scroll padded>
      <Text style={typography.h1}>{order.id}</Text>
      <Text style={[styles.status, { color: STATUS_COLOR[order.status] }]}>{STATUS_LABEL[order.status].toUpperCase()}</Text>
      <Text style={styles.sub}>Placed {formatDate(order.placedAt)}</Text>

      {!cancelled && (
        <View style={styles.timeline}>
          {steps.map((s, i) => (
            <View key={s} style={styles.tRow}>
              <View style={[styles.dot, i <= step && styles.dotOn]} />
              <Text style={[styles.tText, i <= step && styles.tTextOn]}>{STATUS_LABEL[s]}</Text>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.h}>ITEMS</Text>
      {order.items.map(i => (
        <View key={`${i.productId}${i.color}${i.size}`} style={styles.item}>
          <SmartImage uri={i.image} label={i.title} style={styles.thumb} />
          <View style={styles.itemText}>
            <Text style={typography.body}>{i.title}</Text>
            <Text style={styles.sub}>{i.color} · {i.size} · Qty {i.quantity}</Text>
          </View>
          <Text style={typography.body}>{formatPrice(i.unitPrice * i.quantity)}</Text>
        </View>
      ))}

      <Text style={styles.h}>{order.fulfilment === 'pickup' ? 'PICKUP' : 'DELIVERY ADDRESS'}</Text>
      {order.fulfilment === 'pickup' ? (
        <Text style={typography.body}>{order.pickupStore}</Text>
      ) : order.address ? (
        <Text style={typography.body}>
          {order.address.fullName}{'\n'}{order.address.line1}{order.address.line2 ? `, ${order.address.line2}` : ''}{'\n'}{order.address.city} {order.address.postalCode}
        </Text>
      ) : null}

      <Text style={styles.h}>PAYMENT</Text>
      <Text style={typography.body}>{PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod}</Text>

      <View style={styles.totals}>
        <View style={styles.row}><Text style={styles.sub}>Subtotal</Text><Text style={typography.body}>{formatPrice(order.subtotal)}</Text></View>
        <View style={styles.row}><Text style={styles.sub}>{order.fulfilment === 'pickup' ? 'Pickup' : 'Delivery'}</Text><Text style={typography.body}>{order.deliveryFee ? formatPrice(order.deliveryFee) : 'Free'}</Text></View>
        <View style={styles.row}><Text style={typography.h2}>Total</Text><Text style={typography.h2}>{formatPrice(order.total)}</Text></View>
      </View>

      {CANCELLABLE.includes(order.status) && (
        <Button title="Cancel order" variant="secondary" onPress={confirmCancel} style={styles.cancel} />
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  tTextOn: { color: colors.text, fontWeight: '600' },
  itemText: { flex: 1, marginLeft: 12 },
  cancel: { marginTop: 20 },
  status: { ...typography.label, marginTop: 4 },
  sub: { ...typography.caption, color: colors.textSecondary },
  h: { ...typography.label, color: colors.textSecondary, marginTop: 24, marginBottom: 10 },
  timeline: { marginTop: 20, paddingLeft: 4 },
  tRow: { flexDirection: 'row', alignItems: 'center', minHeight: 30 },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.border, marginRight: 12 },
  dotOn: { backgroundColor: colors.primary },
  tText: { ...typography.body, color: colors.textSecondary },
  item: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  thumb: { width: 52, height: 64, borderRadius: 6 },
  totals: { marginTop: 24, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingTop: 12, gap: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
});

export default OrderDetailsScreen;
