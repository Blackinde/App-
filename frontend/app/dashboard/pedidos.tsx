import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '@/src/utils/theme';
import { StatusBadge, Button, Card } from '@/src/components/ui';
import { useOrdersStore } from '@/src/store/ordersStore';
import { formatCurrency, formatDateTime, formatRelativeTime } from '@/src/utils/formatters';
import { Order } from '@/src/types';

export default function PedidosPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { orders, fetchOrders, isLoading, fetchOrderById } = useOrdersStore();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const handleOrderPress = async (order: Order) => {
    const details = await fetchOrderById(order.id);
    if (details) {
      setSelectedOrder(details);
      setModalVisible(true);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Mis Pedidos</Text>
        <TouchableOpacity style={styles.filterBtn}>
          <Ionicons name="filter" size={20} color={colors.text.secondary} />
        </TouchableOpacity>
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
        {isLoading && !refreshing ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={colors.brand.primary} />
            <Text style={styles.loadingText}>Cargando pedidos...</Text>
          </View>
        ) : orders.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={64} color={colors.text.muted} />
            <Text style={styles.emptyTitle}>Sin pedidos aún</Text>
            <Text style={styles.emptyText}>Cuando solicites un servicio, aparecerá aquí</Text>
            <Button
              title="Explorar Servicios"
              onPress={() => router.push('/servicios')}
              style={{ marginTop: spacing.lg }}
            />
          </View>
        ) : (
          orders.map((order) => (
            <TouchableOpacity
              key={order.id}
              style={styles.orderCard}
              onPress={() => handleOrderPress(order)}
              activeOpacity={0.7}
            >
              <View style={styles.orderHeader}>
                <View>
                  <Text style={styles.orderNumber}>{order.order_number}</Text>
                  <Text style={styles.serviceName}>{order.service_name}</Text>
                </View>
                <StatusBadge status={order.status} size="sm" />
              </View>
              
              <View style={styles.orderInfo}>
                <View style={styles.orderInfoItem}>
                  <Ionicons name="cash-outline" size={16} color={colors.text.muted} />
                  <Text style={styles.orderInfoText}>{formatCurrency(order.amount)}</Text>
                </View>
                <View style={styles.orderInfoItem}>
                  <Ionicons name="time-outline" size={16} color={colors.text.muted} />
                  <Text style={styles.orderInfoText}>{formatRelativeTime(order.created_at)}</Text>
                </View>
              </View>
              
              <View style={styles.orderFooter}>
                <Text style={styles.viewDetails}>Ver detalles</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.brand.primary} />
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
            <Text style={styles.modalTitle}>Detalle del Pedido</Text>
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
                <Text style={styles.modalCardTitle}>Servicio</Text>
                <Text style={styles.modalCardValue}>{selectedOrder.service_name}</Text>
              </Card>

              <Card style={styles.modalCard}>
                <View style={styles.modalRow}>
                  <View style={styles.modalRowItem}>
                    <Text style={styles.modalLabel}>Monto</Text>
                    <Text style={styles.modalValue}>{formatCurrency(selectedOrder.amount)}</Text>
                  </View>
                  <View style={styles.modalRowItem}>
                    <Text style={styles.modalLabel}>Fecha</Text>
                    <Text style={styles.modalValue}>{formatDateTime(selectedOrder.created_at)}</Text>
                  </View>
                </View>
              </Card>

              <Card style={styles.modalCard}>
                <Text style={styles.modalCardTitle}>Datos Enviados</Text>
                {Object.entries(selectedOrder.input_data).map(([key, value]) => (
                  <View key={key} style={styles.dataRow}>
                    <Text style={styles.dataKey}>{key}:</Text>
                    <Text style={styles.dataValue}>{String(value)}</Text>
                  </View>
                ))}
              </Card>

              {selectedOrder.admin_notes && (
                <Card style={styles.modalCard}>
                  <Text style={styles.modalCardTitle}>Notas</Text>
                  <Text style={styles.modalNotes}>{selectedOrder.admin_notes}</Text>
                </Card>
              )}

              {selectedOrder.result_data && (
                <Card style={styles.modalCard}>
                  <Text style={styles.modalCardTitle}>Resultado</Text>
                  {Object.entries(selectedOrder.result_data).map(([key, value]) => (
                    <View key={key} style={styles.dataRow}>
                      <Text style={styles.dataKey}>{key}:</Text>
                      <Text style={styles.dataValue}>{String(value)}</Text>
                    </View>
                  ))}
                </Card>
              )}
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
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.bg.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  loading: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: fontSize.base,
    color: colors.text.secondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
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
    marginBottom: spacing.md,
  },
  orderNumber: {
    fontSize: fontSize.sm,
    color: colors.brand.primary,
    fontWeight: fontWeight.semibold,
    marginBottom: 4,
  },
  serviceName: {
    fontSize: fontSize.md,
    color: colors.text.primary,
    fontWeight: fontWeight.medium,
  },
  orderInfo: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  orderInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  orderInfoText: {
    fontSize: fontSize.sm,
    color: colors.text.muted,
  },
  orderFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.xs,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  viewDetails: {
    fontSize: fontSize.sm,
    color: colors.brand.primary,
    fontWeight: fontWeight.medium,
  },
  // Modal styles
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
  modalCardTitle: {
    fontSize: fontSize.sm,
    color: colors.text.muted,
    marginBottom: spacing.sm,
  },
  modalCardValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
  },
  modalRow: {
    flexDirection: 'row',
  },
  modalRowItem: {
    flex: 1,
  },
  modalLabel: {
    fontSize: fontSize.sm,
    color: colors.text.muted,
    marginBottom: 4,
  },
  modalValue: {
    fontSize: fontSize.base,
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
  modalNotes: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
});
