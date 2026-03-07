import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '@/src/utils/theme';
import { Service } from '@/src/types';
import { formatCurrency } from '@/src/utils/formatters';
import { SERVICE_CATEGORIES } from '@/src/constants';

interface ServiceCardProps {
  service: Service;
  onPress: () => void;
  variant?: 'default' | 'compact';
  style?: ViewStyle;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  onPress,
  variant = 'default',
  style,
}) => {
  const categoryConfig = SERVICE_CATEGORIES.find(c => c.id === service.category);
  const categoryIcon = categoryConfig?.icon || 'folder-outline';
  const categoryName = categoryConfig?.name || service.category;

  if (variant === 'compact') {
    return (
      <TouchableOpacity style={[styles.compactCard, style]} onPress={onPress} activeOpacity={0.8}>
        <View style={styles.compactIconContainer}>
          <Ionicons name={categoryIcon as any} size={24} color={colors.brand.primary} />
        </View>
        <View style={styles.compactContent}>
          <Text style={styles.compactName} numberOfLines={1}>{service.name}</Text>
          <Text style={styles.compactPrice}>{formatCurrency(service.price)}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={[styles.card, style]} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name={categoryIcon as any} size={28} color={colors.brand.primary} />
        </View>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{categoryName}</Text>
        </View>
      </View>
      <Text style={styles.name}>{service.name}</Text>
      <Text style={styles.description} numberOfLines={2}>{service.short_description}</Text>
      <View style={styles.footer}>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>{formatCurrency(service.price)}</Text>
        </View>
        <View style={styles.timeContainer}>
          <Ionicons name="time-outline" size={14} color={colors.text.muted} />
          <Text style={styles.time}>{service.estimated_time}</Text>
        </View>
      </View>
      <View style={styles.arrow}>
        <Ionicons name="chevron-forward" size={20} color={colors.text.muted} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    position: 'relative',
    ...shadows.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.md,
    backgroundColor: `${colors.brand.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryBadge: {
    backgroundColor: `${colors.brand.primary}15`,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  categoryText: {
    fontSize: fontSize.xs,
    color: colors.brand.primary,
    fontWeight: fontWeight.medium,
  },
  name: {
    fontSize: fontSize.md,
    color: colors.text.primary,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    backgroundColor: `${colors.brand.primary}15`,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  price: {
    fontSize: fontSize.base,
    color: colors.brand.primary,
    fontWeight: fontWeight.bold,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  time: {
    fontSize: fontSize.xs,
    color: colors.text.muted,
  },
  arrow: {
    position: 'absolute',
    right: spacing.md,
    top: '50%',
  },
  // Compact variant
  compactCard: {
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    ...shadows.sm,
  },
  compactIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: `${colors.brand.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactContent: {
    flex: 1,
  },
  compactName: {
    fontSize: fontSize.sm,
    color: colors.text.primary,
    fontWeight: fontWeight.medium,
    marginBottom: 4,
  },
  compactPrice: {
    fontSize: fontSize.sm,
    color: colors.brand.primary,
    fontWeight: fontWeight.bold,
  },
});
