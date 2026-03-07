import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '@/src/utils/theme';
import { KPICard, StatusBadge, Button } from '@/src/components/ui';
import { useAuthStore } from '@/src/store/authStore';
import { useOrdersStore } from '@/src/store/ordersStore';
import { formatCurrency, formatRelativeTime } from '@/src/utils/formatters';
import { ORDER_STATUS_CONFIG } from '@/src/constants';

export default function DashboardPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout, refreshUser } = useAuthStore();
  const { dashboardStats, fetchDashboardStats, isLoading } = useOrdersStore();
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchDashboardStats(), refreshUser()]);
    setRefreshing(false);
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.brand.primary}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Bienvenido,</Text>
          <Text style={styles.userName}>{user?.name || 'Usuario'}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color={colors.text.secondary} />
        </TouchableOpacity>
      </View>

      {/* Balance Card */}
      <TouchableOpacity style={styles.balanceCard} onPress={() => router.push('/dashboard/saldo')}>
        <View style={styles.balanceTop}>
          <View>
            <Text style={styles.balanceLabel}>Tu Saldo</Text>
            <Text style={styles.balanceAmount}>{formatCurrency(user?.balance || 0)}</Text>
          </View>
          <View style={styles.balanceIcon}>
            <Ionicons name="wallet" size={28} color={colors.brand.primary} />
          </View>
        </View>
        <View style={styles.balanceAction}>
          <Text style={styles.balanceActionText}>Recargar Saldo</Text>
          <Ionicons name="add-circle" size={20} color={colors.brand.primary} />
        </View>
      </TouchableOpacity>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/servicios')}>
            <View style={[styles.quickActionIcon, { backgroundColor: `${colors.status.info}20` }]}>
              <Ionicons name="grid" size={22} color={colors.status.info} />
            </View>
            <Text style={styles.quickActionText}>Servicios</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/dashboard/pedidos')}>
            <View style={[styles.quickActionIcon, { backgroundColor: `${colors.status.warning}20` }]}>
              <Ionicons name="receipt" size={22} color={colors.status.warning} />
            </View>
            <Text style={styles.quickActionText}>Pedidos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/dashboard/saldo')}>
            <View style={[styles.quickActionIcon, { backgroundColor: `${colors.status.success}20` }]}>
              <Ionicons name="cash" size={22} color={colors.status.success} />
            </View>
            <Text style={styles.quickActionText}>Saldo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/dashboard/perfil')}>
            <View style={[styles.quickActionIcon, { backgroundColor: `${colors.brand.secondary}20` }]}>
              <Ionicons name="person" size={22} color={colors.brand.secondary} />
            </View>
            <Text style={styles.quickActionText}>Perfil</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* KPIs */}
      {dashboardStats && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumen de Pedidos</Text>
          <View style={styles.kpiGrid}>
            <KPICard
              title="Total"
              value={dashboardStats.total_orders}
              icon="receipt-outline"
              iconColor={colors.text.secondary}
              style={styles.kpiCard}
            />
            <KPICard
              title="En Proceso"
              value={dashboardStats.processing_orders}
              icon="sync-outline"
              iconColor={colors.status.processing}
              style={styles.kpiCard}
            />
            <KPICard
              title="Pendientes"
              value={dashboardStats.pending_orders}
              icon="time-outline"
              iconColor={colors.status.pending}
              style={styles.kpiCard}
            />
            <KPICard
              title="Completados"
              value={dashboardStats.completed_orders}
              icon="checkmark-circle-outline"
              iconColor={colors.status.completed}
              style={styles.kpiCard}
            />
          </View>
        </View>
      )}

      {/* Recent Activity */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Actividad Reciente</Text>
          <TouchableOpacity onPress={() => router.push('/dashboard/pedidos')}>
            <Text style={styles.seeAll}>Ver todo</Text>
          </TouchableOpacity>
        </View>
        
        {isLoading ? (
          <ActivityIndicator color={colors.brand.primary} style={{ padding: spacing.xl }} />
        ) : dashboardStats?.recent_activity?.length ? (
          dashboardStats.recent_activity.slice(0, 5).map((activity, index) => (
            <View key={index} style={styles.activityItem}>
              <View style={[
                styles.activityIcon,
                { backgroundColor: activity.type === 'order' ? `${colors.brand.primary}20` : `${colors.status.success}20` }
              ]}>
                <Ionicons
                  name={activity.type === 'order' ? 'receipt' : 'cash'}
                  size={18}
                  color={activity.type === 'order' ? colors.brand.primary : colors.status.success}
                />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>{activity.title}</Text>
                <Text style={styles.activityDesc}>{activity.description}</Text>
              </View>
              <View style={styles.activityMeta}>
                <Text style={[
                  styles.activityAmount,
                  { color: activity.amount >= 0 ? colors.status.success : colors.text.secondary }
                ]}>
                  {activity.amount >= 0 ? '+' : ''}{formatCurrency(activity.amount)}
                </Text>
                <Text style={styles.activityTime}>{formatRelativeTime(activity.created_at)}</Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="folder-open" size={40} color={colors.text.muted} />
            <Text style={styles.emptyText}>No hay actividad reciente</Text>
            <Button title="Explorar Servicios" onPress={() => router.push('/servicios')} variant="outline" />
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  greeting: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  userName: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  logoutBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.bg.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceCard: {
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.brand.primary + '30',
  },
  balanceTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  balanceLabel: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    color: colors.brand.primary,
  },
  balanceIcon: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.lg,
    backgroundColor: `${colors.brand.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  balanceActionText: {
    fontSize: fontSize.sm,
    color: colors.brand.primary,
    fontWeight: fontWeight.medium,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  seeAll: {
    fontSize: fontSize.sm,
    color: colors.brand.primary,
    fontWeight: fontWeight.medium,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAction: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionIcon: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  quickActionText: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    fontWeight: fontWeight.medium,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  kpiCard: {
    width: '47%',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.card,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
  },
  activityDesc: {
    fontSize: fontSize.xs,
    color: colors.text.muted,
    marginTop: 2,
  },
  activityMeta: {
    alignItems: 'flex-end',
  },
  activityAmount: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  activityTime: {
    fontSize: fontSize.xs,
    color: colors.text.muted,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing['2xl'],
    gap: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.base,
    color: colors.text.muted,
  },
});
