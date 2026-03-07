import React from 'react';
import { Stack, useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/src/utils/theme';
import { useAuthStore } from '@/src/store/authStore';

export default function AdminLayout() {
  const router = useRouter();
  const { user } = useAuthStore();

  // Redirect if not admin
  if (user?.role !== 'admin') {
    router.replace('/');
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.backgroundSecondary },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '600' },
        contentStyle: { backgroundColor: colors.background },
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        ),
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Panel de Administración' }} />
      <Stack.Screen name="orders" options={{ title: 'Gestión de Pedidos' }} />
      <Stack.Screen name="services" options={{ title: 'Gestión de Servicios' }} />
      <Stack.Screen name="clients" options={{ title: 'Clientes' }} />
      <Stack.Screen name="order-detail" options={{ title: 'Detalle del Pedido' }} />
    </Stack>
  );
}
