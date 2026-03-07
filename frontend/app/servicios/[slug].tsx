import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();
  const { getServiceBySlug } = useServicesStore();
  const { createOrder } = useOrdersStore();
  const { user, isAuthenticated, refreshUser } = useAuthStore();
  
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadService();
  }, [slug]);

  useEffect(() => {
    if (isAuthenticated && user && service) {
      const prefilled: Record<string, string> = {};
      if (service.required_fields.includes('name')) prefilled.name = user.name || '';
      if (service.required_fields.includes('email')) prefilled.email = user.email || '';
      setFormData(prev => ({ ...prefilled, ...prev }));
    }
  }, [isAuthenticated, user, service]);

  const loadService = async () => {
    if (!slug) return;
    const data = await getServiceBySlug(slug);
    setService(data);
    setLoading(false);
  };

  const categoryConfig = service ? SERVICE_CATEGORIES.find(c => c.id === service.category) : null;

  const validate = () => {
    if (!service) return false;
    const newErrors: Record<string, string> = {};
    service.required_fields.forEach(field => {
      if (!formData[field]?.trim()) {
        newErrors[field] = `${FIELD_LABELS[field] || field} es requerido`;
      }
    });
    if (formData.curp && formData.curp.length !== 18) {
      newErrors.curp = 'El CURP debe tener 18 caracteres';
    }
    if (formData.nss && formData.nss.length !== 11) {
      newErrors.nss = 'El NSS debe tener 11 dígitos';
    }
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Correo electrónico inválido';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRequestService = () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Inicia Sesión',
        'Necesitas una cuenta para solicitar este servicio',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Iniciar Sesión', onPress: () => router.push('/login') },
          { text: 'Crear Cuenta', onPress: () => router.push('/register') },
        ]
      );
      return;
    }
    
    if (user && service && user.balance < service.price) {
      Alert.alert(
        'Saldo Insuficiente',
        `Necesitas ${formatCurrency(service.price)} para este servicio. Tu saldo actual es ${formatCurrency(user.balance)}.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Recargar Saldo', onPress: () => router.push('/dashboard/saldo') },
        ]
      );
      return;
    }
    
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!validate() || !service) return;
    
    setSubmitting(true);
    try {
      const order = await createOrder(service.id, formData);
      await refreshUser();
      Alert.alert(
        'Solicitud Creada',
        `Tu solicitud ${order.order_number} ha sido procesada exitosamente.`,
        [{ text: 'Ver Pedido', onPress: () => router.push(`/dashboard/pedidos`) }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.brand.primary} />
      </View>
    );
  }

  if (!service) {
    return (
      <View style={styles.errorContainer}>
        <Header showBack />
        <View style={styles.errorContent}>
          <Ionicons name="alert-circle" size={64} color={colors.status.error} />
          <Text style={styles.errorTitle}>Servicio no encontrado</Text>
          <Button title="Ver Servicios" onPress={() => router.push('/servicios')} />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Header showBack />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
        {/* Service Header */}
        <View style={styles.header}>
          <View style={styles.categoryBadge}>
            <Ionicons name={categoryConfig?.icon as any || 'folder'} size={14} color={colors.brand.primary} />
            <Text style={styles.categoryText}>{categoryConfig?.name || service.category}</Text>
          </View>
          <Text style={styles.title}>{service.name}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatCurrency(service.price)}</Text>
            <View style={styles.timeBadge}>
              <Ionicons name="time-outline" size={14} color={colors.text.secondary} />
              <Text style={styles.timeText}>{service.estimated_time}</Text>
            </View>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Descripción</Text>
          <Text style={styles.description}>{service.description}</Text>
        </View>

        {/* Requirements */}
        {service.requirements.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Requisitos</Text>
            {service.requirements.map((req, i) => (
              <View key={i} style={styles.listItem}>
                <Ionicons name="checkmark-circle" size={18} color={colors.status.success} />
                <Text style={styles.listText}>{req}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Balance Info */}
        {isAuthenticated && user && (
          <Card style={styles.balanceCard}>
            <View style={styles.balanceRow}>
              <View>
                <Text style={styles.balanceLabel}>Tu saldo disponible</Text>
                <Text style={styles.balanceValue}>{formatCurrency(user.balance)}</Text>
              </View>
              {user.balance >= service.price ? (
                <View style={styles.balanceOk}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.status.success} />
                  <Text style={styles.balanceOkText}>Saldo suficiente</Text>
                </View>
              ) : (
                <Button title="Recargar" onPress={() => router.push('/dashboard/saldo')} size="sm" />
              )}
            </View>
          </Card>
        )}

        {/* Request Form */}
        {showForm ? (
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Datos para la Consulta</Text>
            <Text style={styles.formHint}>Completa todos los campos para procesar tu solicitud</Text>
            
            {service.required_fields.map(field => (
              <Input
                key={field}
                label={FIELD_LABELS[field] || field}
                value={formData[field] || ''}
                onChangeText={(text) => setFormData(prev => ({ ...prev, [field]: text }))}
                placeholder={`Ingresa tu ${(FIELD_LABELS[field] || field).toLowerCase()}`}
                icon={FIELD_ICONS[field] as any}
                error={errors[field]}
                autoCapitalize={field === 'email' ? 'none' : field === 'curp' || field === 'rfc' ? 'characters' : 'words'}
                keyboardType={field === 'email' ? 'email-address' : field === 'phone' || field === 'nss' ? 'phone-pad' : 'default'}
              />
            ))}
            
            <Button title="Confirmar y Pagar" onPress={handleSubmit} loading={submitting} size="lg" fullWidth />
            <Button title="Cancelar" onPress={() => setShowForm(false)} variant="ghost" fullWidth />
          </View>
        ) : (
          <View style={styles.ctaSection}>
            <Button
              title="Solicitar Este Servicio"
              onPress={handleRequestService}
              size="lg"
              fullWidth
              icon={<Ionicons name="flash" size={20} color={colors.text.inverse} />}
            />
          </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg.primary,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  errorContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  errorTitle: {
    fontSize: fontSize.lg,
    color: colors.text.secondary,
  },
  header: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    backgroundColor: `${colors.brand.primary}15`,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginBottom: spacing.md,
  },
  categoryText: {
    fontSize: fontSize.sm,
    color: colors.brand.primary,
    fontWeight: fontWeight.medium,
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.brand.primary,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.bg.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  timeText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  section: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  description: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
    lineHeight: 24,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  listText: {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  balanceCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  balanceOk: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  balanceOkText: {
    fontSize: fontSize.sm,
    color: colors.status.success,
    fontWeight: fontWeight.medium,
  },
  formSection: {
    padding: spacing.lg,
  },
  formHint: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
  ctaSection: {
    padding: spacing.lg,
  },
});
