import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Modal, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '@/src/utils/theme';
import { useAuthStore } from '@/src/store/authStore';
import { useServicesStore, Service } from '@/src/store/servicesStore';
import { Button } from '@/src/components/Button';
import { Input } from '@/src/components/Input';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

const categories = ['Seguridad Social', 'Identidad', 'Fiscal', 'Créditos', 'Verificaciones'];
const fieldOptions = ['full_name', 'curp', 'nss', 'rfc', 'email', 'phone', 'date_of_birth', 'address', 'notes'];

export default function AdminServices() {
  const { token } = useAuthStore();
  const { services, fetchServices, isLoading } = useServicesStore();
  
  const [modalVisible, setModalVisible] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [shortDescription, setShortDescription] = useState('');
  const [fullDescription, setFullDescription] = useState('');
  const [price, setPrice] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [requiredFields, setRequiredFields] = useState<string[]>(['full_name', 'email']);

  useEffect(() => {
    fetchServices();
  }, []);

  const resetForm = () => {
    setName('');
    setSlug('');
    setCategory(categories[0]);
    setShortDescription('');
    setFullDescription('');
    setPrice('');
    setDeliveryTime('');
    setRequiredFields(['full_name', 'email']);
    setEditingService(null);
  };

  const openCreateModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (service: Service) => {
    setEditingService(service);
    setName(service.name);
    setSlug(service.slug);
    setCategory(service.category);
    setShortDescription(service.short_description);
    setFullDescription(service.full_description);
    setPrice(service.price.toString());
    setDeliveryTime(service.delivery_time);
    setRequiredFields(service.required_fields);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!name || !shortDescription || !price) {
      Alert.alert('Error', 'Completa los campos requeridos');
      return;
    }

    setSaving(true);
    try {
      const serviceData = {
        name,
        slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
        category,
        short_description: shortDescription,
        full_description: fullDescription || shortDescription,
        price: parseFloat(price),
        delivery_time: deliveryTime || '24-48 horas',
        required_fields: requiredFields,
        requirements: [],
        notes: [],
        is_active: true,
      };

      if (editingService) {
        await axios.put(`${API_URL}/api/services/${editingService.id}`, serviceData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        Alert.alert('Éxito', 'Servicio actualizado');
      } else {
        await axios.post(`${API_URL}/api/services`, serviceData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        Alert.alert('Éxito', 'Servicio creado');
      }

      setModalVisible(false);
      resetForm();
      fetchServices();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (service: Service) => {
    Alert.alert(
      'Eliminar Servicio',
      `¿Estás seguro de eliminar "${service.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${API_URL}/api/services/${service.id}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              fetchServices();
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar el servicio');
            }
          },
        },
      ]
    );
  };

  const toggleField = (field: string) => {
    if (requiredFields.includes(field)) {
      setRequiredFields(requiredFields.filter(f => f !== field));
    } else {
      setRequiredFields([...requiredFields, field]);
    }
  };

  const renderService = ({ item }: { item: Service }) => (
    <View style={styles.serviceCard}>
      <View style={styles.serviceHeader}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{item.category}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: item.is_active ? 'rgba(16, 185, 129, 0.15)' : 'rgba(107, 114, 128, 0.15)' }]}>
          <Text style={[styles.statusText, { color: item.is_active ? colors.success : colors.textMuted }]}>
            {item.is_active ? 'Activo' : 'Inactivo'}
          </Text>
        </View>
      </View>
      <Text style={styles.serviceName}>{item.name}</Text>
      <Text style={styles.serviceDesc} numberOfLines={2}>{item.short_description}</Text>
      <View style={styles.serviceFooter}>
        <Text style={styles.servicePrice}>${item.price.toLocaleString('es-MX')} MXN</Text>
        <View style={styles.serviceActions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => openEditModal(item)}>
            <Ionicons name="create-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item)}>
            <Ionicons name="trash-outline" size={20} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>{services.length} servicios</Text>
        <Button title="Nuevo Servicio" onPress={openCreateModal} size="small" />
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={services}
          keyExtractor={(item) => item.id}
          renderItem={renderService}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Create/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView style={styles.modalContainer} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={28} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{editingService ? 'Editar Servicio' : 'Nuevo Servicio'}</Text>
            <View style={{ width: 28 }} />
          </View>
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <Input label="Nombre *" value={name} onChangeText={setName} placeholder="Nombre del servicio" />
            <Input label="Slug" value={slug} onChangeText={setSlug} placeholder="nombre-del-servicio" />
            
            <Text style={styles.inputLabel}>Categoría</Text>
            <View style={styles.categoryPicker}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryOption, category === cat && styles.categoryOptionActive]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[styles.categoryOptionText, category === cat && styles.categoryOptionTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input label="Descripción corta *" value={shortDescription} onChangeText={setShortDescription} placeholder="Descripción breve" multiline />
            <Input label="Descripción completa" value={fullDescription} onChangeText={setFullDescription} placeholder="Descripción detallada" multiline numberOfLines={4} />
            <Input label="Precio (MXN) *" value={price} onChangeText={setPrice} placeholder="299" keyboardType="numeric" />
            <Input label="Tiempo de entrega" value={deliveryTime} onChangeText={setDeliveryTime} placeholder="24-48 horas" />

            <Text style={styles.inputLabel}>Campos requeridos</Text>
            <View style={styles.fieldsContainer}>
              {fieldOptions.map((field) => (
                <TouchableOpacity
                  key={field}
                  style={[styles.fieldOption, requiredFields.includes(field) && styles.fieldOptionActive]}
                  onPress={() => toggleField(field)}
                >
                  <Ionicons
                    name={requiredFields.includes(field) ? 'checkbox' : 'square-outline'}
                    size={20}
                    color={requiredFields.includes(field) ? colors.primary : colors.textMuted}
                  />
                  <Text style={styles.fieldOptionText}>{field.replace(/_/g, ' ')}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Button title={editingService ? 'Actualizar' : 'Crear Servicio'} onPress={handleSave} loading={saving} size="large" />
            <View style={{ height: 50 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
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
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  listContent: {
    padding: spacing.md,
  },
  serviceCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  categoryBadge: {
    backgroundColor: 'rgba(0, 217, 255, 0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  categoryText: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  serviceName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  serviceDesc: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  servicePrice: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  serviceActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  modalContent: {
    padding: spacing.lg,
  },
  inputLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    fontWeight: fontWeight.medium,
  },
  categoryPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  categoryOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryOptionText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  categoryOptionTextActive: {
    color: colors.background,
    fontWeight: fontWeight.medium,
  },
  fieldsContainer: {
    marginBottom: spacing.lg,
  },
  fieldOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  fieldOptionActive: {},
  fieldOptionText: {
    fontSize: fontSize.md,
    color: colors.text,
    textTransform: 'capitalize',
  },
});
