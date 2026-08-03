import { Tabs } from 'expo-router';
import { colors } from '@circulo/config';
import { useColorScheme } from 'react-native';

export default function TabsLayout() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const c = colors[scheme];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.textMuted,
        tabBarStyle: { backgroundColor: c.surface, borderTopColor: c.border },
      }}
    >
      <Tabs.Screen name="discovery" options={{ title: 'Conocer' }} />
      <Tabs.Screen name="matches" options={{ title: 'Conversaciones' }} />
      <Tabs.Screen name="profile" options={{ title: 'Mi perfil' }} />
    </Tabs>
  );
}
