import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { CategoryCard } from '../../components/CategoryCard';
import { categories } from '../../data/categories';
import { HomeStackParamList } from '../../navigation/HomeStack';
import { colors } from '../../utils/theme';

type CategoriesScreenNavigationProp =
  NativeStackNavigationProp<HomeStackParamList>;

const CategoriesScreen: React.FC = () => {
  const navigation = useNavigation<CategoriesScreenNavigationProp>();

  const handleCategoryPress = (categoryTitle: string) => {
    // Navigate to MainTabs first, then to HomeStack's ProductList
    navigation.getParent()?.navigate('MainTabs', {
      screen: 'HomeStack',
      params: {
        screen: 'ProductList',
        params: { category: categoryTitle },
      },
    } as never);
  };

  const renderCategory = ({ item }: { item: any }) => (
    <CategoryCard
      id={item.id}
      title={item.title}
      image={item.image}
      onPress={() => handleCategoryPress(item.title)}
    />
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={categories}
        renderItem={renderCategory}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.list}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    padding: 16,
  },
  row: {
    justifyContent: 'space-between',
  },
});

export default CategoriesScreen;
