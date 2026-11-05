import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { Screen } from '../../components/Screen';
import { DemoBanner } from '../../components/States';
import { PICKUP_STORE } from '../../data/stores';
import { colors, typography } from '../../utils/theme';

const FAQ = [
  ['Do you deliver?', `Not yet. Orders are collected free from ${PICKUP_STORE.name}, ${PICKUP_STORE.address}.`],
  ['Can every product be picked up?', 'Only products marked for store pickup. The bag tells you if an item cannot be picked up.'],
  ['How do I cancel an order?', 'Open My Orders, select the order and tap Cancel while it is still placed or confirmed.'],
  ['What is your returns policy?', 'Not yet defined for this demo.'],
];

const SupportScreen: React.FC = () => (
  <Screen scroll padded>
    {FAQ.map(([q, a]) => (
      <React.Fragment key={q}>
        <Text style={styles.q}>{q}</Text>
        <Text style={styles.a}>{a}</Text>
      </React.Fragment>
    ))}
    <DemoBanner text="Support contact details are placeholders in this demo build." />
  </Screen>
);

const styles = StyleSheet.create({
  q: { ...typography.h3, marginTop: 16 },
  a: { ...typography.body, color: colors.textSecondary, marginTop: 4, marginBottom: 8 },
});

export default SupportScreen;
