import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '@/src/utils/theme';
import { Card } from '@/src/components/ui';
import { formatCurrency, formatDate, formatDateTime } from '@/src/utils/formatters';
import { User } from '@/src/types';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function AdminUsuariosPage() {
  const insets = useSafeAreaInsets();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const token = await AsyncStorage.getItem('tramitly_token');
      const response = await axios.get(`${API_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUsers();
    setRefreshing(false);
  };

  // Stats
  const totalUsers = users.filter(u => u.role === 'user').length;
  const totalAdmins = users.filter(u => u.role === 'admin').length;
  const totalBalance = users.reduce((sum, u) => sum + (u.balance || 0), 0);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Usuarios</Text>
        <Text style={styles.count}>{users.length} usuarios</Text>
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
        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="people" size={24} color={colors.status.info} />
            <Text style={styles.statValue}>{totalUsers}</Text>
            <Text style={styles.statLabel}>Clientes</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="shield" size={24} color={colors.status.warning} />
            <Text style={styles.statValue}>{totalAdmins}</Text>
            <Text style={styles.statLabel}>Admins</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="wallet" size={24} color={colors.status.success} />
            <Text style={styles.statValue}>{formatCurrency(totalBalance)}</Text>
            <Text style={styles.statLabel}>Balance Total</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={colors.brand.primary} />
          </View>
        ) : (
          users.map((user) => (
            <TouchableOpacity
              key={user.id}
              style={styles.userCard}
              onPress={() => {
                setSelectedUser(user);
                setModalVisible(true);
              }}
            >
              <View style={styles.userAvatar}>
                <Ionicons
                  name={user.role === 'admin' ? 'shield' : 'person'}
                  size={24}
                  color={user.role === 'admin' ? colors.status.warning : colors.brand.primary}
                />
              </View>
              <View style={styles.userInfo}>
                <View style={styles.userNameRow}>
                  <Text style={styles.userName}>{user.name}</Text>
                  {user.role === 'admin' && (
                    <View style={styles.adminBadge}>
                      <Text style={styles.adminBadgeText}>Admin</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.userEmail}>{user.email}</Text>
                <Text style={styles.userDate}>Registrado: {formatDate(user.created_at)}</Text>
              </View>
              <View style={styles.userBalance}>
                <Text style={styles.balanceAmount}>{formatCurrency(user.balance)}</Text>
                <Text style={styles.balanceLabel}>Saldo</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* User Detail Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Detalle de Usuario</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>
          
          {selectedUser && (
            <ScrollView contentContainerStyle={styles.modalContent}>
              <View style={styles.modalUserHeader}>
                <View style={[
                  styles.modalAvatar,
                  { backgroundColor: selectedUser.role === 'admin' ? `${colors.status.warning}20` : `${colors.brand.primary}20` }
                ]}>
                  <Ionicons
                    name={selectedUser.role === 'admin' ? 'shield' : 'person'}
                    size={40}
                    color={selectedUser.role === 'admin' ? colors.status.warning : colors.brand.primary}
                  />
                </View>
                <Text style={styles.modalUserName}>{selectedUser.name}</Text>
                <Text style={styles.modalUserEmail}>{selectedUser.email}</Text>
                {selectedUser.role === 'admin' && (
                  <View style={styles.adminBadgeLarge}>
                    <Ionicons name="shield-checkmark" size={14} color={colors.status.warning} />
                    <Text style={styles.adminBadgeLargeText}>Administrador</Text>
                  </View>
                )}
              </View>

              <Card style={styles.modalCard}>
                <Text style={styles.cardTitle}>Información de Cuenta</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>ID:</Text>
                  <Text style={styles.infoValue}>{selectedUser.id}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Rol:</Text>
                  <Text style={styles.infoValue}>{selectedUser.role === 'admin' ? 'Administrador' : 'Usuario'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Saldo:</Text>
                  <Text style={[styles.infoValue, { color: colors.brand.primary }]}>
                    {formatCurrency(selectedUser.balance)}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Registro:</Text>
                  <Text style={styles.infoValue}>{formatDateTime(selectedUser.created_at)}</Text>
                </View>
              </Card>

              <Card style={styles.modalCard}>
                <Text style={styles.cardTitle}>Acciones Rápidas</Text>
                <View style={styles.actionsGrid}>
                  <TouchableOpacity style={styles.actionBtn}>
                    <Ionicons name="mail" size={20} color={colors.brand.primary} />
                    <Text style={styles.actionBtnText}>Enviar Email</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn}>
                    <Ionicons name="receipt" size={20} color={colors.brand.primary} />
                    <Text style={styles.actionBtnText}>Ver Pedidos</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn}>
                    <Ionicons name="wallet" size={20} color={colors.brand.primary} />
                    <Text style={styles.actionBtnText}>Transacciones</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn}>
                    <Ionicons name="ban" size={20} color={colors.status.error} />
                    <Text style={[styles.actionBtnText, { color: colors.status.error }]}>Suspender</Text>
                  </TouchableOpacity>
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
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  statValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginTop: spacing.xs,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.text.muted,
    marginTop: 2,
  },
  loading: {
    padding: spacing['3xl'],
    alignItems: 'center',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${colors.brand.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  userInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  userName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  adminBadge: {
    backgroundColor: `${colors.status.warning}20`,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  adminBadgeText: {
    fontSize: fontSize.xs,
    color: colors.status.warning,
    fontWeight: fontWeight.medium,
  },
  userEmail: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  userDate: {
    fontSize: fontSize.xs,
    color: colors.text.muted,
    marginTop: 2,
  },
  userBalance: {
    alignItems: 'flex-end',
  },
  balanceAmount: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.brand.primary,
  },
  balanceLabel: {
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
  modalUserHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  modalAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalUserName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: 4,
  },
  modalUserEmail: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  adminBadgeLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: `${colors.status.warning}20`,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  adminBadgeLargeText: {
    fontSize: fontSize.xs,
    color: colors.status.warning,
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
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  infoLabel: {
    fontSize: fontSize.sm,
    color: colors.text.muted,
  },
  infoValue: {
    fontSize: fontSize.sm,
    color: colors.text.primary,
    fontWeight: fontWeight.medium,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  actionBtn: {
    width: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.bg.tertiary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  actionBtnText: {
    fontSize: fontSize.sm,
    color: colors.brand.primary,
    fontWeight: fontWeight.medium,
  },
});
