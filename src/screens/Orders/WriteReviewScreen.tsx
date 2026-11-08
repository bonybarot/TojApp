import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { deleteReview, myReviews, saveReview } from '../../api/reviews';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Screen } from '../../components/Screen';
import { ErrorState, LoadingState } from '../../components/States';
import { RootStackParamList } from '../../navigation/types';
import { useProductStore } from '../../store/productStore';
import { colors, typography, FONT_CAP } from '../../utils/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'WriteReview'>;
const WORDS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

const WriteReviewScreen: React.FC<Props> = ({ route, navigation }) => {
  const { productId, title } = route.params;
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState('');
  const [existing, setExisting] = useState(false);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  // Form waits for any existing review: saving is an upsert, so an empty form would silently replace it.
  const [load, setLoad] = useState<'loading' | 'ready' | 'error'>('loading');

  const fetchMine = useCallback(() => {
    setLoad('loading');
    myReviews().then(
      list => {
        const r = list.find(x => x.productId === productId);
        if (r) { setRating(r.rating); setBody(r.body); setExisting(true); }
        setLoad('ready');
      },
      () => setLoad('error'),
    );
  }, [productId]);
  useEffect(fetchMine, [fetchMine]);

  const run = (p: Promise<unknown>) => {
    setBusy(true);
    p.then(
      () => {
        useProductStore.getState().loadProducts(); // fresh ★ average on cards
        navigation.goBack();
      },
      (e: Error) => { setError(e.message); setBusy(false); },
    );
  };
  const save = () => (rating ? run(saveReview(productId, rating, body.trim())) : setError('Choose a star rating.'));
  const remove = () =>
    Alert.alert('Delete review', 'Remove your review of this item?', [
      { text: 'Keep', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => run(deleteReview(productId)) },
    ]);

  if (load !== 'ready') {
    return <Screen>{load === 'error' ? <ErrorState onRetry={fetchMine} /> : <LoadingState />}</Screen>;
  }

  return (
    <Screen scroll padded>
      <Text style={typography.h2} maxFontSizeMultiplier={FONT_CAP}>{title}</Text>
      <Text style={styles.label} maxFontSizeMultiplier={FONT_CAP}>YOUR RATING</Text>
      <View style={styles.stars} accessibilityRole="radiogroup">
        {[1, 2, 3, 4, 5].map(n => (
          <Pressable
            key={n}
            onPress={() => { setRating(n); setError(undefined); }}
            style={styles.star}
            accessibilityRole="radio"
            accessibilityState={{ checked: rating === n }}
            accessibilityLabel={`${n} star${n > 1 ? 's' : ''}, ${WORDS[n]}`}
          >
            <Text style={[styles.starText, n <= rating && styles.starOn]}>{n <= rating ? '★' : '☆'}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.word}>{WORDS[rating]}</Text>
      <Input
        label="Review (optional)"
        value={body}
        onChangeText={t => setBody(t)}
        multiline
        maxLength={1000}
        placeholder="Fit, fabric, how it washed…"
        style={styles.body}
        textAlignVertical="top"
      />
      <Text style={styles.note}>Shown with your first name. Only customers who collected this item can review it.</Text>
      {!!error && <Text style={styles.error} accessibilityRole="alert">{error}</Text>}
      <Button title={existing ? 'Update review' : 'Post review'} onPress={save} loading={busy} />
      {existing && <Button title="Delete review" variant="secondary" onPress={remove} style={styles.delete} />}
    </Screen>
  );
};

const styles = StyleSheet.create({
  label: { ...typography.label, color: colors.textSecondary, marginTop: 20, marginBottom: 6 },
  stars: { flexDirection: 'row' },
  star: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  starText: { fontSize: 32, color: colors.border },
  starOn: { color: colors.warning },
  word: { ...typography.caption, color: colors.textSecondary, minHeight: 18, marginBottom: 16 },
  body: { minHeight: 120, paddingTop: 12 },
  note: { ...typography.caption, color: colors.textSecondary, marginTop: -8, marginBottom: 20 },
  error: { ...typography.caption, color: colors.error, marginBottom: 12 },
  delete: { marginTop: 12 },
});

export default WriteReviewScreen;
