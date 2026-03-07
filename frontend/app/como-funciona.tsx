import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '@/src/utils/theme';
import { Header } from '@/src/components/layout/Header';
import { Footer } from '@/src/components/layout/Footer';
import { Button } from '@/src/components/ui';
import { APP_NAME } from '@/src/constants';

export default function ComoFuncionaPage() {
  const router = useRouter();

  const steps = [
    {
      num: '01',
      icon: 'search',
      title: 'Elige tu Trámite',
      description: 'Navega por nuestro catálogo de servicios y selecciona el trámite que necesitas. Desde consultas IMSS hasta verificaciones fiscales.',
    },
    {
      num: '02',
      icon: 'wallet',
      title: 'Recarga tu Saldo',
      description: 'Agrega fondos a tu cuenta mediante transferencia bancaria. Tu saldo queda disponible para usar en cualquier servicio.',
    },
    {
      num: '03',
      icon: 'document-text',
      title: 'Completa el Formulario',
      description: 'Ingresa los datos requeridos para tu trámite (CURP, NSS, RFC, etc.). Toda la información está protegida y encriptada.',
    },
    {
      num: '04',
      icon: 'flash',
      title: 'Procesamiento Automático',
      description: 'Nuestro sistema procesa tu solicitud conectando con las fuentes oficiales correspondientes.',
    },
    {
      num: '05',
      icon: 'checkmark-circle',
      title: 'Recibe tu Resultado',
      description: 'Obtén tu documento o resultado digital en tu panel de usuario. Descargable y listo para usar.',
    },
  ];

  const features = [
    { icon: 'time-outline', title: 'Rápido', text: 'Resultados en minutos u horas, no en días' },
    { icon: 'shield-checkmark-outline', title: 'Seguro', text: 'Encriptación de datos y privacidad garantizada' },
    { icon: 'cash-outline', title: 'Transparente', text: 'Precios claros sin cargos ocultos' },
    { icon: 'help-circle-outline', title: 'Soporte', text: 'Asistencia disponible cuando la necesites' },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Header showBack />
      
      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>¿Cómo Funciona {APP_NAME}?</Text>
        <Text style={styles.heroSubtitle}>
          Realizar trámites digitales nunca fue tan fácil. Sigue estos simples pasos para obtener tus documentos.
        </Text>
      </View>

      {/* Steps */}
      <View style={styles.stepsSection}>
        {steps.map((step, i) => (
          <View key={i} style={styles.stepCard}>
            <View style={styles.stepHeader}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>{step.num}</Text>
              </View>
              <View style={styles.stepIcon}>
                <Ionicons name={step.icon as any} size={24} color={colors.brand.primary} />
              </View>
            </View>
            <Text style={styles.stepTitle}>{step.title}</Text>
            <Text style={styles.stepDesc}>{step.description}</Text>
            {i < steps.length - 1 && <View style={styles.stepConnector} />}
          </View>
        ))}
      </View>

      {/* Features */}
      <View style={styles.featuresSection}>
        <Text style={styles.sectionTitle}>¿Por qué elegirnos?</Text>
        <View style={styles.featuresGrid}>
          {features.map((f, i) => (
            <View key={i} style={styles.featureCard}>
              <Ionicons name={f.icon as any} size={28} color={colors.brand.primary} />
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* CTA */}
      <View style={styles.cta}>
        <Text style={styles.ctaTitle}>¿Listo para comenzar?</Text>
        <Text style={styles.ctaText}>Crea tu cuenta gratis y realiza tu primer trámite hoy</Text>
        <View style={styles.ctaButtons}>
          <Button title="Ver Servicios" onPress={() => router.push('/servicios')} size="lg" />
          <Button title="Crear Cuenta" onPress={() => router.push('/register')} variant="outline" size="lg" />
        </View>
      </View>

      <Footer />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  hero: {
    padding: spacing.lg,
    paddingVertical: spacing['2xl'],
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  heroSubtitle: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  stepsSection: {
    padding: spacing.lg,
    backgroundColor: colors.bg.secondary,
  },
  stepCard: {
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    position: 'relative',
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  stepNum: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.brand.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.text.inverse,
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: `${colors.brand.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  stepDesc: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
    lineHeight: 24,
  },
  stepConnector: {
    position: 'absolute',
    left: spacing.lg + 19,
    bottom: -spacing.md - 2,
    width: 2,
    height: spacing.md + 4,
    backgroundColor: colors.brand.primary,
    zIndex: 1,
  },
  featuresSection: {
    padding: spacing.lg,
    paddingVertical: spacing['2xl'],
  },
  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  featureCard: {
    width: '47%',
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    alignItems: 'center',
  },
  featureTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  featureText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  cta: {
    padding: spacing.lg,
    paddingVertical: spacing['2xl'],
    backgroundColor: `${colors.brand.primary}10`,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  ctaText: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
  ctaButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
});
