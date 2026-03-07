import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '@/src/utils/theme';
import { useServicesStore, Service } from '@/src/store/servicesStore';
import { useOrdersStore } from '@/src/store/ordersStore';
import { useAuthStore } from '@/src/store/authStore';
import { Button } from '@/src/components/Button';
import { Input } from '@/src/components/Input';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

const fieldLabels: Record<string, string> = {
  full_name: 'Nombre Completo',
  curp: 'CURP',
  nss: 'Número de Seguro Social (NSS)',
  rfc: 'RFC',
  email: 'Correo Electrónico',
  phone: 'Teléfono',
  date_of_birth: 'Fecha de Nacimiento',
  address: 'Dirección',
  notes: 'Notas adicionales',
};

const fieldIcons: Record<string, string> = {
  full_name: 'person-outline',
  curp: 'card-outline',
  nss: 'shield-checkmark-outline',
  rfc: 'document-text-outline',
  email: 'mail-outline',
  phone: 'call-outline',
  date_of_birth: 'calendar-outline',
  address: 'location-outline',
  notes: 'create-outline',
};

export default function ServiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated } = useAuthStore();
  const { createOrder } = useOrdersStore();
  
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchService();
  }, [id]);

  useEffect(() => {
    // Pre-fill user data if authenticated
    if (isAuthenticated && user && service) {
      const prefilled: Record<string, string> = {};
      if (service.required_fields.includes('full_name')) prefilled.full_name = user.full_name || '';
      if (service.required_fields.includes('email')) prefilled.email = user.email || '';
      if (service.required_fields.includes('phone')) prefilled.phone = user.phone || '';
      setFormData(prev => ({ ...prefilled, ...prev }));
    }
  }, [isAuthenticated, user, service]);

  const fetchService = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/services/${id}`);
      setService(response.data);
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar el servicio');
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    if (!service) return false;
    const newErrors: Record<string, string> = {};
    service.required_fields.forEach(field => {
      if (!formData[field]?.trim()) {
        newErrors[field] = `${fieldLabels[field] || field} es requerido`;
      }
    });
    // CURP validation
    if (formData.curp && formData.curp.length !== 18) {
      newErrors.curp = 'El CURP debe tener 18 caracteres';
    }
    // NSS validation
    if (formData.nss && formData.nss.length !== 11) {
      newErrors.nss = 'El NSS debe tener 11 dígitos';
    }
    // Email validation
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Correo electrónico inválido';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || !service) return;
    
    setSubmitting(true);
    try {
      const order = await createOrder(service.id, formData);
      Alert.alert(
        'Solicitud Creada',
        `Tu solicitud ${order.order_number} ha sido creada. Procede al pago para continuar.`,
        [{ text: 'Ver Pedido', onPress: () => router.push(`/order/${order.id}`) }]
      );
    } catch (error: any) {
      Alert.alert('Error', 'No se pudo crear la solicitud. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!service) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color={colors.error} />
        <Text style={styles.errorText}>Servicio no encontrado</Text>
        <Button title="Volver" onPress={() => router.back()} variant="outline" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
        {/* Service Info */}
        <View style={styles.header}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{service.category}</Text>
          </View>
          <Text style={styles.title}>{service.name}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>${service.price.toLocaleString('es-MX')} MXN</Text>
            <View style={styles.deliveryBadge}>
              <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.deliveryText}>{service.delivery_time}</Text>
            </View>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Descripción</Text>
          <Text style={styles.description}>{service.full_description}</Text>
        </View>

        {/* Requirements */}
        {service.requirements && service.requirements.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Requisitos</Text>
            {service.requirements.map((req, i) => (
              <View key={i} style={styles.listItem}>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <Text style={styles.listText}>{req}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Notes */}
        {service.notes && service.notes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notas importantes</Text>
            {service.notes.map((note, i) => (
              <View key={i} style={styles.listItem}>
                <Ionicons name="information-circle" size={20} color={colors.info} />
                <Text style={styles.listText}>{note}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Request Form */}
        {showForm ? (
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Formulario de Solicitud</Text>
            <Text style={styles.formSubtitle}>Completa todos los campos requeridos</Text>
            
            {service.required_fields.map(field => (
              <Input
                key={field}
                label={fieldLabels[field] || field}
                value={formData[field] || ''}
                onChangeText={(text) => setFormData(prev => ({ ...prev, [field]: text }))}
                placeholder={`Ingresa tu ${fieldLabels[field]?.toLowerCase() || field}`}
                icon={fieldIcons[field] as any}
                error={errors[field]}
                autoCapitalize={field === 'email' ? 'none' : field === 'curp' || field === 'rfc' ? 'characters' : 'words'}
                keyboardType={field === 'email' ? 'email-address' : field === 'phone' || field === 'nss' ? 'phone-pad' : 'default'}
              />
            ))}
            
            <Button
              title="Enviar Solicitud"
              onPress={handleSubmit}
              loading={submitting}
              size="large"
            />
            <Button
              title="Cancelar"
              onPress={() => setShowForm(false)}
              variant="ghost"
            />
          </View>
        ) : (
          <View style={styles.ctaSection}>
            <Button
              title="Solicitar Ahora"
              onPress={() => setShowForm(true)}
              size="large"
              icon={<Ionicons name="arrow-forward" size={20} color={colors.background} />}
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
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.lg,
    gap: spacing.md,
  },
  errorText: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
  },
  header: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 217, 255, 0.15)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginBottom: spacing.sm,
  },
  categoryText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
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
    color: colors.primary,
  },
  deliveryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.backgroundCard,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  deliveryText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  section: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  description: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
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
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  formSection: {
    padding: spacing.lg,
  },
  formSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  ctaSection: {
    padding: spacing.lg,
  },
});
