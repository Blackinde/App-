import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '@/src/utils/theme';
import { StatusBadge, Button, Card } from '@/src/components/ui';
import { formatCurrency, formatDateTime, formatRelativeTime } from '@/src/utils/formatters';
import { ORDER_STATUS_CONFIG } from '@/src/constants';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface AdminOrder {
  id: string;
  order_number: string;
  user_id: string;
  user_name: string;
  user_email: string;
  service_id: string;
  service_name: string;
  status: string;
  amount: number;
  input_data: Record<string, any>;
  result_data?: Record<string, any>;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

export default function AdminOrdenesPage() {
  const insets = useSafeAreaInsets();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  const loadOrders = async () => {
    try {
      const token = await AsyncStorage.getItem('tramitly_token');
      const url = statusFilter 
        ? `${API_URL}/api/admin/orders?status=${statusFilter}`
        : `${API_URL}/api/admin/orders`;
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(response.data);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdating(true);
    try {
      const token = await AsyncStorage.getItem('tramitly_token');
      await axios.put(
        `${API_URL}/api/orders/${orderId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await loadOrders();
      setModalVisible(false);
      Alert.alert('Éxito', 'Estado actualizado correctamente');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Error al actualizar');
    } finally {
      setUpdating(false);
    }
  };

  const statuses = Object.keys(ORDER_STATUS_CONFIG);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Gestión de Órdenes</Text>
        <Text style={styles.count}>{orders.length} órdenes</Text>
      </View>

      {/* Filters */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
      >
        <TouchableOpacity
          style={[styles.filterChip, !statusFilter && styles.filterChipActive]}
          onPress={() => setStatusFilter(null)}
        >
          <Text style={[styles.filterText, !statusFilter && styles.filterTextActive]}>Todas</Text>
        </TouchableOpacity>
        {statuses.map((status) => (
          <TouchableOpacity
            key={status}
            style={[styles.filterChip, statusFilter === status && styles.filterChipActive]}
            onPress={() => setStatusFilter(status)}
          >
            <Text style={[styles.filterText, statusFilter === status && styles.filterTextActive]}>
              {ORDER_STATUS_CONFIG[status].label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

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
        ) : orders.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={48} color={colors.text.muted} />
            <Text style={styles.emptyText}>No hay órdenes{statusFilter ? ` con estado "${ORDER_STATUS_CONFIG[statusFilter]?.label}"` : ''}</Text>
          </View>
        ) : (
          orders.map((order) => (
            <TouchableOpacity
              key={order.id}
              style={styles.orderCard}
              onPress={() => {
                setSelectedOrder(order);
                setModalVisible(true);
              }}
            >
              <View style={styles.orderHeader}>
                <View>
                  <Text style={styles.orderNumber}>{order.order_number}</Text>
                  <Text style={styles.serviceName}>{order.service_name}</Text>
                </View>
                <StatusBadge status={order.status} size="sm" />
              </View>
              
              <View style={styles.orderUser}>
                <Ionicons name="person-outline" size={14} color={colors.text.muted} />
                <Text style={styles.orderUserText}>{order.user_name} ({order.user_email})</Text>
              </View>
              
              <View style={styles.orderFooter}>
                <Text style={styles.orderAmount}>{formatCurrency(order.amount)}</Text>
                <Text style={styles.orderTime}>{formatRelativeTime(order.created_at)}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Order Detail Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Detalle de Orden</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>
          
          {selectedOrder && (
            <ScrollView contentContainerStyle={styles.modalContent}>
              <View style={styles.modalSection}>
                <Text style={styles.modalOrderNumber}>{selectedOrder.order_number}</Text>
                <StatusBadge status={selectedOrder.status} />
              </View>

              <Card style={styles.modalCard}>
                <Text style={styles.cardTitle}>Información del Cliente</Text>
                <View style={styles.infoRow}>
                  <Ionicons name="person" size={16} color={colors.text.muted} />
                  <Text style={styles.infoText}>{selectedOrder.user_name}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="mail" size={16} color={colors.text.muted} />
                  <Text style={styles.infoText}>{selectedOrder.user_email}</Text>
                </View>
              </Card>

              <Card style={styles.modalCard}>
                <Text style={styles.cardTitle}>Detalles del Servicio</Text>
                <Text style={styles.serviceTitleModal}>{selectedOrder.service_name}</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Monto:</Text>
                  <Text style={styles.detailValue}>{formatCurrency(selectedOrder.amount)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Fecha:</Text>
                  <Text style={styles.detailValue}>{formatDateTime(selectedOrder.created_at)}</Text>
                </View>
              </Card>

              <Card style={styles.modalCard}>
                <Text style={styles.cardTitle}>Datos Enviados</Text>
                {Object.entries(selectedOrder.input_data).map(([key, value]) => (
                  <View key={key} style={styles.dataRow}>
                    <Text style={styles.dataKey}>{key}:</Text>
                    <Text style={styles.dataValue}>{String(value)}</Text>
                  </View>
                ))}
              </Card>

              <Card style={styles.modalCard}>
                <Text style={styles.cardTitle}>Cambiar Estado</Text>
                <View style={styles.statusButtons}>
                  {statuses.map((status) => (
                    <Button
                      key={status}
                      title={ORDER_STATUS_CONFIG[status].label}
                      variant={selectedOrder.status === status ? 'primary' : 'outline'}
                      size="sm"
                      onPress={() => updateOrderStatus(selectedOrder.id, status)}
                      disabled={updating || selectedOrder.status === status}
                      style={styles.statusBtn}
                    />
                  ))}
                </View>
              </Card>
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
  filters: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    borderColor: colors.border.default,
    marginRight: spacing.sm,
  },
  filterChipActive: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  filterText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    fontWeight: fontWeight.medium,
  },
  filterTextActive: {
    color: colors.text.inverse,
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
    gap: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.base,
    color: colors.text.muted,
    textAlign: 'center',
  },
  orderCard: {
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  orderNumber: {
    fontSize: fontSize.sm,
    color: colors.brand.primary,
    fontWeight: fontWeight.semibold,
  },
  serviceName: {
    fontSize: fontSize.md,
    color: colors.text.primary,
    fontWeight: fontWeight.medium,
    marginTop: 2,
  },
  orderUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  orderUserText: {
    fontSize: fontSize.xs,
    color: colors.text.muted,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  orderAmount: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.brand.primary,
  },
  orderTime: {
    fontSize: fontSize.xs,
    color: colors.text.muted,
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
  modalSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  modalOrderNumber: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.brand.primary,
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  infoText: {
    fontSize: fontSize.sm,
    color: colors.text.primary,
  },
  serviceTitleModal: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
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
  dataRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  dataKey: {
    fontSize: fontSize.sm,
    color: colors.text.muted,
    width: 80,
  },
  dataValue: {
    fontSize: fontSize.sm,
    color: colors.text.primary,
    flex: 1,
  },
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statusBtn: {
    minWidth: 100,
  },
});
