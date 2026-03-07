import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Switch, Modal, Alert, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '@/src/utils/theme';
import { Button, Card, Input } from '@/src/components/ui';
import { formatCurrency } from '@/src/utils/formatters';
import { Service } from '@/src/types';
import { SERVICE_CATEGORIES } from '@/src/constants';
import { useIntegrationsStore } from '@/src/store/integrationsStore';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

const EMPTY_SERVICE = {
  name: '',
  slug: '',
  category: 'seguridad-social',
  description: '',
  short_description: '',
  price: 0,
  estimated_time: '24-48 horas',
  requirements: [''],
  required_fields: ['name', 'email'],
  is_active: true,
};

const AVAILABLE_FIELDS = [
  { id: 'name', label: 'Nombre' },
  { id: 'email', label: 'Email' },
  { id: 'curp', label: 'CURP' },
  { id: 'nss', label: 'NSS' },
  { id: 'rfc', label: 'RFC' },
  { id: 'phone', label: 'Teléfono' },
  { id: 'address', label: 'Dirección' },
  { id: 'birth_date', label: 'Fecha de Nacimiento' },
];

export default function AdminServiciosPage() {
  const insets = useSafeAreaInsets();
  const { getIntegrationForService } = useIntegrationsStore();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<typeof EMPTY_SERVICE>(EMPTY_SERVICE);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const token = await AsyncStorage.getItem('tramitly_token');
      const response = await axios.get(`${API_URL}/api/services?active_only=false`, {
        headers: { Authorization: `Bearer ${token}` }
      });
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

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleNewService = () => {
    setSelectedService(null);
    setFormData(EMPTY_SERVICE);
    setEditMode(true);
    setModalVisible(true);
  };

  const handleEditService = (service: Service) => {
    setSelectedService(service);
    setFormData({
      name: service.name,
      slug: service.slug,
      category: service.category,
      description: service.description,
      short_description: service.short_description || '',
      price: service.price,
      estimated_time: service.estimated_time,
      requirements: service.requirements.length > 0 ? service.requirements : [''],
      required_fields: service.required_fields,
      is_active: service.is_active,
    });
    setEditMode(true);
    setModalVisible(true);
  };

  const handleViewService = (service: Service) => {
    setSelectedService(service);
    setFormData({
      name: service.name,
      slug: service.slug,
      category: service.category,
      description: service.description,
      short_description: service.short_description || '',
      price: service.price,
      estimated_time: service.estimated_time,
      requirements: service.requirements,
      required_fields: service.required_fields,
      is_active: service.is_active,
    });
    setEditMode(false);
    setModalVisible(true);
  };

  const handleSaveService = async () => {
    // Validation
    if (!formData.name.trim()) {
      Alert.alert('Error', 'El nombre es requerido');
      return;
    }
    if (!formData.description.trim()) {
      Alert.alert('Error', 'La descripción es requerida');
      return;
    }
    if (formData.price <= 0) {
      Alert.alert('Error', 'El precio debe ser mayor a 0');
      return;
    }

    setSaving(true);
    try {
      const token = await AsyncStorage.getItem('tramitly_token');
      const slug = formData.slug || generateSlug(formData.name);
      
      const serviceData = {
        ...formData,
        slug,
        short_description: formData.short_description || formData.description.substring(0, 100),
        requirements: formData.requirements.filter(r => r.trim() !== ''),
      };

      if (selectedService) {
        // Update existing
        await axios.put(
          `${API_URL}/api/services/${selectedService.id}`,
          serviceData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        Alert.alert('Éxito', 'Servicio actualizado correctamente');
      } else {
        // Create new
        await axios.post(
          `${API_URL}/api/services`,
          serviceData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        Alert.alert('Éxito', 'Servicio creado correctamente');
      }

      await loadServices();
      setModalVisible(false);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Error al guardar el servicio');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteService = async () => {
    if (!selectedService) return;

    Alert.alert(
      'Eliminar Servicio',
      `¿Estás seguro de eliminar "${selectedService.name}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('tramitly_token');
              await axios.delete(`${API_URL}/api/services/${selectedService.id}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              Alert.alert('Éxito', 'Servicio eliminado');
              setModalVisible(false);
              await loadServices();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.detail || 'Error al eliminar');
            }
          }
        }
      ]
    );
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

  const addRequirement = () => {
    setFormData({ ...formData, requirements: [...formData.requirements, ''] });
  };

  const updateRequirement = (index: number, value: string) => {
    const updated = [...formData.requirements];
    updated[index] = value;
    setFormData({ ...formData, requirements: updated });
  };

  const removeRequirement = (index: number) => {
    const updated = formData.requirements.filter((_, i) => i !== index);
    setFormData({ ...formData, requirements: updated.length > 0 ? updated : [''] });
  };

  const toggleRequiredField = (fieldId: string) => {
    const current = formData.required_fields;
    if (current.includes(fieldId)) {
      setFormData({ ...formData, required_fields: current.filter(f => f !== fieldId) });
    } else {
      setFormData({ ...formData, required_fields: [...current, fieldId] });
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
        <View>
          <Text style={styles.title}>Gestión de Servicios</Text>
          <Text style={styles.count}>{services.length} servicios</Text>
        </View>
        <Button
          title="Agregar"
          onPress={handleNewService}
          size="sm"
          icon={<Ionicons name="add" size={18} color={colors.text.inverse} />}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand.primary} />
        }
      >
        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={colors.brand.primary} />
          </View>
        ) : services.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="grid-outline" size={64} color={colors.text.muted} />
            <Text style={styles.emptyTitle}>Sin servicios</Text>
            <Text style={styles.emptyText}>Crea tu primer servicio para comenzar</Text>
            <Button title="Crear Servicio" onPress={handleNewService} style={{ marginTop: spacing.lg }} />
          </View>
        ) : (
          services.map((service) => {
            const integration = getIntegrationForService(service.id);
            return (
              <TouchableOpacity
                key={service.id}
                style={[styles.serviceCard, !service.is_active && styles.serviceCardInactive]}
                onPress={() => handleViewService(service)}
                activeOpacity={0.7}
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
                <View style={styles.integrationStatus}>
                  {integration ? (
                    <>
                      <View style={[
                        styles.integrationDot,
                        { backgroundColor: integration.is_active ? colors.status.success : colors.status.warning }
                      ]} />
                      <Text style={styles.integrationText}>
                        API: {integration.name} ({integration.is_mock_mode ? 'Mock' : 'Real'})
                      </Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="warning" size={14} color={colors.status.warning} />
                      <Text style={styles.integrationTextWarning}>Sin integración configurada</Text>
                    </>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Service Form Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editMode ? (selectedService ? 'Editar Servicio' : 'Nuevo Servicio') : 'Detalle del Servicio'}
            </Text>
            <View style={styles.modalActions}>
              {!editMode && selectedService && (
                <Button
                  title="Editar"
                  variant="outline"
                  size="sm"
                  onPress={() => setEditMode(true)}
                />
              )}
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>
          </View>
          
          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            {editMode ? (
              <>
                <Input
                  label="Nombre del Servicio *"
                  value={formData.name}
                  onChangeText={(text) => {
                    setFormData({ 
                      ...formData, 
                      name: text,
                      slug: !selectedService ? generateSlug(text) : formData.slug
                    });
                  }}
                  placeholder="Ej: Historial Laboral IMSS"
                  icon="text-outline"
                />
                
                <Input
                  label="Slug (URL)"
                  value={formData.slug}
                  onChangeText={(text) => setFormData({ ...formData, slug: text })}
                  placeholder="historial-laboral-imss"
                  icon="link-outline"
                  autoCapitalize="none"
                />

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Categoría *</Text>
                  <View style={styles.categorySelector}>
                    {SERVICE_CATEGORIES.map((cat) => (
                      <TouchableOpacity
                        key={cat.id}
                        style={[styles.categoryOption, formData.category === cat.id && styles.categoryOptionActive]}
                        onPress={() => setFormData({ ...formData, category: cat.id })}
                      >
                        <Ionicons
                          name={cat.icon as any}
                          size={18}
                          color={formData.category === cat.id ? colors.text.inverse : colors.text.secondary}
                        />
                        <Text style={[
                          styles.categoryOptionText,
                          formData.category === cat.id && styles.categoryOptionTextActive
                        ]}>
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Descripción *</Text>
                  <TextInput
                    style={styles.textArea}
                    value={formData.description}
                    onChangeText={(text) => setFormData({ ...formData, description: text })}
                    placeholder="Descripción detallada del servicio"
                    placeholderTextColor={colors.text.muted}
                    multiline
                    numberOfLines={4}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Descripción Corta</Text>
                  <TextInput
                    style={[styles.textArea, { minHeight: 60 }]}
                    value={formData.short_description}
                    onChangeText={(text) => setFormData({ ...formData, short_description: text })}
                    placeholder="Breve descripción para mostrar en tarjetas"
                    placeholderTextColor={colors.text.muted}
                    multiline
                    numberOfLines={2}
                  />
                </View>

                <View style={styles.priceRow}>
                  <View style={{ flex: 1 }}>
                    <Input
                      label="Precio (MXN) *"
                      value={formData.price.toString()}
                      onChangeText={(text) => setFormData({ ...formData, price: parseFloat(text) || 0 })}
                      placeholder="299"
                      icon="cash-outline"
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Input
                      label="Tiempo Estimado"
                      value={formData.estimated_time}
                      onChangeText={(text) => setFormData({ ...formData, estimated_time: text })}
                      placeholder="24-48 horas"
                      icon="time-outline"
                    />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <View style={styles.formLabelRow}>
                    <Text style={styles.formLabel}>Requisitos</Text>
                    <TouchableOpacity onPress={addRequirement}>
                      <Ionicons name="add-circle" size={24} color={colors.brand.primary} />
                    </TouchableOpacity>
                  </View>
                  {formData.requirements.map((req, index) => (
                    <View key={index} style={styles.requirementRow}>
                      <TextInput
                        style={styles.requirementInput}
                        value={req}
                        onChangeText={(text) => updateRequirement(index, text)}
                        placeholder={`Requisito ${index + 1}`}
                        placeholderTextColor={colors.text.muted}
                      />
                      <TouchableOpacity onPress={() => removeRequirement(index)}>
                        <Ionicons name="trash-outline" size={20} color={colors.status.error} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Campos Requeridos del Formulario</Text>
                  <View style={styles.fieldsGrid}>
                    {AVAILABLE_FIELDS.map((field) => (
                      <TouchableOpacity
                        key={field.id}
                        style={[
                          styles.fieldChip,
                          formData.required_fields.includes(field.id) && styles.fieldChipActive
                        ]}
                        onPress={() => toggleRequiredField(field.id)}
                      >
                        <Ionicons
                          name={formData.required_fields.includes(field.id) ? 'checkbox' : 'square-outline'}
                          size={16}
                          color={formData.required_fields.includes(field.id) ? colors.brand.primary : colors.text.muted}
                        />
                        <Text style={[
                          styles.fieldChipText,
                          formData.required_fields.includes(field.id) && styles.fieldChipTextActive
                        ]}>
                          {field.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.toggleRow}>
                  <View style={styles.toggleInfo}>
                    <Text style={styles.toggleLabel}>Servicio Activo</Text>
                    <Text style={styles.toggleDesc}>Visible en el catálogo público</Text>
                  </View>
                  <Switch
                    value={formData.is_active}
                    onValueChange={(value) => setFormData({ ...formData, is_active: value })}
                    trackColor={{ false: colors.bg.tertiary, true: `${colors.brand.primary}50` }}
                    thumbColor={formData.is_active ? colors.brand.primary : colors.text.muted}
                  />
                </View>

                <Button
                  title={selectedService ? 'Guardar Cambios' : 'Crear Servicio'}
                  onPress={handleSaveService}
                  loading={saving}
                  size="lg"
                  fullWidth
                  style={{ marginTop: spacing.lg }}
                />

                {selectedService && (
                  <Button
                    title="Eliminar Servicio"
                    variant="danger"
                    onPress={handleDeleteService}
                    fullWidth
                    style={{ marginTop: spacing.md }}
                  />
                )}
              </>
            ) : selectedService && (
              <>
                <View style={styles.detailHeader}>
                  <View style={styles.detailIcon}>
                    <Ionicons
                      name={getCategoryIcon(selectedService.category) as any}
                      size={32}
                      color={colors.brand.primary}
                    />
                  </View>
                  <Text style={styles.detailName}>{selectedService.name}</Text>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>{getCategoryName(selectedService.category)}</Text>
                  </View>
                </View>

                <Card style={styles.detailCard}>
                  <Text style={styles.cardTitle}>Descripción</Text>
                  <Text style={styles.description}>{selectedService.description}</Text>
                </Card>

                <Card style={styles.detailCard}>
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

                {(() => {
                  const integration = getIntegrationForService(selectedService.id);
                  return (
                    <Card style={styles.detailCard}>
                      <Text style={styles.cardTitle}>Integración API</Text>
                      {integration ? (
                        <View style={styles.integrationInfo}>
                          <View style={[
                            styles.integrationStatusIcon,
                            { backgroundColor: integration.is_active ? `${colors.status.success}20` : `${colors.status.warning}20` }
                          ]}>
                            <Ionicons
                              name="cloud"
                              size={24}
                              color={integration.is_active ? colors.status.success : colors.status.warning}
                            />
                          </View>
                          <View style={styles.integrationDetails}>
                            <Text style={styles.integrationName}>{integration.name}</Text>
                            <Text style={styles.integrationMeta}>
                              {integration.method} {integration.base_url}{integration.endpoint}
                            </Text>
                            <View style={styles.integrationBadges}>
                              <View style={[styles.badge, { backgroundColor: `${colors.status.warning}20` }]}>
                                <Text style={[styles.badgeText, { color: colors.status.warning }]}>
                                  {integration.is_mock_mode ? 'Mock' : 'Real'}
                                </Text>
                              </View>
                              <View style={[
                                styles.badge,
                                { backgroundColor: integration.is_active ? `${colors.status.success}20` : `${colors.text.muted}20` }
                              ]}>
                                <Text style={[
                                  styles.badgeText,
                                  { color: integration.is_active ? colors.status.success : colors.text.muted }
                                ]}>
                                  {integration.is_active ? 'Activa' : 'Inactiva'}
                                </Text>
                              </View>
                            </View>
                          </View>
                        </View>
                      ) : (
                        <View style={styles.noIntegration}>
                          <Ionicons name="cloud-offline" size={32} color={colors.text.muted} />
                          <Text style={styles.noIntegrationText}>Sin integración configurada</Text>
                          <Text style={styles.noIntegrationHint}>
                            Ve a Configuración → Integraciones API para vincular una API a este servicio
                          </Text>
                        </View>
                      )}
                    </Card>
                  );
                })()}

                <Card style={styles.detailCard}>
                  <Text style={styles.cardTitle}>Requisitos</Text>
                  {selectedService.requirements.map((req, i) => (
                    <View key={i} style={styles.reqItem}>
                      <Ionicons name="checkmark-circle" size={16} color={colors.status.success} />
                      <Text style={styles.reqText}>{req}</Text>
                    </View>
                  ))}
                </Card>

                <Card style={styles.detailCard}>
                  <Text style={styles.cardTitle}>Campos del Formulario</Text>
                  <View style={styles.fieldsWrap}>
                    {selectedService.required_fields.map((field, i) => (
                      <View key={i} style={styles.fieldBadge}>
                        <Text style={styles.fieldText}>
                          {AVAILABLE_FIELDS.find(f => f.id === field)?.label || field}
                        </Text>
                      </View>
                    ))}
                  </View>
                </Card>
              </>
            )}
          </ScrollView>
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
  emptyState: {
    alignItems: 'center',
    padding: spacing['3xl'],
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginTop: spacing.lg,
  },
  emptyText: {
    fontSize: fontSize.base,
    color: colors.text.muted,
    marginTop: spacing.xs,
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
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  modalContent: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  formGroup: {
    marginBottom: spacing.md,
  },
  formLabel: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    fontWeight: fontWeight.medium,
  },
  formLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  textArea: {
    backgroundColor: colors.bg.tertiary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.text.primary,
    fontSize: fontSize.base,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  categorySelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.bg.tertiary,
  },
  categoryOptionActive: {
    backgroundColor: colors.brand.primary,
  },
  categoryOptionText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  categoryOptionTextActive: {
    color: colors.text.inverse,
  },
  priceRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  requirementInput: {
    flex: 1,
    backgroundColor: colors.bg.tertiary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.text.primary,
    fontSize: fontSize.base,
  },
  fieldsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  fieldChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.bg.tertiary,
  },
  fieldChipActive: {
    backgroundColor: `${colors.brand.primary}20`,
  },
  fieldChipText: {
    fontSize: fontSize.sm,
    color: colors.text.muted,
  },
  fieldChipTextActive: {
    color: colors.brand.primary,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.bg.card,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.md,
  },
  toggleInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  toggleLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
  },
  toggleDesc: {
    fontSize: fontSize.xs,
    color: colors.text.muted,
    marginTop: 2,
  },
  // Detail view
  detailHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  detailIcon: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.xl,
    backgroundColor: `${colors.brand.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  detailName: {
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
  detailCard: {
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
  integrationInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  integrationStatusIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  integrationDetails: {
    flex: 1,
  },
  integrationName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  integrationMeta: {
    fontSize: fontSize.xs,
    color: colors.text.muted,
    marginTop: 2,
    fontFamily: 'monospace',
  },
  integrationBadges: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  noIntegration: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  noIntegrationText: {
    fontSize: fontSize.base,
    color: colors.text.muted,
    marginTop: spacing.sm,
  },
  noIntegrationHint: {
    fontSize: fontSize.xs,
    color: colors.text.muted,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});
