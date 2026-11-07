import React, { useEffect } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../components/Screen';
import { SmartImage } from '../../components/SmartImage';
import { EmptyState, ErrorState } from '../../components/States';
import { useRootNavigation } from '../../hooks';
import { useOrderStore } from '../../store/orderStore';
import { formatDate, formatPrice } from '../../utils/format';
import { STATUS_COLOR, STATUS_LABEL } from '../../utils/orderStatus';
import { borderRadius, colors, typography } from '../../utils/theme';

const itemCount = (n: number) => `${n} item${n === 1 ? '' : 's'}`;

const OrderHistoryScreen: React.FC = () => {
  const nav = useRootNavigation();
  const orders = useOrderStore(s => s.orders);
  const status = useOrderStore(s => s.status);
  // Revalidate on open: status can change on the server (store confirms, ready for pickup).
  const reload = () => useOrderStore.getState().load().catch(() => {});
  useEffect(() => {
    reload();
  }, []);
  if (status === 'error' && orders.length === 0) {
    return (
      <Screen>
        <ErrorState onRetry={reload} />
      </Screen>
    );
  }
  return (
    <Screen>
      <FlatList
        data={orders}
        keyExtractor={o => o.id}
        refreshing={status === 'loading'}
        onRefresh={reload}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState title="No orders yet" message="Your orders will appear here." actionLabel="Start shopping" onAction={() => nav.navigate('Tabs', { screen: 'Shop' })} />
        }
        renderItem={({ item: o }) => (
          <Pressable style={styles.card} onPress={() => nav.navigate('OrderDetails', { orderId: o.id })} accessibilityRole="button" accessibilityLabel={`Order ${o.id}, ${STATUS_LABEL[o.status]}`}>
            <View style={styles.head}>
              <Text style={typography.h3}>{o.id}</Text>
              <Text style={[styles.status, { color: STATUS_COLOR[o.status] }]}>{STATUS_LABEL[o.status].toUpperCase()}</Text>
            </View>
            <Text style={styles.sub}>{formatDate(o.placedAt)} · {itemCount(o.items.reduce((n, i) => n + i.quantity, 0))}</Text>
            <View style={styles.thumbs}>
              {o.items.slice(0, 4).map(i => (
                <SmartImage key={`${i.productId}${i.color}${i.size}`} uri={i.image} label={i.title} style={styles.thumb} />
              ))}
              <Text style={[typography.h3, styles.total]}>{formatPrice(o.total)}</Text>
            </View>
          </Pressable>
        )}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  list: { padding: 16, flexGrow: 1 },
  total: { marginLeft: 'auto' },
  card: { padding: 14, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.lg, marginBottom: 12 },
  head: { flexDirection: 'row', justifyContent: 'space-between' },
  status: { ...typography.label },
  sub: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  thumbs: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  thumb: { width: 44, height: 56, borderRadius: 6 },
});

export default OrderHistoryScreen;
