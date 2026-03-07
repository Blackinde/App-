import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, fontSize, fontWeight } from '@/src/utils/theme';
import { useAuthStore } from '@/src/store/authStore';
import { APP_NAME } from '@/src/constants';

interface HeaderProps {
  showBack?: boolean;
  showAuth?: boolean;
  transparent?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  showBack = false,
  showAuth = true,
  transparent = false,
}) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated, user } = useAuthStore();

  const handleAuthPress = () => {
    if (isAuthenticated) {
      if (user?.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } else {
      router.push('/login');
    }
  };

  return (
    <View style={[
      styles.header,
      { paddingTop: insets.top + spacing.sm },
      transparent && styles.transparent
    ]}>
      <View style={styles.left}>
        {showBack && (
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => router.push('/')} style={styles.logo}>
          <View style={styles.logoIcon}>
            <Ionicons name="flash" size={20} color={colors.text.inverse} />
          </View>
          <Text style={styles.logoText}>{APP_NAME}</Text>
        </TouchableOpacity>
      </View>
      
      {showAuth && (
        <TouchableOpacity style={styles.authBtn} onPress={handleAuthPress}>
          <Ionicons
            name={isAuthenticated ? 'person-circle' : 'log-in-outline'}
            size={20}
            color={colors.brand.primary}
          />
          <Text style={styles.authText}>
            {isAuthenticated ? (user?.role === 'admin' ? 'Admin' : 'Mi Cuenta') : 'Ingresar'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.bg.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  transparent: {
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  backBtn: {
    marginRight: spacing.sm,
  },
  logo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
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
  authBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: `${colors.brand.primary}15`,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  authText: {
    color: colors.brand.primary,
    fontWeight: fontWeight.medium,
    fontSize: fontSize.sm,
  },
});
