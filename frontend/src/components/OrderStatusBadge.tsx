import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../utils/theme';

interface OrderStatusBadgeProps {
  status: string;
  size?: 'small' | 'medium';
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  pending_payment: { label: 'Pendiente de pago', color: '#F59E0B', bgColor: 'rgba(245, 158, 11, 0.15)' },
  pending_confirmation: { label: 'Verificando pago', color: '#3B82F6', bgColor: 'rgba(59, 130, 246, 0.15)' },
  paid: { label: 'Pagado', color: '#10B981', bgColor: 'rgba(16, 185, 129, 0.15)' },
  under_review: { label: 'En revisión', color: '#8B5CF6', bgColor: 'rgba(139, 92, 246, 0.15)' },
  processing: { label: 'Procesando', color: '#00D9FF', bgColor: 'rgba(0, 217, 255, 0.15)' },
  completed: { label: 'Completado', color: '#10B981', bgColor: 'rgba(16, 185, 129, 0.15)' },
  rejected: { label: 'Rechazado', color: '#EF4444', bgColor: 'rgba(239, 68, 68, 0.15)' },
  cancelled: { label: 'Cancelado', color: '#6B7280', bgColor: 'rgba(107, 114, 128, 0.15)' },
};

export const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ status, size = 'medium' }) => {
  const config = statusConfig[status] || { label: status, color: colors.textSecondary, bgColor: colors.backgroundCard };

  return (
    <View style={[styles.badge, { backgroundColor: config.bgColor }, size === 'small' && styles.badgeSmall]}>
      <View style={[styles.dot, { backgroundColor: config.color }]} />
      <Text style={[styles.text, { color: config.color }, size === 'small' && styles.textSmall]}>
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.sm,
  },
  badgeSmall: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  text: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  textSmall: {
    fontSize: fontSize.xs,
  },
});
