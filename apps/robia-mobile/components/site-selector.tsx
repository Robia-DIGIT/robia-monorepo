import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useRobiaData } from '@/src/api/data';
import { Brand } from '@/constants/theme';
import { Choices } from '@/components/api-ui';
export function SiteSelector() {
  const { websites, selectedWebsiteId, selectWebsite } = useRobiaData();
  return <View style={{ gap: 8 }}><Choices value={selectedWebsiteId ?? ''} onChange={selectWebsite} options={websites.map(s => ({ value: s.id, label: s.domain ?? s.url }))} />
    <Pressable accessibilityRole="button" onPress={() => router.push('/websites')} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={{ color: Brand.tealDark }}>Gérer mes sites</Text></Pressable></View>;
}
