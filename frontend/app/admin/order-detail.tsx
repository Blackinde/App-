import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, Modal, TouchableOpacity, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '@/src/utils/theme';
import { useAuthStore } from '@/src/store/authStore';
import { OrderStatusBadge } from '@/src/components/OrderStatusBadge';
import { Button } from '@/src/components/Button';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

const statusOptions = [
  { value: 'pending_payment', label: 'Pendiente de pago' },
  { value: 'paid', label: 'Pagado' },
  { value: 'under_review', label: 'En revisión' },
  { value: 'processing', label: 'Procesando' },
  { value: 'completed', label: 'Completado' },
  { value: 'rejected', label: 'Rechazado' },
  { value: 'cancelled', label: 'Cancelado' },
];

export default function AdminOrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token } = useAuthStore();
  
  const [order, setOrder] = useState<any>(null);
  const [payment, setPayment] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  
  const [uploadingDoc, setUploadingDoc] = useState(false);

  useEffect(() => {
    if (id) {
      fetchOrderDetails();
    }
  }, [id]);

  const fetchOrderDetails = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [orderRes, paymentRes, docsRes] = await Promise.all([
        axios.get(`${API_URL}/api/orders/${id}`, { headers }),
        axios.get(`${API_URL}/api/payments/${id}`, { headers }).catch(() => ({ data: null })),
        axios.get(`${API_URL}/api/documents/${id}`, { headers }).catch(() => ({ data: [] })),
      ]);
      setOrder(orderRes.data);
      setPayment(paymentRes.data);
      setDocuments(docsRes.data || []);
      setSelectedStatus(orderRes.data.status);
      setAdminNotes(orderRes.data.admin_notes || '');
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar el pedido');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    setUpdating(true);
    try {
      await axios.put(
        `${API_URL}/api/orders/${id}/status`,
        { status: selectedStatus, admin_notes: adminNotes },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Éxito', 'Estado actualizado');
      setStatusModalVisible(false);
      fetchOrderDetails();
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el estado');
    } finally {
      setUpdating(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!payment) return;
    
    Alert.alert(
      'Confirmar Pago',
      '¿Estás seguro de confirmar este pago?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              await axios.put(
                `${API_URL}/api/payments/${payment.id}/confirm`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
              );
              Alert.alert('Éxito', 'Pago confirmado');
              fetchOrderDetails();
            } catch (error) {
              Alert.alert('Error', 'No se pudo confirmar el pago');
            }
          },
        },
      ]
    );
  };

  const handleUploadDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/zip'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      setUploadingDoc(true);
      const file = result.assets[0];
      const base64 = await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      await axios.post(
        `${API_URL}/api/documents`,
        {
          order_id: id,
          file_name: file.name,
          file_data: base64,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert('Éxito', 'Documento subido');
      fetchOrderDetails();
    } catch (error) {
      Alert.alert('Error', 'No se pudo subir el documento');
    } finally {
      setUploadingDoc(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color={colors.error} />
        <Text style={styles.errorText}>Pedido no encontrado</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}>
      {/* Order Header */}
      <View style={styles.header}>
        <View style={styles.orderNumberRow}>
          <Text style={styles.orderNumber}>{order.order_number}</Text>
          <OrderStatusBadge status={order.status} />
        </View>
        <Text style={styles.serviceName}>{order.service_name}</Text>
        <Text style={styles.orderDate}>{formatDate(order.created_at)}</Text>
      </View>

      {/* Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Acciones</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setStatusModalVisible(true)}>
            <Ionicons name="sync" size={24} color={colors.primary} />
            <Text style={styles.actionText}>Cambiar Estado</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={handleUploadDocument} disabled={uploadingDoc}>
            <Ionicons name="cloud-upload" size={24} color={colors.success} />
            <Text style={styles.actionText}>{uploadingDoc ? 'Subiendo...' : 'Subir Doc'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Payment Info */}
      {payment && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información de Pago</Text>
          <View style={styles.paymentCard}>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Estado</Text>
              <View style={[styles.paymentBadge, { backgroundColor: payment.status === 'confirmed' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)' }]}>
                <Text style={[styles.paymentBadgeText, { color: payment.status === 'confirmed' ? colors.success : colors.warning }]}>
                  {payment.status === 'confirmed' ? 'Confirmado' : 'Pendiente'}
                </Text>
              </View>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Referencia</Text>
              <Text style={styles.paymentValue}>{payment.reference}</Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Monto</Text>
              <Text style={styles.paymentValue}>${payment.amount.toLocaleString('es-MX')} MXN</Text>
            </View>
            {payment.status !== 'confirmed' && (
              <Button title="Confirmar Pago" onPress={handleConfirmPayment} style={{ marginTop: spacing.md }} />
            )}
          </View>
        </View>
      )}

      {/* Documents */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Documentos ({documents.length})</Text>
        {documents.length === 0 ? (
          <View style={styles.emptyDocs}>
            <Ionicons name="document-outline" size={40} color={colors.textMuted} />
            <Text style={styles.emptyDocsText}>No hay documentos</Text>
          </View>
        ) : (
          documents.map((doc) => (
            <View key={doc.id} style={styles.documentCard}>
              <Ionicons name="document" size={24} color={colors.primary} />
              <View style={styles.documentInfo}>
                <Text style={styles.documentName}>{doc.file_name}</Text>
                <Text style={styles.documentDate}>{formatDate(doc.uploaded_at)}</Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Submitted Data */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Datos del Cliente</Text>
        <View style={styles.dataCard}>
          {Object.entries(order.submitted_data).map(([key, value]) => (
            <View key={key} style={styles.dataRow}>
              <Text style={styles.dataLabel}>{key.replace(/_/g, ' ').toUpperCase()}</Text>
              <Text style={styles.dataValue}>{String(value)}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Status Update Modal */}
      <Modal visible={statusModalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setStatusModalVisible(false)}>
              <Ionicons name="close" size={28} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Actualizar Estado</Text>
            <View style={{ width: 28 }} />
          </View>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.inputLabel}>Nuevo Estado</Text>
            {statusOptions.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.statusOption, selectedStatus === opt.value && styles.statusOptionActive]}
                onPress={() => setSelectedStatus(opt.value)}
              >
                <Ionicons
                  name={selectedStatus === opt.value ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={selectedStatus === opt.value ? colors.primary : colors.textMuted}
                />
                <Text style={[styles.statusOptionText, selectedStatus === opt.value && styles.statusOptionTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
            
            <Text style={[styles.inputLabel, { marginTop: spacing.lg }]}>Notas internas</Text>
            <TextInput
              style={styles.notesInput}
              value={adminNotes}
              onChangeText={setAdminNotes}
              placeholder="Notas para el equipo..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
            />
            
            <Button title="Guardar Cambios" onPress={handleUpdateStatus} loading={updating} size="large" />
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
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
  orderNumberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  orderNumber: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  serviceName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  orderDate: {
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
  actionsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  actionText: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: fontWeight.medium,
  },
  paymentCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  paymentLabel: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  paymentValue: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: fontWeight.medium,
  },
  paymentBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  paymentBadgeText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  emptyDocs: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyDocsText: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  documentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: fontWeight.medium,
  },
  documentDate: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  dataCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dataRow: {
    marginBottom: spacing.md,
  },
  dataLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  dataValue: {
    fontSize: fontSize.md,
    color: colors.text,
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
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusOptionActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(0, 217, 255, 0.1)',
  },
  statusOptionText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  statusOptionTextActive: {
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  notesInput: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    color: colors.text,
    fontSize: fontSize.md,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: spacing.lg,
  },
});
