import React from 'react';
import { Slot, Redirect, useRouter, usePathname } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/src/utils/theme';
import { useAuthStore } from '@/src/store/authStore';
import { NAV_ITEMS } from '@/src/constants';

export default function AdminLayout() {
  const { isAuthenticated, user, isLoading } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  // Show nothing while checking auth
  if (isLoading) {
    return null;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  // Redirect non-admin users to dashboard
  if (user?.role !== 'admin') {
    return <Redirect href="/dashboard" />;
  }

  const navItems = NAV_ITEMS.admin;

  const handleNavigation = (href: string) => {
    router.replace(href as any);
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={styles.content}>
        <Slot />
      </View>
      
      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href === '/admin' && pathname === '/admin');
          return (
            <TouchableOpacity
              key={item.href}
              style={styles.navItem}
              onPress={() => handleNavigation(item.href)}
              activeOpacity={0.7}
            >
              <View style={[styles.navIconWrap, isActive && styles.navIconWrapActive]}>
                <Ionicons
                  name={(isActive ? item.icon.replace('-outline', '') : item.icon) as any}
                  size={20}
                  color={isActive ? colors.brand.primary : colors.text.muted}
                />
              </View>
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
  content: {
    flex: 1,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: colors.bg.card,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  navIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  navIconWrapActive: {
    backgroundColor: `${colors.brand.primary}20`,
  },
  navLabel: {
    fontSize: 10,
    color: colors.text.muted,
    fontWeight: fontWeight.medium,
    textAlign: 'center',
  },
  navLabelActive: {
    color: colors.brand.primary,
  },
});
