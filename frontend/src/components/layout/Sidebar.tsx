import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '@/src/utils/theme';
import { NAV_ITEMS, APP_NAME } from '@/src/constants';
import { useAuthStore } from '@/src/store/authStore';

interface SidebarProps {
  type: 'dashboard' | 'admin';
}

export const Sidebar: React.FC<SidebarProps> = ({ type }) => {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuthStore();

  const navItems = type === 'admin' ? NAV_ITEMS.admin : NAV_ITEMS.dashboard;

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  return (
    <View style={[styles.sidebar, { paddingTop: insets.top + spacing.md }]}>
      {/* Logo */}
      <TouchableOpacity style={styles.logo} onPress={() => router.push('/')}>
        <View style={styles.logoIcon}>
          <Ionicons name="flash" size={18} color={colors.text.inverse} />
        </View>
        <Text style={styles.logoText}>{APP_NAME}</Text>
      </TouchableOpacity>

      {/* User Info */}
      <View style={styles.userInfo}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.userDetails}>
          <Text style={styles.userName} numberOfLines={1}>{user?.name}</Text>
          <Text style={styles.userRole}>{user?.role === 'admin' ? 'Administrador' : 'Usuario'}</Text>
        </View>
      </View>

      {/* Navigation */}
      <ScrollView style={styles.nav} showsVerticalScrollIndicator={false}>
        {navItems.map((item, i) => {
          const isActive = pathname === item.href;
          return (
            <TouchableOpacity
              key={i}
              style={[styles.navItem, isActive && styles.navItemActive]}
              onPress={() => router.push(item.href as any)}
            >
              <Ionicons
                name={item.icon as any}
                size={20}
                color={isActive ? colors.brand.primary : colors.text.secondary}
              />
              <Text style={[styles.navItemText, isActive && styles.navItemTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={colors.status.error} />
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    width: 260,
    backgroundColor: colors.bg.secondary,
    borderRightWidth: 1,
    borderRightColor: colors.border.default,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
  logo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.brand.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.bg.card,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.brand.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text.inverse,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  userRole: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
  },
  nav: {
    flex: 1,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
  },
  navItemActive: {
    backgroundColor: `${colors.brand.primary}15`,
  },
  navItemText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    fontWeight: fontWeight.medium,
  },
  navItemTextActive: {
    color: colors.brand.primary,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: `${colors.status.error}10`,
  },
  logoutText: {
    fontSize: fontSize.sm,
    color: colors.status.error,
    fontWeight: fontWeight.medium,
  },
});
