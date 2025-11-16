import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useUserStore } from '../store/userStore';
import { colors } from '../utils/theme';

export const DrawerHeader: React.FC = () => {
  const user = useUserStore(state => state.user);

  if (!user) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: user.avatar || 'https://i.pravatar.cc/150?img=1' }}
        style={styles.avatar}
      />
      <Text style={styles.name}>{user.name}</Text>
      <Text style={styles.email}>{user.email}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    paddingTop: 32,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 9999,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: colors.background,
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.background,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
  },
});
