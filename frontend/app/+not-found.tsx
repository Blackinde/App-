import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '@/src/utils/theme';
import { Button } from '@/src/components/ui';
import { APP_NAME } from '@/src/constants';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="alert-circle" size={64} color={colors.text.muted} />
        </View>
        
        <Text style={styles.title}>Página no encontrada</Text>
        <Text style={styles.subtitle}>
          La página que buscas no existe o ha sido movida.
        </Text>
        
        <View style={styles.actions}>
          <Button
            title="Ir al Inicio"
            onPress={() => router.replace('/')}
            icon={<Ionicons name="home" size={18} color={colors.text.inverse} />}
          />
          <Button
            title="Volver Atrás"
            variant="outline"
            onPress={() => router.back()}
            icon={<Ionicons name="arrow-back" size={18} color={colors.brand.primary} />}
          />
        </View>
      </View>
      
      <Text style={styles.brand}>{APP_NAME}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  content: {
    alignItems: 'center',
    maxWidth: 320,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.bg.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  brand: {
    position: 'absolute',
    bottom: spacing['2xl'],
    fontSize: fontSize.sm,
    color: colors.text.muted,
  },
});
