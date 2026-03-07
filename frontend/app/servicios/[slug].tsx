import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '@/src/utils/theme';
import { Header } from '@/src/components/layout/Header';
import { Button, Input, Card } from '@/src/components/ui';
import { useServicesStore } from '@/src/store/servicesStore';
import { useOrdersStore } from '@/src/store/ordersStore';
import { useAuthStore } from '@/src/store/authStore';
import { Service } from '@/src/types';
import { formatCurrency } from '@/src/utils/formatters';
import { FIELD_LABELS, FIELD_ICONS, SERVICE_CATEGORIES } from '@/src/constants';

export default function ServiceDetailPage() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { getServiceBySlug } = useServicesStore();
  const { createOrder } = useOrdersStore();
  const { isAuthenticated, user, refreshUser } = useAuthStore();
  
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadService();
  }, [slug]);

  const loadService = async () => {
    if (!slug) return;
    setLoading(true);
    const data = await getServiceBySlug(slug);
    setService(data);
    if (data) {
      const initialForm: Record<string, string> = {};
      data.required_fields.forEach(field => {
        initialForm[field] = '';
      });
      setFormData(initialForm);
    }
    setLoading(false);
  };

  const validate = () => {
    if (!service) return false;
    const newErrors: Record<string, string> = {};
    service.required_fields.forEach(field => {
      if (!formData[field]?.trim()) {
        newErrors[field] = `${FIELD_LABELS[field] || field} es requerido`;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Inicia Sesión',
        'Necesitas una cuenta para solicitar este servicio',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Iniciar Sesión', onPress: () => router.push('/login') }
        ]
      );
      return;
    }

    if (!validate() || !service) return;

    // Check balance
    if ((user?.balance || 0) < service.price) {
      Alert.alert(
        'Saldo Insuficiente',
        `Necesitas $${service.price.toFixed(2)} MXN para este servicio. Tu saldo actual es ${formatCurrency(user?.balance || 0)}`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Recargar Saldo', onPress: () => router.push('/dashboard/saldo') }
        ]
      );
      return;
    }

    setSubmitting(true);
    try {
      const order = await createOrder(service.id, formData);
      await refreshUser();
      Alert.alert(
        '¡Pedido Creado!',
        `Tu orden ${order.order_number} ha sido creada exitosamente. Recibirás tus resultados en ${service.estimated_time}.`,
        [{ text: 'Ver Mis Pedidos', onPress: () => router.push('/dashboard/pedidos') }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header showBack showAuth />
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.brand.primary} />
        </View>
      </View>
    );
  }

  if (!service) {
    return (
      <View style={styles.container}>
        <Header showBack showAuth />
        <View style={styles.notFound}>
          <Ionicons name="alert-circle" size={48} color={colors.text.muted} />
          <Text style={styles.notFoundText}>Servicio no encontrado</Text>
          <Button title="Ver Todos los Servicios" onPress={() => router.push('/servicios')} variant="outline" />
        </View>
      </View>
    );
  }

  const categoryConfig = SERVICE_CATEGORIES.find(c => c.id === service.category);

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Header showBack showAuth />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Service Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name={categoryConfig?.icon as any || 'document'} size={32} color={colors.brand.primary} />
          </View>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{categoryConfig?.name || service.category}</Text>
          </View>
          <Text style={styles.title}>{service.name}</Text>
          <Text style={styles.description}>{service.description}</Text>
        </View>

        {/* Info Cards */}
        <View style={styles.infoRow}>
          <View style={styles.infoCard}>
            <Ionicons name="cash" size={20} color={colors.brand.primary} />
            <Text style={styles.infoLabel}>Precio</Text>
            <Text style={styles.infoValue}>{formatCurrency(service.price)}</Text>
          </View>
          <View style={styles.infoCard}>
            <Ionicons name="time" size={20} color={colors.brand.primary} />
            <Text style={styles.infoLabel}>Tiempo Estimado</Text>
            <Text style={styles.infoValue}>{service.estimated_time}</Text>
          </View>
        </View>

        {/* Requirements */}
        <Card title="Requisitos" icon="list-outline" style={styles.card}>
          {service.requirements.map((req, i) => (
            <View key={i} style={styles.requirementItem}>
              <Ionicons name="checkmark-circle" size={18} color={colors.status.success} />
              <Text style={styles.requirementText}>{req}</Text>
            </View>
          ))}
        </Card>

        {/* Form */}
        <Card title="Datos del Solicitante" icon="person-outline" style={styles.card}>
          {service.required_fields.map((field) => (
            <Input
              key={field}
              label={FIELD_LABELS[field] || field}
              value={formData[field] || ''}
              onChangeText={(text) => setFormData({ ...formData, [field]: text })}
              placeholder={`Ingresa tu ${FIELD_LABELS[field]?.toLowerCase() || field}`}
              icon={FIELD_ICONS[field] as any}
              error={errors[field]}
              autoCapitalize={field === 'email' ? 'none' : field === 'name' ? 'words' : 'characters'}
              keyboardType={field === 'email' ? 'email-address' : field === 'phone' ? 'phone-pad' : 'default'}
            />
          ))}
        </Card>

        {/* Balance Info */}
        {isAuthenticated && user && (
          <View style={styles.balanceInfo}>
            <Ionicons name="wallet" size={18} color={colors.text.secondary} />
            <Text style={styles.balanceText}>
              Tu saldo: <Text style={styles.balanceAmount}>{formatCurrency(user.balance)}</Text>
            </Text>
          </View>
        )}

        {/* Submit Button */}
        <Button
          title={isAuthenticated ? `Solicitar por ${formatCurrency(service.price)}` : 'Inicia Sesión para Solicitar'}
          onPress={handleSubmit}
          loading={submitting}
          size="lg"
          fullWidth
        />

        {!isAuthenticated && (
          <Text style={styles.loginHint}>
            ¿No tienes cuenta?{' '}
            <Text style={styles.loginLink} onPress={() => router.push('/register')}>Regístrate gratis</Text>
          </Text>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  content: {
    padding: spacing.lg,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  notFoundText: {
    fontSize: fontSize.lg,
    color: colors.text.muted,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.xl,
    backgroundColor: `${colors.brand.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  categoryBadge: {
    backgroundColor: `${colors.brand.primary}15`,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginBottom: spacing.md,
  },
  categoryText: {
    fontSize: fontSize.xs,
    color: colors.brand.primary,
    fontWeight: fontWeight.semibold,
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  infoRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  infoCard: {
    flex: 1,
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  infoLabel: {
    fontSize: fontSize.xs,
    color: colors.text.muted,
    marginTop: spacing.xs,
  },
  infoValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginTop: 2,
  },
  card: {
    marginBottom: spacing.lg,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  requirementText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    flex: 1,
  },
  balanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  balanceText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  balanceAmount: {
    fontWeight: fontWeight.bold,
    color: colors.brand.primary,
  },
  loginHint: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  loginLink: {
    color: colors.brand.primary,
    fontWeight: fontWeight.medium,
  },
});
