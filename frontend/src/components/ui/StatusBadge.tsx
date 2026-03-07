import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '@/src/utils/theme';
import { ORDER_STATUS_CONFIG } from '@/src/constants';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md', showIcon = true }) => {
  const config = ORDER_STATUS_CONFIG[status] || {
    label: status,
    color: colors.text.secondary,
    bgColor: colors.bg.tertiary,
    icon: 'help-circle-outline'
  };

  return (
    <View style={[
      styles.badge,
      { backgroundColor: config.bgColor },
      size === 'sm' && styles.badgeSm
    ]}>
      {showIcon && (
        <Ionicons
          name={config.icon as any}
          size={size === 'sm' ? 12 : 14}
          color={config.color}
        />
      )}
      <Text style={[
        styles.text,
        { color: config.color },
        size === 'sm' && styles.textSm
      ]}>
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
    gap: spacing.xs,
  },
  badgeSm: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  text: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  textSm: {
    fontSize: fontSize.xs,
  },
});
