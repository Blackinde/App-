import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Switch, Modal, Alert, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '@/src/utils/theme';
import { Button, Card, Input } from '@/src/components/ui';
import { formatCurrency, formatDate } from '@/src/utils/formatters';
import { Service } from '@/src/types';
import { SERVICE_CATEGORIES } from '@/src/constants';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

// Mock integrations status for services
const SERVICE_INTEGRATIONS: Record<string, { hasIntegration: boolean; mode: 'mock' | 'real' | null; status: 'active' | 'inactive' | null }> = {
  'historial-laboral-imss': { hasIntegration: true, mode: 'mock', status: 'active' },
  'semanas-cotizadas-imss': { hasIntegration: true, mode: 'mock', status: 'active' },
  'verificacion-curp': { hasIntegration: true, mode: 'mock', status: 'inactive' },
  'verificacion-nss': { hasIntegration: false, mode: null, status: null },
  'constancia-fiscal-sat': { hasIntegration: true, mode: 'mock', status: 'active' },
  'consulta-infonavit': { hasIntegration: false, mode: null, status: null },
};

export default function AdminServiciosPage() {
  const insets = useSafeAreaInsets();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/services?active_only=false`);
      setServices(response.data);
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadServices();
    setRefreshing(false);
  };

  const toggleServiceActive = async (service: Service) => {
    try {
      const token = await AsyncStorage.getItem('tramitly_token');
      await axios.put(
        `${API_URL}/api/services/${service.id}`,
        { ...service, is_active: !service.is_active },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await loadServices();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Error al actualizar');
    }
  };

  const getCategoryName = (categoryId: string) => {
    return SERVICE_CATEGORIES.find(c => c.id === categoryId)?.name || categoryId;
  };

  const getCategoryIcon = (categoryId: string) => {
    return SERVICE_CATEGORIES.find(c => c.id === categoryId)?.icon || 'folder';
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Gestión de Servicios</Text>
        <Text style={styles.count}>{services.length} servicios</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.brand.primary}
          />
        }
      >
        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={colors.brand.primary} />
          </View>
        ) : (
          services.map((service) => (
            <TouchableOpacity
              key={service.id}
              style={[styles.serviceCard, !service.is_active && styles.serviceCardInactive]}
              onPress={() => {
                setSelectedService(service);
                setModalVisible(true);
              }}
            >
              <View style={styles.serviceHeader}>
                <View style={[
                  styles.serviceIcon,
                  { backgroundColor: service.is_active ? `${colors.brand.primary}20` : `${colors.text.muted}20` }
                ]}>
                  <Ionicons
                    name={getCategoryIcon(service.category) as any}
                    size={24}
                    color={service.is_active ? colors.brand.primary : colors.text.muted}
                  />
                </View>
                <View style={styles.serviceInfo}>
                  <Text style={[styles.serviceName, !service.is_active && styles.textInactive]}>
                    {service.name}
                  </Text>
                  <Text style={styles.serviceCategory}>{getCategoryName(service.category)}</Text>
                </View>
                <Switch
                  value={service.is_active}
                  onValueChange={() => toggleServiceActive(service)}
                  trackColor={{ false: colors.bg.tertiary, true: `${colors.brand.primary}50` }}
                  thumbColor={service.is_active ? colors.brand.primary : colors.text.muted}
                />
              </View>
              
              <View style={styles.serviceFooter}>
                <View style={styles.serviceStat}>
                  <Text style={styles.serviceStatLabel}>Precio</Text>
                  <Text style={[styles.serviceStatValue, !service.is_active && styles.textInactive]}>
                    {formatCurrency(service.price)}
                  </Text>
                </View>
                <View style={styles.serviceStat}>
                  <Text style={styles.serviceStatLabel}>Tiempo</Text>
                  <Text style={styles.serviceStatValue}>{service.estimated_time}</Text>
                </View>
              </View>
              
              {/* Integration Status */}
              {(() => {
                const integration = SERVICE_INTEGRATIONS[service.slug];
                return (
                  <View style={styles.integrationStatus}>
                    {integration?.hasIntegration ? (
                      <>
                        <View style={[
                          styles.integrationDot,
                          { backgroundColor: integration.status === 'active' ? colors.status.success : colors.status.warning }
                        ]} />
                        <Text style={styles.integrationText}>
                          API {integration.mode === 'mock' ? 'Mock' : 'Real'} - {integration.status === 'active' ? 'Activa' : 'Inactiva'}
                        </Text>
                      </>
                    ) : (
                      <>
                        <Ionicons name="warning" size={14} color={colors.status.warning} />
                        <Text style={styles.integrationTextWarning}>Sin integración configurada</Text>
                      </>
                    )}
                  </View>
                );
              })()}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Service Detail Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Detalle del Servicio</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>
          
          {selectedService && (
            <ScrollView contentContainerStyle={styles.modalContent}>
              <View style={styles.modalServiceHeader}>
                <View style={styles.modalIcon}>
                  <Ionicons
                    name={getCategoryIcon(selectedService.category) as any}
                    size={32}
                    color={colors.brand.primary}
                  />
                </View>
                <Text style={styles.modalServiceName}>{selectedService.name}</Text>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>{getCategoryName(selectedService.category)}</Text>
                </View>
              </View>

              <Card style={styles.modalCard}>
                <Text style={styles.cardTitle}>Descripción</Text>
                <Text style={styles.description}>{selectedService.description}</Text>
              </Card>

              <Card style={styles.modalCard}>
                <Text style={styles.cardTitle}>Detalles</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Slug:</Text>
                  <Text style={styles.detailValue}>{selectedService.slug}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Precio:</Text>
                  <Text style={styles.detailValue}>{formatCurrency(selectedService.price)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Tiempo Est.:</Text>
                  <Text style={styles.detailValue}>{selectedService.estimated_time}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Estado:</Text>
                  <Text style={[
                    styles.detailValue,
                    { color: selectedService.is_active ? colors.status.success : colors.status.error }
                  ]}>
                    {selectedService.is_active ? 'Activo' : 'Inactivo'}
                  </Text>
                </View>
              </Card>

              <Card style={styles.modalCard}>
                <Text style={styles.cardTitle}>Requisitos</Text>
                {selectedService.requirements.map((req, i) => (
                  <View key={i} style={styles.reqItem}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.status.success} />
                    <Text style={styles.reqText}>{req}</Text>
                  </View>
                ))}
              </Card>

              <Card style={styles.modalCard}>
                <Text style={styles.cardTitle}>Campos Requeridos</Text>
                <View style={styles.fieldsWrap}>
                  {selectedService.required_fields.map((field, i) => (
                    <View key={i} style={styles.fieldBadge}>
                      <Text style={styles.fieldText}>{field}</Text>
                    </View>
                  ))}
                </View>
              </Card>

              <View style={styles.modalActions}>
                <Button
                  title={selectedService.is_active ? 'Desactivar' : 'Activar'}
                  variant={selectedService.is_active ? 'danger' : 'primary'}
                  onPress={() => {
                    toggleServiceActive(selectedService);
                    setModalVisible(false);
                  }}
                  fullWidth
                />
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  count: {
    fontSize: fontSize.sm,
    color: colors.text.muted,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  loading: {
    padding: spacing['3xl'],
    alignItems: 'center',
  },
  serviceCard: {
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  serviceCardInactive: {
    opacity: 0.7,
    borderColor: colors.text.muted + '30',
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  serviceIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  serviceCategory: {
    fontSize: fontSize.xs,
    color: colors.text.muted,
    marginTop: 2,
  },
  textInactive: {
    color: colors.text.muted,
  },
  serviceFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
    paddingTop: spacing.md,
  },
  serviceStat: {
    flex: 1,
  },
  serviceStatLabel: {
    fontSize: fontSize.xs,
    color: colors.text.muted,
    marginBottom: 2,
  },
  serviceStatValue: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  modalContent: {
    padding: spacing.lg,
  },
  modalServiceHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  modalIcon: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.xl,
    backgroundColor: `${colors.brand.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalServiceName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  categoryBadge: {
    backgroundColor: `${colors.brand.primary}15`,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  categoryBadgeText: {
    fontSize: fontSize.xs,
    color: colors.brand.primary,
    fontWeight: fontWeight.medium,
  },
  modalCard: {
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: fontSize.sm,
    color: colors.text.muted,
    marginBottom: spacing.md,
    fontWeight: fontWeight.semibold,
  },
  description: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  detailLabel: {
    fontSize: fontSize.sm,
    color: colors.text.muted,
  },
  detailValue: {
    fontSize: fontSize.sm,
    color: colors.text.primary,
    fontWeight: fontWeight.medium,
  },
  reqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  reqText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    flex: 1,
  },
  fieldsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  fieldBadge: {
    backgroundColor: colors.bg.tertiary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  fieldText: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
  },
  modalActions: {
    marginTop: spacing.lg,
  },
  integrationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  integrationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  integrationText: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
  },
  integrationTextWarning: {
    fontSize: fontSize.xs,
    color: colors.status.warning,
  },
});
