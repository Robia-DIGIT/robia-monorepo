import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Brand } from '@/constants/theme';
import { useSession } from '@/src/auth/session';

export default function NotFoundScreen() {
  const { token, isLoading } = useSession();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={Brand.teal} />
      </View>
    );
  }

  return <Redirect href={token ? '/(tabs)/dashboard' : '/auth'} />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.slate50,
  },
});
