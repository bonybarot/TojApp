import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { Screen } from '../../components/Screen';
import { useRootNavigation } from '../../hooks';
import { useUserStore } from '../../store/userStore';
import { colors, typography } from '../../utils/theme';

const Row: React.FC<{ title: string; onPress: () => void }> = ({ title, onPress }) => (
  <Pressable style={styles.row} onPress={onPress} accessibilityRole="button" accessibilityLabel={title}>
    <Text style={typography.body}>{title}</Text>
    <Icon name="chevron" size={14} color={colors.textSecondary} />
  </Pressable>
);

const ProfileScreen: React.FC = () => {
  const nav = useRootNavigation();
  const user = useUserStore(s => s.user);

  const logout = () =>
    Alert.alert('Log out', 'Log out of TOJ?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => { useUserStore.getState().logout(); } },
    ]);

  if (!user) {
    return (
      <Screen edges={['top']} padded>
        <Text style={styles.title} accessibilityRole="header">Profile</Text>
        <Text style={styles.sub}>Browse as a guest. Sign in to check out and track orders.</Text>
        <Button title="Sign in or create account" onPress={() => nav.navigate('Login', {})} />
        <View style={styles.links}>
          <Row title="Help & Support" onPress={() => nav.navigate('Support')} />
          <Row title="Settings" onPress={() => nav.navigate('Settings')} />
        </View>
      </Screen>
    );
  }
  return (
    <Screen edges={['top']} scroll padded>
      <Text style={styles.title} accessibilityRole="header">{user.name}</Text>
      <Text style={styles.sub}>+91 {user.phone}</Text>
      <Row title="Personal Information" onPress={() => nav.navigate('PersonalInfo')} />
      <Row title="My Orders" onPress={() => nav.navigate('OrderHistory')} />
      <Row title="Wishlist" onPress={() => nav.navigate('Wishlist')} />
      <Row title="Help & Support" onPress={() => nav.navigate('Support')} />
      <Row title="Settings" onPress={() => nav.navigate('Settings')} />
      <Button title="Log out" variant="secondary" onPress={logout} style={styles.logout} />
    </Screen>
  );
};

const styles = StyleSheet.create({
  links: { marginTop: 16 },
  logout: { marginTop: 24 },
  title: { ...typography.h1, marginTop: 8 },
  sub: { ...typography.body, color: colors.textSecondary, marginTop: 4, marginBottom: 20 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 54, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
});

export default ProfileScreen;
