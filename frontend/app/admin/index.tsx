import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '@/src/utils/theme';
import { KPICard, StatusBadge } from '@/src/components/ui';
import { useAuthStore } from '@/src/store/authStore';
import { formatCurrency, formatRelativeTime } from '@/src/utils/formatters';
import { AdminDashboardStats } from '@/src/types';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function AdminDashboardPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuthStore();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const token = await AsyncStorage.getItem('tramitly_token');
      const response = await axios.get(`${API_URL}/api/admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error loading admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loading, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.brand.primary} />
      </View>
    );
  }

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
          <Text style={styles.greeting}>Panel de Control</Text>
          <Text style={styles.userName}>Admin: {user?.name}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color={colors.text.secondary} />
        </TouchableOpacity>
      </View>

      {/* KPIs */}
      {stats && (
        <>
          <View style={styles.kpiGrid}>
            <KPICard
              title="Ingresos Totales"
              value={formatCurrency(stats.total_revenue)}
              icon="cash-outline"
              iconColor={colors.status.success}
              style={styles.kpiCard}
            />
            <KPICard
              title="Usuarios"
              value={stats.total_users}
              icon="people-outline"
              iconColor={colors.status.info}
              style={styles.kpiCard}
            />
            <KPICard
              title="Total Órdenes"
              value={stats.total_orders}
              icon="receipt-outline"
              iconColor={colors.brand.primary}
              style={styles.kpiCard}
            />
            <KPICard
              title="Servicios Activos"
              value={stats.active_services}
              icon="grid-outline"
              iconColor={colors.brand.secondary}
              style={styles.kpiCard}
            />
          </View>

          {/* Orders by Status */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Órdenes por Estado</Text>
            <View style={styles.statusGrid}>
              {Object.entries(stats.orders_by_status).map(([status, count]) => (
                <TouchableOpacity
                  key={status}
                  style={styles.statusCard}
                  onPress={() => router.push(`/admin/ordenes?status=${status}`)}
                >
                  <StatusBadge status={status} size="sm" />
                  <Text style={styles.statusCount}>{count}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Recent Orders */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Órdenes Recientes</Text>
              <TouchableOpacity onPress={() => router.push('/admin/ordenes')}>
                <Text style={styles.seeAll}>Ver todas</Text>
              </TouchableOpacity>
            </View>
            
            {stats.recent_orders.slice(0, 5).map((order) => (
              <View key={order.id} style={styles.orderItem}>
                <View style={styles.orderInfo}>
                  <Text style={styles.orderNumber}>{order.order_number}</Text>
                  <Text style={styles.orderService}>{order.service_name}</Text>
                  <Text style={styles.orderTime}>{formatRelativeTime(order.created_at)}</Text>
                </View>
                <View style={styles.orderMeta}>
                  <StatusBadge status={order.status} size="sm" />
                  <Text style={styles.orderAmount}>{formatCurrency(order.amount)}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Recent Users */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Usuarios Recientes</Text>
              <TouchableOpacity onPress={() => router.push('/admin/usuarios')}>
                <Text style={styles.seeAll}>Ver todos</Text>
              </TouchableOpacity>
            </View>
            
            {stats.recent_users.slice(0, 5).map((u) => (
              <View key={u.id} style={styles.userItem}>
                <View style={styles.userAvatar}>
                  <Ionicons name="person" size={20} color={colors.brand.primary} />
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userInfoName}>{u.name}</Text>
                  <Text style={styles.userInfoEmail}>{u.email}</Text>
                </View>
                <Text style={styles.userBalance}>{formatCurrency(u.balance)}</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  loading: {
    justifyContent: 'center',
    alignItems: 'center',
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
    color: colors.brand.primary,
    fontWeight: fontWeight.semibold,
  },
  userName: {
    fontSize: fontSize.xl,
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
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  kpiCard: {
    width: '47%',
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
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statusCard: {
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: 100,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  statusCount: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.bg.card,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: fontSize.sm,
    color: colors.brand.primary,
    fontWeight: fontWeight.semibold,
  },
  orderService: {
    fontSize: fontSize.sm,
    color: colors.text.primary,
    marginTop: 2,
  },
  orderTime: {
    fontSize: fontSize.xs,
    color: colors.text.muted,
    marginTop: 2,
  },
  orderMeta: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  orderAmount: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.card,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.brand.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  userInfo: {
    flex: 1,
  },
  userInfoName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
  },
  userInfoEmail: {
    fontSize: fontSize.xs,
    color: colors.text.muted,
  },
  userBalance: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.brand.primary,
  },
});
