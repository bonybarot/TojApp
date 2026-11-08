import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { Screen } from '../../components/Screen';
import { DemoBanner } from '../../components/States';
import { useProductStore } from '../../store/productStore';
import { colors, typography } from '../../utils/theme';

const SupportScreen: React.FC = () => {
  const store = useProductStore(s => s.pickup);
  const faq = [
    [
      'Do you deliver?',
      `Not yet. Orders are collected free from ${store.name}, ${store.address}.`,
    ],
    ['When is the store open?', store.hours],
    [
      'Can every product be picked up?',
      'Only products marked for store pickup. The bag tells you if an item cannot be picked up.',
    ],
    [
      'How do I cancel an order?',
      'Open My Orders, select the order and tap Cancel while it is still placed or confirmed.',
    ],
    ['What is your returns policy?', 'Not yet defined for this demo.'],
  ];
  return (
    <Screen scroll padded>
      {faq.map(([q, a]) => (
        <React.Fragment key={q}>
          <Text style={styles.q}>{q}</Text>
          <Text style={styles.a}>{a}</Text>
        </React.Fragment>
      ))}
      <DemoBanner text="No support phone or email in this demo build. Ask at the store." />
    </Screen>
  );
};

const styles = StyleSheet.create({
  q: { ...typography.h3, marginTop: 16 },
  a: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: 8,
  },
});

export default SupportScreen;
