import React from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { Button } from '../../components/Button';
import { Screen } from '../../components/Screen';
import { resetDemoData } from '../../store/resetDemo';
import { colors, typography } from '../../utils/theme';

// Only functional settings (D-13): the one real action is clearing local demo data.
const SettingsScreen: React.FC = () => (
  <Screen padded>
    <Text style={typography.h3}>Demo data</Text>
    <Text style={styles.sub}>Clears your bag and wishlist on this device. Orders and addresses live on the demo server.</Text>
    <Button
      title="Reset demo data"
      variant="secondary"
      onPress={() =>
        Alert.alert('Reset demo data', 'This cannot be undone.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Reset', style: 'destructive', onPress: resetDemoData },
        ])
      }
    />
    <Text style={styles.ver}>TOJ demo build · local demo server</Text>
  </Screen>
);

const styles = StyleSheet.create({
  sub: { ...typography.body, color: colors.textSecondary, marginVertical: 8, marginBottom: 16 },
  ver: { ...typography.caption, color: colors.textSecondary, marginTop: 32, textAlign: 'center' },
});

export default SettingsScreen;
