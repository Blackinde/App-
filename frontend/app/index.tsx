import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '@/src/utils/theme';
import { Button } from '@/src/components/Button';
import { useAuthStore } from '@/src/store/authStore';
import { useServicesStore, Service } from '@/src/store/servicesStore';

const { width } = Dimensions.get('window');

export default function LandingPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated, user } = useAuthStore();
  const { services, fetchServices, fetchCategories, categories } = useServicesStore();

  useEffect(() => {
    fetchServices();
    fetchCategories();
  }, []);

  const handleGetStarted = () => {
    router.push('/(tabs)/services');
  };

  const handleLogin = () => {
    if (isAuthenticated) {
      if (user?.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/(tabs)/orders');
      }
    } else {
      router.push('/(auth)/login');
    }
  };

  const features = [
    { icon: 'shield-checkmark', title: 'Seguro y Confiable', desc: 'Tus datos protegidos con encriptación' },
    { icon: 'flash', title: 'Rápido', desc: 'Entrega en 24-72 horas' },
    { icon: 'document-text', title: 'Documentos Oficiales', desc: 'Válidos para cualquier trámite' },
    { icon: 'headset', title: 'Soporte 24/7', desc: 'Asistencia cuando la necesites' },
  ];

  const steps = [
    { number: '1', title: 'Elige tu servicio', desc: 'Selecciona el trámite que necesitas' },
    { number: '2', title: 'Ingresa tus datos', desc: 'Completa el formulario de solicitud' },
    { number: '3', title: 'Realiza el pago', desc: 'Pago seguro por transferencia' },
    { number: '4', title: 'Recibe tu documento', desc: 'Descarga tu documento digital' },
  ];

  const faqs = [
    { q: '¿Cuánto tiempo tarda la entrega?', a: 'Dependiendo del servicio, entre 1 y 72 horas hábiles.' },
    { q: '¿Los documentos son oficiales?', a: 'Sí, todos los documentos provienen de fuentes oficiales del gobierno.' },
    { q: '¿Cómo realizo el pago?', a: 'Aceptamos transferencia bancaria. Próximamente más métodos.' },
    { q: '¿Mis datos están seguros?', a: 'Utilizamos encriptación de grado bancario para proteger tu información.' },
  ];

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logo}>
          <Ionicons name="document-text" size={28} color={colors.primary} />
          <Text style={styles.logoText}>Procedimientos<Text style={styles.logoAccent}>MX</Text></Text>
        </View>
        <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
          <Ionicons name={isAuthenticated ? 'person' : 'log-in-outline'} size={20} color={colors.primary} />
          <Text style={styles.loginText}>{isAuthenticated ? 'Mi Cuenta' : 'Ingresar'}</Text>
        </TouchableOpacity>
      </View>

      {/* Hero Section */}
      <View style={styles.hero}>
        <Text style={styles.heroTag}>PLATAFORMA LÍDER EN MÉXICO</Text>
        <Text style={styles.heroTitle}>Trámites Digitales{"\n"}Sin Complicaciones</Text>
        <Text style={styles.heroSubtitle}>
          Obtén tu historial laboral IMSS, CURP, constancias fiscales y más. Todo desde tu celular, rápido y seguro.
        </Text>
        <View style={styles.heroBtns}>
          <Button title="Ver Servicios" onPress={handleGetStarted} size="large" />
          <Button title="Cómo Funciona" onPress={() => {}} variant="outline" size="large" />
        </View>
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>10K+</Text>
            <Text style={styles.statLabel}>Clientes</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNumber}>50K+</Text>
            <Text style={styles.statLabel}>Trámites</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNumber}>99%</Text>
            <Text style={styles.statLabel}>Satisfacción</Text>
          </View>
        </View>
      </View>

      {/* Features */}
      <View style={styles.section}>
        <Text style={styles.sectionTag}>BENEFICIOS</Text>
        <Text style={styles.sectionTitle}>¿Por qué elegirnos?</Text>
        <View style={styles.featuresGrid}>
          {features.map((f, i) => (
            <View key={i} style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Ionicons name={f.icon as any} size={24} color={colors.primary} />
              </View>
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureDesc}>{f.desc}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* How it Works */}
      <View style={[styles.section, styles.sectionDark]}>
        <Text style={styles.sectionTag}>PROCESO</Text>
        <Text style={styles.sectionTitle}>¿Cómo funciona?</Text>
        <View style={styles.steps}>
          {steps.map((step, i) => (
            <View key={i} style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{step.number}</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDesc}>{step.desc}</Text>
              </View>
              {i < steps.length - 1 && <View style={styles.stepLine} />}
            </View>
          ))}
        </View>
      </View>

      {/* Services Preview */}
      <View style={styles.section}>
        <Text style={styles.sectionTag}>SERVICIOS</Text>
        <Text style={styles.sectionTitle}>Nuestros Trámites</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.servicesScroll}>
          {services.slice(0, 4).map((service: Service) => (
            <TouchableOpacity
              key={service.id}
              style={styles.servicePreview}
              onPress={() => router.push(`/service/${service.id}`)}
            >
              <View style={styles.servicePreviewIcon}>
                <Ionicons name="document-text" size={32} color={colors.primary} />
              </View>
              <Text style={styles.servicePreviewName}>{service.name}</Text>
              <Text style={styles.servicePreviewPrice}>${service.price.toLocaleString('es-MX')} MXN</Text>
              <Text style={styles.servicePreviewTime}>{service.delivery_time}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <Button title="Ver todos los servicios" onPress={handleGetStarted} variant="outline" style={styles.viewAllBtn} />
      </View>

      {/* FAQ */}
      <View style={[styles.section, styles.sectionDark]}>
        <Text style={styles.sectionTag}>FAQ</Text>
        <Text style={styles.sectionTitle}>Preguntas Frecuentes</Text>
        {faqs.map((faq, i) => (
          <View key={i} style={styles.faqItem}>
            <View style={styles.faqQ}>
              <Ionicons name="help-circle" size={20} color={colors.primary} />
              <Text style={styles.faqQText}>{faq.q}</Text>
            </View>
            <Text style={styles.faqA}>{faq.a}</Text>
          </View>
        ))}
      </View>

      {/* CTA */}
      <View style={styles.cta}>
        <Text style={styles.ctaTitle}>¿Listo para comenzar?</Text>
        <Text style={styles.ctaSubtitle}>Obtén tus documentos oficiales hoy mismo</Text>
        <Button title="Solicitar Ahora" onPress={handleGetStarted} size="large" />
      </View>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
        <View style={styles.footerLogo}>
          <Ionicons name="document-text" size={24} color={colors.primary} />
          <Text style={styles.footerLogoText}>ProcedimientosMX</Text>
        </View>
        <Text style={styles.footerText}>© 2024 ProcedimientosMX. Todos los derechos reservados.</Text>
        <Text style={styles.footerText}>Servicio de trámites digitales en México</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  logo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  logoAccent: {
    color: colors.primary,
  },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(0, 217, 255, 0.1)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  loginText: {
    color: colors.primary,
    fontWeight: fontWeight.medium,
    fontSize: fontSize.sm,
  },
  hero: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  heroTag: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: fontWeight.bold,
    letterSpacing: 2,
    marginBottom: spacing.md,
  },
  heroTitle: {
    fontSize: fontSize.hero,
    fontWeight: fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 48,
    marginBottom: spacing.md,
  },
  heroSubtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  heroBtns: {
    flexDirection: 'column',
    gap: spacing.md,
    width: '100%',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xxl,
    backgroundColor: colors.backgroundCard,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.xl,
    width: '100%',
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  statLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  section: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxl,
  },
  sectionDark: {
    backgroundColor: colors.backgroundSecondary,
  },
  sectionTag: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: fontWeight.bold,
    letterSpacing: 2,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  featureCard: {
    width: (width - spacing.lg * 2 - spacing.md) / 2,
    backgroundColor: colors.backgroundCard,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(0, 217, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  featureTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  featureDesc: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  steps: {
    gap: spacing.lg,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    position: 'relative',
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  stepNumberText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.background,
  },
  stepContent: {
    flex: 1,
    paddingTop: 4,
  },
  stepTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  stepDesc: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  stepLine: {
    position: 'absolute',
    left: 19,
    top: 44,
    width: 2,
    height: 40,
    backgroundColor: colors.border,
  },
  servicesScroll: {
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  servicePreview: {
    width: 180,
    backgroundColor: colors.backgroundCard,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  servicePreviewIcon: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(0, 217, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  servicePreviewName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  servicePreviewPrice: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    marginBottom: 4,
  },
  servicePreviewTime: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  viewAllBtn: {
    marginTop: spacing.xl,
  },
  faqItem: {
    backgroundColor: colors.backgroundCard,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  faqQ: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  faqQText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    flex: 1,
  },
  faqA: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 22,
    paddingLeft: 28,
  },
  cta: {
    backgroundColor: 'rgba(0, 217, 255, 0.1)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxl,
    alignItems: 'center',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(0, 217, 255, 0.2)',
  },
  ctaTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  ctaSubtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
  },
  footerLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  footerLogoText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  footerText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
});
