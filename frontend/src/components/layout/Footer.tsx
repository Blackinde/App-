import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '@/src/utils/theme';
import { APP_NAME, APP_TAGLINE } from '@/src/constants';

export const Footer: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const links = [
    { label: 'Servicios', href: '/servicios' },
    { label: 'Cómo Funciona', href: '/como-funciona' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Contacto', href: '/contacto' },
  ];

  return (
    <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
      <View style={styles.brand}>
        <View style={styles.logo}>
          <View style={styles.logoIcon}>
            <Ionicons name="flash" size={18} color={colors.text.inverse} />
          </View>
          <Text style={styles.logoText}>{APP_NAME}</Text>
        </View>
        <Text style={styles.tagline}>{APP_TAGLINE}</Text>
      </View>
      
      <View style={styles.links}>
        {links.map((link, i) => (
          <TouchableOpacity key={i} onPress={() => router.push(link.href as any)}>
            <Text style={styles.link}>{link.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <View style={styles.bottom}>
        <Text style={styles.copyright}>© 2024 {APP_NAME}. Todos los derechos reservados.</Text>
        <Text style={styles.disclaimer}>Plataforma de trámites digitales en México</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    backgroundColor: colors.bg.secondary,
    paddingTop: spacing['2xl'],
    paddingHorizontal: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  brand: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  logoIcon: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: colors.brand.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  tagline: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  links: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  link: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    fontWeight: fontWeight.medium,
  },
  bottom: {
    alignItems: 'center',
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  copyright: {
    fontSize: fontSize.xs,
    color: colors.text.muted,
    marginBottom: 4,
  },
  disclaimer: {
    fontSize: fontSize.xs,
    color: colors.text.muted,
  },
});
