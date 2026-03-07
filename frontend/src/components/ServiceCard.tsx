import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../utils/theme';
import { Service } from '../store/servicesStore';

interface ServiceCardProps {
  service: Service;
  onPress: () => void;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ service, onPress }) => {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Seguridad Social': return 'shield-checkmark';
      case 'Identidad': return 'person-circle';
      case 'Fiscal': return 'document-text';
      case 'Créditos': return 'cash';
      default: return 'folder';
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.iconContainer}>
        <Ionicons name={getCategoryIcon(service.category) as any} size={28} color={colors.primary} />
      </View>
      <View style={styles.content}>
        <Text style={styles.category}>{service.category}</Text>
        <Text style={styles.name}>{service.name}</Text>
        <Text style={styles.description} numberOfLines={2}>{service.short_description}</Text>
        <View style={styles.footer}>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>${service.price.toLocaleString('es-MX')} MXN</Text>
          </View>
          <View style={styles.timeContainer}>
            <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.time}>{service.delivery_time}</Text>
          </View>
        </View>
      </View>
      <View style={styles.arrow}>
        <Ionicons name="chevron-forward" size={24} color={colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(0, 217, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  content: {
    flex: 1,
  },
  category: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: fontWeight.medium,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  name: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: fontWeight.semibold,
    marginBottom: 4,
  },
  description: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    backgroundColor: 'rgba(0, 217, 255, 0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  price: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.bold,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  time: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  arrow: {
    marginLeft: spacing.sm,
  },
});
