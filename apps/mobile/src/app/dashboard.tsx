import { View, Text } from 'react-native';
import { useAuthStore } from '../../lib/store';

export default function DashboardScreen() {
  const tenant = useAuthStore((state) => state.tenant);
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: tenant?.primaryColor || 'white' }}>
      <Text style={{ fontSize: 24, color: 'white', fontWeight: 'bold' }}>Hoş Geldin Usta!</Text>
    </View>
  );
}