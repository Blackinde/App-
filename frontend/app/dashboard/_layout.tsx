import React from 'react';
import { Stack, Redirect } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, usePathname } from 'expo-router';
import { colors, spacing, fontSize, fontWeight } from '@/src/utils/theme';
import { useAuthStore } from '@/src/store/authStore';
import { NAV_ITEMS } from '@/src/constants';

export default function DashboardLayout() {
  const { isAuthenticated, user, isLoading } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  if (isLoading) return null;

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  if (user?.role === 'admin') {
    return <Redirect href="/admin" />;
  }

  const navItems = NAV_ITEMS.dashboard;

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg.primary },
          animation: 'fade',
        }}
      />
      
      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href === '/dashboard' && pathname === '/dashboard');
          return (
            <TouchableOpacity
              key={item.href}
              style={styles.navItem}
              onPress={() => router.push(item.href as any)}
            >
              <Ionicons
                name={item.icon as any}
                size={24}
                color={isActive ? colors.brand.primary : colors.text.muted}
              />
              <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: colors.bg.card,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  navLabel: {
    fontSize: fontSize.xs,
    color: colors.text.muted,
    marginTop: 4,
    fontWeight: fontWeight.medium,
  },
  navLabelActive: {
    color: colors.brand.primary,
  },
});
