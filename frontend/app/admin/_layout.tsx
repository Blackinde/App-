import React from 'react';
import { Stack, Redirect } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, usePathname } from 'expo-router';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/src/utils/theme';
import { useAuthStore } from '@/src/store/authStore';
import { NAV_ITEMS } from '@/src/constants';

export default function AdminLayout() {
  const { isAuthenticated, user, isLoading } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  if (isLoading) return null;

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  if (user?.role !== 'admin') {
    return <Redirect href="/dashboard" />;
  }

  const navItems = NAV_ITEMS.admin;

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
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.bottomNav}
      >
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href === '/admin' && pathname === '/admin');
          return (
            <TouchableOpacity
              key={item.href}
              style={[styles.navItem, isActive && styles.navItemActive]}
              onPress={() => router.push(item.href as any)}
            >
              <Ionicons
                name={item.icon as any}
                size={20}
                color={isActive ? colors.text.inverse : colors.text.muted}
              />
              <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
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
    paddingHorizontal: spacing.sm,
    gap: spacing.xs,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
  },
  navItemActive: {
    backgroundColor: colors.brand.primary,
  },
  navLabel: {
    fontSize: fontSize.xs,
    color: colors.text.muted,
    fontWeight: fontWeight.medium,
  },
  navLabelActive: {
    color: colors.text.inverse,
  },
});
