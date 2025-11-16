import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import HistoryItem from '../../components/HistoryItem';
import { history } from '../../data/history';
import { colors } from '../../utils/theme';

const HistoryScreen = () => {
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={history}
        renderItem={({ item }) => <HistoryItem item={item} />}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: 16,
  },
});

export default HistoryScreen;

