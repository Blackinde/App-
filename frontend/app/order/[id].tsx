import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, TouchableOpacity, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '@/src/utils/theme';
import { useOrdersStore, Order, Document } from '@/src/store/ordersStore';
import { useAuthStore } from '@/src/store/authStore';
import { OrderStatusBadge } from '@/src/components/OrderStatusBadge';
import { Button } from '@/src/components/Button';
import { Input } from '@/src/components/Input';

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuthStore();
  const { currentOrder, payment, documents, isLoading, fetchOrderById, fetchPayment, fetchDocuments, createPayment } = useOrdersStore();
  
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentReference, setPaymentReference] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  useEffect(() => {
    if (id) {
      fetchOrderById(id);
      fetchPayment(id);
      fetchDocuments(id);
    }
  }, [id]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSubmitPayment = async () => {
    if (!paymentReference.trim()) {
      Alert.alert('Error', 'Ingresa el número de referencia del pago');
      return;
    }
    
    setSubmittingPayment(true);
    try {
      await createPayment(id!, 'bank_transfer', paymentReference);
      setShowPaymentForm(false);
      setPaymentReference('');
      Alert.alert('Éxito', 'Pago registrado. Lo verificaremos pronto.');
      fetchOrderById(id!);
      fetchPayment(id!);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleDownloadDocument = async (doc: Document) => {
    try {
      const fileUri = FileSystem.documentDirectory + doc.file_name;
      await FileSystem.writeAsStringAsync(fileUri, doc.file_data, {
        encoding: FileSystem.EncodingType.Base64,
      });
      Alert.alert('Éxito', `Documento guardado: ${doc.file_name}`);
    } catch (error) {
      Alert.alert('Error', 'No se pudo descargar el documento');
    }
  };

  if (isLoading || !currentOrder) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const bankInfo = {
    bank: 'BBVA México',
    clabe: '012180001234567890',
    account: '1234567890',
    beneficiary: 'ProcedimientosMX S.A. de C.V.',
    concept: currentOrder.order_number,
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}>
      {/* Order Header */}
      <View style={styles.header}>
        <View style={styles.orderNumberRow}>
          <Text style={styles.orderNumber}>{currentOrder.order_number}</Text>
          <OrderStatusBadge status={currentOrder.status} />
        </View>
        <Text style={styles.serviceName}>{currentOrder.service_name}</Text>
        <Text style={styles.orderDate}>Creado el {formatDate(currentOrder.created_at)}</Text>
      </View>

      {/* Order Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Resumen del Pedido</Text>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Servicio</Text>
            <Text style={styles.summaryValue}>{currentOrder.service_name}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total a pagar</Text>
            <Text style={styles.summaryPrice}>${currentOrder.total_amount.toLocaleString('es-MX')} MXN</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Estado del pago</Text>
            <View style={[styles.paymentBadge, { backgroundColor: currentOrder.payment_status === 'confirmed' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)' }]}>
              <Text style={[styles.paymentBadgeText, { color: currentOrder.payment_status === 'confirmed' ? colors.success : colors.warning }]}>
                {currentOrder.payment_status === 'confirmed' ? 'Confirmado' : currentOrder.payment_status === 'pending_confirmation' ? 'Verificando' : 'Pendiente'}
              </Text>
            </View>
          </View>
          {currentOrder.estimated_delivery && (
            <>
              <View style={styles.divider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Entrega estimada</Text>
                <Text style={styles.summaryValue}>{formatDate(currentOrder.estimated_delivery)}</Text>
              </View>
            </>
          )}
        </View>
      </View>

      {/* Payment Section */}
      {currentOrder.payment_status === 'pending' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información de Pago</Text>
          <View style={styles.paymentCard}>
            <View style={styles.bankInfo}>
              <Text style={styles.bankLabel}>Banco</Text>
              <Text style={styles.bankValue}>{bankInfo.bank}</Text>
            </View>
            <View style={styles.bankInfo}>
              <Text style={styles.bankLabel}>CLABE</Text>
              <Text style={styles.bankValue}>{bankInfo.clabe}</Text>
            </View>
            <View style={styles.bankInfo}>
              <Text style={styles.bankLabel}>Cuenta</Text>
              <Text style={styles.bankValue}>{bankInfo.account}</Text>
            </View>
            <View style={styles.bankInfo}>
              <Text style={styles.bankLabel}>Beneficiario</Text>
              <Text style={styles.bankValue}>{bankInfo.beneficiary}</Text>
            </View>
            <View style={styles.bankInfo}>
              <Text style={styles.bankLabel}>Concepto/Referencia</Text>
              <Text style={[styles.bankValue, { color: colors.primary }]}>{bankInfo.concept}</Text>
            </View>
          </View>

          {showPaymentForm ? (
            <View style={styles.paymentForm}>
              <Input
                label="Número de referencia del pago"
                value={paymentReference}
                onChangeText={setPaymentReference}
                placeholder="Ingresa el número de referencia"
                icon="receipt-outline"
              />
              <Button
                title="Confirmar Pago"
                onPress={handleSubmitPayment}
                loading={submittingPayment}
              />
              <Button
                title="Cancelar"
                onPress={() => setShowPaymentForm(false)}
                variant="ghost"
              />
            </View>
          ) : (
            <Button
              title="Ya realicé el pago"
              onPress={() => setShowPaymentForm(true)}
              icon={<Ionicons name="checkmark-circle" size={20} color={colors.background} />}
            />
          )}
        </View>
      )}

      {/* Payment Confirmation Pending */}
      {currentOrder.payment_status === 'pending_confirmation' && (
        <View style={styles.section}>
          <View style={styles.pendingCard}>
            <Ionicons name="time" size={40} color={colors.warning} />
            <Text style={styles.pendingTitle}>Pago en verificación</Text>
            <Text style={styles.pendingText}>
              Hemos recibido tu notificación de pago. Lo verificaremos en las próximas horas.
            </Text>
          </View>
        </View>
      )}

      {/* Documents Section */}
      {documents.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Documentos</Text>
          {documents.map((doc) => (
            <TouchableOpacity
              key={doc.id}
              style={styles.documentCard}
              onPress={() => handleDownloadDocument(doc)}
            >
              <View style={styles.documentIcon}>
                <Ionicons name="document" size={24} color={colors.primary} />
              </View>
              <View style={styles.documentInfo}>
                <Text style={styles.documentName}>{doc.file_name}</Text>
                <Text style={styles.documentDate}>Subido el {formatDate(doc.uploaded_at)}</Text>
              </View>
              <Ionicons name="download-outline" size={24} color={colors.primary} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Submitted Data */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Datos Enviados</Text>
        <View style={styles.dataCard}>
          {Object.entries(currentOrder.submitted_data).map(([key, value]) => (
            <View key={key} style={styles.dataRow}>
              <Text style={styles.dataLabel}>{key.replace(/_/g, ' ').toUpperCase()}</Text>
              <Text style={styles.dataValue}>{String(value)}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Admin Notes */}
      {currentOrder.admin_notes && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notas del Administrador</Text>
          <View style={styles.notesCard}>
            <Ionicons name="information-circle" size={20} color={colors.info} />
            <Text style={styles.notesText}>{currentOrder.admin_notes}</Text>
          </View>
        </View>
      )}
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
  summaryCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: fontWeight.medium,
    flex: 1,
    textAlign: 'right',
  },
  summaryPrice: {
    fontSize: fontSize.lg,
    color: colors.primary,
    fontWeight: fontWeight.bold,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
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
  paymentCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  bankInfo: {
    marginBottom: spacing.md,
  },
  bankLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: 4,
  },
  bankValue: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: fontWeight.medium,
  },
  paymentForm: {
    marginTop: spacing.md,
  },
  pendingCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  pendingTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.warning,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  pendingText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  documentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  documentIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(0, 217, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: fontWeight.medium,
    marginBottom: 4,
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
  notesCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    gap: spacing.sm,
  },
  notesText: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 22,
  },
});
