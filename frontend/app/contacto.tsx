import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '@/src/utils/theme';
import { Header } from '@/src/components/layout/Header';
import { Footer } from '@/src/components/layout/Footer';
import { Button, Input, Card } from '@/src/components/ui';
import { APP_NAME } from '@/src/constants';

export default function ContactoPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name || !email || !message) {
      Alert.alert('Error', 'Por favor completa todos los campos requeridos');
      return;
    }
    
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
    
    Alert.alert(
      'Mensaje Enviado',
      'Hemos recibido tu mensaje. Te responderemos lo antes posible.',
      [{ text: 'OK', onPress: () => {
        setName('');
        setEmail('');
        setSubject('');
        setMessage('');
      }}]
    );
  };

  const contactMethods = [
    { icon: 'mail', title: 'Email', value: 'soporte@tramitly.mx', action: () => Linking.openURL('mailto:soporte@tramitly.mx') },
    { icon: 'call', title: 'Teléfono', value: '+52 55 1234 5678', action: () => Linking.openURL('tel:+525512345678') },
    { icon: 'time', title: 'Horario', value: 'Lun-Vie 9:00-18:00', action: null },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Header showBack />
      
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="chatbubbles" size={40} color={colors.text.inverse} />
        </View>
        <Text style={styles.heroTitle}>Contáctanos</Text>
        <Text style={styles.heroSubtitle}>
          ¿Tienes alguna pregunta o necesitas ayuda? Estamos aquí para ti.
        </Text>
      </View>

      {/* Contact Methods */}
      <View style={styles.methodsSection}>
        {contactMethods.map((method, i) => (
          <Card key={i} onPress={method.action || undefined} style={styles.methodCard}>
            <View style={styles.methodIcon}>
              <Ionicons name={method.icon as any} size={24} color={colors.brand.primary} />
            </View>
            <View style={styles.methodContent}>
              <Text style={styles.methodTitle}>{method.title}</Text>
              <Text style={styles.methodValue}>{method.value}</Text>
            </View>
            {method.action && <Ionicons name="chevron-forward" size={20} color={colors.text.muted} />}
          </Card>
        ))}
      </View>

      {/* Contact Form */}
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Envíanos un Mensaje</Text>
        <Text style={styles.sectionSubtitle}>Completa el formulario y te responderemos lo antes posible</Text>
        
        <Input
          label="Nombre *"
          value={name}
          onChangeText={setName}
          placeholder="Tu nombre"
          icon="person-outline"
        />
        <Input
          label="Email *"
          value={email}
          onChangeText={setEmail}
          placeholder="tu@correo.com"
          icon="mail-outline"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Input
          label="Asunto"
          value={subject}
          onChangeText={setSubject}
          placeholder="Asunto de tu mensaje"
          icon="document-text-outline"
        />
        <Input
          label="Mensaje *"
          value={message}
          onChangeText={setMessage}
          placeholder="Escribe tu mensaje aquí..."
          icon="chatbubble-outline"
          multiline
          numberOfLines={4}
        />
        
        <Button title="Enviar Mensaje" onPress={handleSubmit} loading={loading} size="lg" fullWidth />
      </View>

      {/* Office Location */}
      <View style={styles.locationSection}>
        <Text style={styles.sectionTitle}>Nuestra Ubicación</Text>
        <Card style={styles.locationCard}>
          <View style={styles.locationHeader}>
            <Ionicons name="location" size={24} color={colors.brand.primary} />
            <Text style={styles.locationTitle}>{APP_NAME} HQ</Text>
          </View>
          <Text style={styles.locationAddress}>
            Av. Paseo de la Reforma 250{"\n"}
            Col. Juárez, Cuauhtémoc{"\n"}
            CDMX, México 06600
          </Text>
        </Card>
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
  methodsSection: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: `${colors.brand.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  methodContent: {
    flex: 1,
  },
  methodTitle: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  methodValue: {
    fontSize: fontSize.base,
    color: colors.text.primary,
    fontWeight: fontWeight.medium,
  },
  formSection: {
    padding: spacing.lg,
    backgroundColor: colors.bg.secondary,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
  locationSection: {
    padding: spacing.lg,
  },
  locationCard: {
    marginTop: spacing.md,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  locationTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  locationAddress: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
    lineHeight: 24,
  },
});
