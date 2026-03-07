import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '@/src/utils/theme';
import { Header } from '@/src/components/layout/Header';
import { Footer } from '@/src/components/layout/Footer';
import { APP_NAME } from '@/src/constants';

const faqs = [
  {
    category: 'General',
    questions: [
      {
        q: '¿Qué es Tramitly?',
        a: `${APP_NAME} es una plataforma digital que te permite realizar consultas y trámites gubernamentales de forma rápida y segura, sin necesidad de acudir a oficinas presenciales.`,
      },
      {
        q: '¿Qué tipo de servicios ofrecen?',
        a: 'Ofrecemos consultas de historial laboral IMSS, semanas cotizadas, verificación de CURP y NSS, constancias fiscales del SAT, y más servicios relacionados con trámites gubernamentales.',
      },
      {
        q: '¿Necesito crear una cuenta para usar el servicio?',
        a: 'Sí, necesitas crear una cuenta gratuita para poder solicitar servicios y acceder a tus documentos. El registro es rápido y solo toma unos segundos.',
      },
    ],
  },
  {
    category: 'Pagos y Saldo',
    questions: [
      {
        q: '¿Cómo funciona el sistema de saldo?',
        a: 'Nuestro sistema funciona con saldo prepagado. Recargas tu cuenta mediante transferencia bancaria y ese saldo lo puedes usar para pagar cualquier servicio del catálogo.',
      },
      {
        q: '¿Cuáles son los métodos de pago aceptados?',
        a: 'Actualmente aceptamos transferencias bancarias. Próximamente integraremos más métodos como tarjetas de crédito, PayPal y Mercado Pago.',
      },
      {
        q: '¿Puedo solicitar un reembolso?',
        a: 'Sí, si tu solicitud no puede ser procesada por razones ajenas a los datos proporcionados, el monto se reintegra automáticamente a tu saldo.',
      },
    ],
  },
  {
    category: 'Servicios y Tiempos',
    questions: [
      {
        q: '¿Cuánto tiempo tarda en procesarse mi solicitud?',
        a: 'El tiempo varía según el servicio. Algunas consultas son instantáneas (1-2 horas), mientras que otras pueden tomar 24-72 horas. Cada servicio muestra su tiempo estimado.',
      },
      {
        q: '¿Los documentos que recibo son oficiales?',
        a: 'Sí, toda la información proviene de consultas directas a las fuentes oficiales (IMSS, SAT, RENAPO, etc.). Los documentos son válidos para fines informativos y trámites.',
      },
      {
        q: '¿Qué pasa si hay un error en mi solicitud?',
        a: 'Si proporcionaste datos incorrectos, puedes crear una nueva solicitud. Si el error es de nuestro lado, te contactamos para resolverlo y, si aplica, realizamos un reembolso.',
      },
    ],
  },
  {
    category: 'Seguridad y Privacidad',
    questions: [
      {
        q: '¿Mis datos personales están seguros?',
        a: 'Absolutamente. Utilizamos encriptación de grado bancario para proteger tu información. No almacenamos datos sensibles más allá de lo necesario para procesar tu solicitud.',
      },
      {
        q: '¿Comparten mi información con terceros?',
        a: 'No. Tu información solo se usa para procesar tus solicitudes y nunca se comparte, vende o transfiere a terceros.',
      },
      {
        q: '¿Cómo puedo eliminar mi cuenta?',
        a: 'Puedes solicitar la eliminación de tu cuenta y todos tus datos contactando a nuestro equipo de soporte. El proceso se completa en 48 horas.',
      },
    ],
  },
];

export default function FAQPage() {
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggleQuestion = (key: string) => {
    setExpanded(expanded === key ? null : key);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Header showBack />
      
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="help-circle" size={40} color={colors.text.inverse} />
        </View>
        <Text style={styles.heroTitle}>Preguntas Frecuentes</Text>
        <Text style={styles.heroSubtitle}>Encuentra respuestas a las dudas más comunes sobre {APP_NAME}</Text>
      </View>

      <View style={styles.content}>
        {faqs.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.category}</Text>
            {section.questions.map((item, itemIndex) => {
              const key = `${sectionIndex}-${itemIndex}`;
              const isExpanded = expanded === key;
              return (
                <TouchableOpacity
                  key={itemIndex}
                  style={styles.faqCard}
                  onPress={() => toggleQuestion(key)}
                  activeOpacity={0.8}
                >
                  <View style={styles.faqHeader}>
                    <Text style={styles.faqQuestion}>{item.q}</Text>
                    <Ionicons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color={colors.text.muted}
                    />
                  </View>
                  {isExpanded && <Text style={styles.faqAnswer}>{item.a}</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      <View style={styles.contact}>
        <Text style={styles.contactTitle}>¿No encontraste lo que buscabas?</Text>
        <Text style={styles.contactText}>Nuestro equipo de soporte está listo para ayudarte</Text>
        <View style={styles.contactInfo}>
          <View style={styles.contactItem}>
            <Ionicons name="mail" size={20} color={colors.brand.primary} />
            <Text style={styles.contactValue}>soporte@tramitly.mx</Text>
          </View>
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
    backgroundColor: colors.bg.secondary,
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.brand.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  heroTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  heroSubtitle: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  content: {
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.brand.primary,
    marginBottom: spacing.md,
  },
  faqCard: {
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
    flex: 1,
    paddingRight: spacing.md,
  },
  faqAnswer: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 22,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  contact: {
    padding: spacing.lg,
    paddingVertical: spacing['2xl'],
    backgroundColor: colors.bg.secondary,
    alignItems: 'center',
  },
  contactTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  contactText: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
  contactInfo: {
    gap: spacing.md,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  contactValue: {
    fontSize: fontSize.base,
    color: colors.text.primary,
  },
});
