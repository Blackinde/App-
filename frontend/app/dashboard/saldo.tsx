import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, Alert, TextInput, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '@/src/utils/theme';
import { KPICard, Button, Card } from '@/src/components/ui';
import { useAuthStore } from '@/src/store/authStore';
import { formatCurrency, formatDateTime } from '@/src/utils/formatters';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction } from '@/src/types';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function SaldoPage() {
  const insets = useSafeAreaInsets();
  const { user, refreshUser } = useAuthStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositing, setDepositing] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const token = await AsyncStorage.getItem('tramitly_token');
      const response = await axios.get(`${API_URL}/api/transactions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTransactions(response.data);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadTransactions(), refreshUser()]);
    setRefreshing(false);
  };

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount < 100) {
      Alert.alert('Error', 'El monto mínimo de recarga es $100 MXN');
      return;
    }
    if (amount > 50000) {
      Alert.alert('Error', 'El monto máximo de recarga es $50,000 MXN');
      return;
    }

    setDepositing(true);
    try {
      const token = await AsyncStorage.getItem('tramitly_token');
      await axios.post(`${API_URL}/api/transactions/deposit`, 
        { type: 'deposit', amount },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await Promise.all([loadTransactions(), refreshUser()]);
      setShowDepositModal(false);
      setDepositAmount('');
      Alert.alert('¡Recarga Exitosa!', `Se han agregado ${formatCurrency(amount)} a tu saldo`);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Error al procesar la recarga');
    } finally {
      setDepositing(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit': return 'add-circle';
      case 'payment': return 'cart';
      case 'refund': return 'return-down-back';
      default: return 'cash';
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'deposit': return colors.status.success;
      case 'payment': return colors.status.info;
      case 'refund': return colors.status.warning;
      default: return colors.text.secondary;
    }
  };

  // Calculate totals
  const totalDeposits = transactions.filter(t => t.type === 'deposit').reduce((sum, t) => sum + t.amount, 0);
  const totalPayments = transactions.filter(t => t.type === 'payment').reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Mi Saldo</Text>
        <Button
          title="Recargar"
          onPress={() => setShowDepositModal(true)}
          size="sm"
          icon={<Ionicons name="add" size={18} color={colors.text.inverse} />}
        />
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
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Saldo Disponible</Text>
          <Text style={styles.balanceAmount}>{formatCurrency(user?.balance || 0)}</Text>
          <View style={styles.balanceInfo}>
            <View style={styles.balanceInfoItem}>
              <Ionicons name="arrow-down-circle" size={16} color={colors.status.success} />
              <Text style={styles.balanceInfoText}>Recargas: {formatCurrency(totalDeposits)}</Text>
            </View>
            <View style={styles.balanceInfoItem}>
              <Ionicons name="arrow-up-circle" size={16} color={colors.status.info} />
              <Text style={styles.balanceInfoText}>Pagos: {formatCurrency(totalPayments)}</Text>
            </View>
          </View>
        </View>

        {/* Quick Deposit Options */}
        <Card title="Recarga Rápida" icon="flash-outline" style={styles.quickDepositCard}>
          <View style={styles.quickAmounts}>
            {[200, 500, 1000, 2000].map((amount) => (
              <Button
                key={amount}
                title={`$${amount}`}
                variant="outline"
                size="sm"
                onPress={() => {
                  setDepositAmount(amount.toString());
                  setShowDepositModal(true);
                }}
              />
            ))}
          </View>
        </Card>

        {/* Transaction History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Historial de Transacciones</Text>
          
          {loading ? (
            <ActivityIndicator color={colors.brand.primary} style={{ padding: spacing.xl }} />
          ) : transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="wallet-outline" size={48} color={colors.text.muted} />
              <Text style={styles.emptyText}>No hay transacciones aún</Text>
            </View>
          ) : (
            transactions.map((transaction) => (
              <View key={transaction.id} style={styles.transactionItem}>
                <View style={[
                  styles.transactionIcon,
                  { backgroundColor: `${getTransactionColor(transaction.type)}20` }
                ]}>
                  <Ionicons
                    name={getTransactionIcon(transaction.type)}
                    size={20}
                    color={getTransactionColor(transaction.type)}
                  />
                </View>
                <View style={styles.transactionContent}>
                  <Text style={styles.transactionTitle}>{transaction.description || transaction.type}</Text>
                  <Text style={styles.transactionRef}>{transaction.reference}</Text>
                  <Text style={styles.transactionDate}>{formatDateTime(transaction.created_at)}</Text>
                </View>
                <Text style={[
                  styles.transactionAmount,
                  { color: transaction.amount >= 0 ? colors.status.success : colors.text.secondary }
                ]}>
                  {transaction.amount >= 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Deposit Modal */}
      <Modal
        visible={showDepositModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDepositModal(false)}
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Recargar Saldo</Text>
            <Button
              title=""
              variant="ghost"
              onPress={() => setShowDepositModal(false)}
              icon={<Ionicons name="close" size={24} color={colors.text.primary} />}
            />
          </View>
          
          <View style={styles.modalContent}>
            <View style={styles.amountInputContainer}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.amountInput}
                value={depositAmount}
                onChangeText={setDepositAmount}
                placeholder="0.00"
                placeholderTextColor={colors.text.muted}
                keyboardType="decimal-pad"
                autoFocus
              />
              <Text style={styles.currencyCode}>MXN</Text>
            </View>
            
            <Text style={styles.modalHint}>Mínimo $100 - Máximo $50,000</Text>
            
            <View style={styles.quickAmountsModal}>
              {[100, 250, 500, 1000, 2500, 5000].map((amount) => (
                <Button
                  key={amount}
                  title={`$${amount}`}
                  variant={depositAmount === amount.toString() ? 'primary' : 'outline'}
                  size="sm"
                  onPress={() => setDepositAmount(amount.toString())}
                  style={styles.quickAmountBtn}
                />
              ))}
            </View>

            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color={colors.status.info} />
              <Text style={styles.infoText}>
                Esta es una demostración. En producción, aquí se integraría con Stripe, Mercado Pago u otro procesador de pagos.
              </Text>
            </View>

            <Button
              title={`Recargar ${depositAmount ? formatCurrency(parseFloat(depositAmount) || 0) : '$0.00'}`}
              onPress={handleDeposit}
              loading={depositing}
              size="lg"
              fullWidth
              disabled={!depositAmount || parseFloat(depositAmount) < 100}
            />
          </View>
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
  content: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  balanceCard: {
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.brand.primary + '30',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  balanceAmount: {
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.bold,
    color: colors.brand.primary,
    marginBottom: spacing.md,
  },
  balanceInfo: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  balanceInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  balanceInfoText: {
    fontSize: fontSize.xs,
    color: colors.text.muted,
  },
  quickDepositCard: {
    marginBottom: spacing.lg,
  },
  quickAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
    gap: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.base,
    color: colors.text.muted,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.card,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  transactionContent: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
  },
  transactionRef: {
    fontSize: fontSize.xs,
    color: colors.brand.primary,
    marginTop: 2,
  },
  transactionDate: {
    fontSize: fontSize.xs,
    color: colors.text.muted,
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
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
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  currencySymbol: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    color: colors.text.secondary,
    marginRight: spacing.xs,
  },
  amountInput: {
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    textAlign: 'center',
    minWidth: 150,
  },
  currencyCode: {
    fontSize: fontSize.md,
    color: colors.text.muted,
    marginLeft: spacing.sm,
  },
  modalHint: {
    fontSize: fontSize.xs,
    color: colors.text.muted,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  quickAmountsModal: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  quickAmountBtn: {
    minWidth: 80,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: `${colors.status.info}15`,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xl,
  },
  infoText: {
    flex: 1,
    fontSize: fontSize.xs,
    color: colors.status.info,
    lineHeight: 18,
  },
});
