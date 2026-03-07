import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '@/src/utils/theme';
import { Header } from '@/src/components/layout/Header';
import { Footer } from '@/src/components/layout/Footer';
import { Button, ServiceCard } from '@/src/components/ui';
import { useServicesStore } from '@/src/store/servicesStore';
import { APP_NAME, APP_TAGLINE, SERVICE_CATEGORIES } from '@/src/constants';
import { formatCurrency } from '@/src/utils/formatters';

const { width } = Dimensions.get('window');

export default function LandingPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { services, fetchServices, fetchCategories } = useServicesStore();

  useEffect(() => {
    fetchServices();
    fetchCategories();
  }, []);

  const benefits = [
    { icon: 'flash', title: 'Rápido', desc: 'Resultados en minutos, no en días' },
    { icon: 'shield-checkmark', title: 'Seguro', desc: 'Datos protegidos con encriptación' },
    { icon: 'document-text', title: 'Oficial', desc: 'Documentos válidos para cualquier trámite' },
    { icon: 'wallet', title: 'Transparente', desc: 'Precios claros, sin sorpresas' },
  ];

  const steps = [
    { num: '01', title: 'Elige tu trámite', desc: 'Selecciona el servicio que necesitas de nuestro catálogo' },
    { num: '02', title: 'Ingresa tus datos', desc: 'Completa el formulario con la información requerida' },
    { num: '03', title: 'Recibe tu resultado', desc: 'Obtén tu documento digital en minutos u horas' },
  ];

  const faqs = [
    { q: '¿Cuánto tiempo tarda la entrega?', a: 'Dependiendo del servicio, entre 1 y 72 horas hábiles. Algunos servicios son instantáneos.' },
    { q: '¿Los documentos son oficiales?', a: 'Sí, todos los documentos provienen de consultas directas a fuentes oficiales del gobierno.' },
    { q: '¿Cómo pago?', a: 'Recarga saldo en tu cuenta y paga directamente desde tu wallet. Próximamente más métodos.' },
    { q: '¿Mis datos están seguros?', a: 'Utilizamos encriptación y no almacenamos datos sensibles más allá de lo necesario.' },
  ];

  const trust = [
    { icon: 'checkmark-circle', text: 'Verificación en tiempo real' },
    { icon: 'lock-closed', text: 'Datos encriptados' },
    { icon: 'time', text: 'Soporte 24/7' },
    { icon: 'ribbon', text: 'Garantía de satisfacción' },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Header showAuth />
      
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.heroBadge}>
          <Ionicons name="flash" size={14} color={colors.brand.primary} />
          <Text style={styles.heroBadgeText}>PLATAFORMA LÍDER EN MÉXICO</Text>
        </View>
        <Text style={styles.heroTitle}>Trámites y Consultas{"\n"}Digitales al Instante</Text>
        <Text style={styles.heroSubtitle}>
          Consulta tu historial IMSS, verifica tu CURP, obtén tu RFC y más. Todo desde una sola plataforma, rápido y seguro.
        </Text>
        <View style={styles.heroCtas}>
          <Button title="Explorar Servicios" onPress={() => router.push('/servicios')} size="lg" fullWidth />
          <Button title="Cómo Funciona" onPress={() => router.push('/como-funciona')} variant="outline" size="lg" fullWidth />
        </View>
        
        {/* Trust indicators */}
        <View style={styles.trustRow}>
          {trust.map((item, i) => (
            <View key={i} style={styles.trustItem}>
              <Ionicons name={item.icon as any} size={16} color={colors.brand.primary} />
              <Text style={styles.trustText}>{item.text}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Benefits */}
      <View style={styles.section}>
        <Text style={styles.sectionTag}>BENEFICIOS</Text>
        <Text style={styles.sectionTitle}>¿Por qué elegir {APP_NAME}?</Text>
        <View style={styles.benefitsGrid}>
          {benefits.map((b, i) => (
            <View key={i} style={styles.benefitCard}>
              <View style={styles.benefitIcon}>
                <Ionicons name={b.icon as any} size={24} color={colors.brand.primary} />
              </View>
              <Text style={styles.benefitTitle}>{b.title}</Text>
              <Text style={styles.benefitDesc}>{b.desc}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Services Preview */}
      <View style={[styles.section, styles.sectionAlt]}>
        <Text style={styles.sectionTag}>SERVICIOS</Text>
        <Text style={styles.sectionTitle}>Nuestros Trámites Más Solicitados</Text>
        <View style={styles.servicesGrid}>
          {services.slice(0, 4).map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              onPress={() => router.push(`/servicios/${service.slug}`)}
              style={styles.serviceCard}
            />
          ))}
        </View>
        <Button 
          title="Ver Todos los Servicios" 
          onPress={() => router.push('/servicios')} 
          variant="outline" 
          style={{ marginTop: spacing.lg }}
        />
      </View>

      {/* How it Works */}
      <View style={styles.section}>
        <Text style={styles.sectionTag}>PROCESO</Text>
        <Text style={styles.sectionTitle}>¿Cómo Funciona?</Text>
        <View style={styles.stepsContainer}>
          {steps.map((step, i) => (
            <View key={i} style={styles.step}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>{step.num}</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDesc}>{step.desc}</Text>
              </View>
              {i < steps.length - 1 && <View style={styles.stepConnector} />}
            </View>
          ))}
        </View>
      </View>

      {/* FAQ */}
      <View style={[styles.section, styles.sectionAlt]}>
        <Text style={styles.sectionTag}>FAQ</Text>
        <Text style={styles.sectionTitle}>Preguntas Frecuentes</Text>
        {faqs.map((faq, i) => (
          <View key={i} style={styles.faqCard}>
            <View style={styles.faqHeader}>
              <Ionicons name="help-circle" size={20} color={colors.brand.primary} />
              <Text style={styles.faqQuestion}>{faq.q}</Text>
            </View>
            <Text style={styles.faqAnswer}>{faq.a}</Text>
          </View>
        ))}
        <TouchableOpacity onPress={() => router.push('/faq')} style={styles.faqMoreLink}>
          <Text style={styles.faqMoreText}>Ver todas las preguntas</Text>
          <Ionicons name="arrow-forward" size={16} color={colors.brand.primary} />
        </TouchableOpacity>
      </View>

      {/* CTA */}
      <View style={styles.cta}>
        <View style={styles.ctaIcon}>
          <Ionicons name="rocket" size={32} color={colors.text.inverse} />
        </View>
        <Text style={styles.ctaTitle}>¿Listo para comenzar?</Text>
        <Text style={styles.ctaSubtitle}>Crea tu cuenta gratis y realiza tu primer trámite hoy</Text>
        <Button title="Crear Cuenta Gratis" onPress={() => router.push('/register')} size="lg" />
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
  // Hero
  hero: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing['3xl'],
    alignItems: 'center',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: `${colors.brand.primary}15`,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginBottom: spacing.lg,
  },
  heroBadgeText: {
    fontSize: fontSize.xs,
    color: colors.brand.primary,
    fontWeight: fontWeight.bold,
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    textAlign: 'center',
    lineHeight: 48,
    marginBottom: spacing.md,
  },
  heroSubtitle: {
    fontSize: fontSize.md,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: spacing.xl,
    maxWidth: 400,
  },
  heroCtas: {
    width: '100%',
    gap: spacing.md,
    maxWidth: 320,
  },
  trustRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.lg,
    marginTop: spacing['2xl'],
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  trustText: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
  },
  // Section
  section: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing['2xl'],
  },
  sectionAlt: {
    backgroundColor: colors.bg.secondary,
  },
  sectionTag: {
    fontSize: fontSize.xs,
    color: colors.brand.primary,
    fontWeight: fontWeight.bold,
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  // Benefits
  benefitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  benefitCard: {
    width: (width - spacing.lg * 2 - spacing.md) / 2,
    backgroundColor: colors.bg.card,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  benefitIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: `${colors.brand.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  benefitTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  benefitDesc: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  // Services
  servicesGrid: {
    gap: spacing.md,
  },
  serviceCard: {
    marginBottom: 0,
  },
  // Steps
  stepsContainer: {
    gap: spacing.lg,
  },
  step: {
    flexDirection: 'row',
    position: 'relative',
  },
  stepNum: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.brand.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  stepNumText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text.inverse,
  },
  stepContent: {
    flex: 1,
    paddingTop: 4,
  },
  stepTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  stepDesc: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  stepConnector: {
    position: 'absolute',
    left: 23,
    top: 52,
    width: 2,
    height: 32,
    backgroundColor: colors.border.light,
  },
  // FAQ
  faqCard: {
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  faqQuestion: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    flex: 1,
  },
  faqAnswer: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 22,
    paddingLeft: 28,
  },
  faqMoreLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingTop: spacing.md,
  },
  faqMoreText: {
    fontSize: fontSize.sm,
    color: colors.brand.primary,
    fontWeight: fontWeight.medium,
  },
  // CTA
  cta: {
    backgroundColor: `${colors.brand.primary}15`,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing['3xl'],
    alignItems: 'center',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: `${colors.brand.primary}30`,
  },
  ctaIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.brand.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  ctaTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  ctaSubtitle: {
    fontSize: fontSize.md,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
});
