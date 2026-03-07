import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '@/src/utils/theme';
import { Header } from '@/src/components/layout/Header';
import { Footer } from '@/src/components/layout/Footer';
import { ServiceCard } from '@/src/components/ui';
import { useServicesStore } from '@/src/store/servicesStore';
import { SERVICE_CATEGORIES } from '@/src/constants';

export default function ServiciosPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { services, categories, fetchServices, fetchCategories, isLoading } = useServicesStore();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchServices();
    fetchCategories();
  }, []);

  const handleCategoryPress = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
    fetchServices(categoryId || undefined);
  };

  const filteredServices = selectedCategory
    ? services.filter(s => s.category === selectedCategory)
    : services;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Header showAuth />
      
      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Nuestros Servicios</Text>
        <Text style={styles.heroSubtitle}>
          Encuentra el trámite que necesitas. Todos nuestros servicios son rápidos, seguros y con información oficial.
        </Text>
      </View>

      {/* Categories Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContainer}
      >
        <TouchableOpacity
          style={[styles.categoryChip, !selectedCategory && styles.categoryChipActive]}
          onPress={() => handleCategoryPress(null)}
        >
          <Ionicons name="grid" size={16} color={!selectedCategory ? colors.text.inverse : colors.text.secondary} />
          <Text style={[styles.categoryChipText, !selectedCategory && styles.categoryChipTextActive]}>Todos</Text>
        </TouchableOpacity>
        {SERVICE_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.categoryChip, selectedCategory === cat.id && styles.categoryChipActive]}
            onPress={() => handleCategoryPress(cat.id)}
          >
            <Ionicons
              name={cat.icon as any}
              size={16}
              color={selectedCategory === cat.id ? colors.text.inverse : colors.text.secondary}
            />
            <Text style={[
              styles.categoryChipText,
              selectedCategory === cat.id && styles.categoryChipTextActive
            ]}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Services List */}
      <View style={styles.servicesSection}>
        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={colors.brand.primary} />
            <Text style={styles.loadingText}>Cargando servicios...</Text>
          </View>
        ) : filteredServices.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="search" size={48} color={colors.text.muted} />
            <Text style={styles.emptyText}>No se encontraron servicios</Text>
          </View>
        ) : (
          <View style={styles.servicesList}>
            {filteredServices.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onPress={() => router.push(`/servicios/${service.slug}`)}
              />
            ))}
          </View>
        )}
      </View>

      {/* Info Section */}
      <View style={styles.infoSection}>
        <View style={styles.infoCard}>
          <Ionicons name="shield-checkmark" size={24} color={colors.brand.primary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Información 100% Oficial</Text>
            <Text style={styles.infoDesc}>Todos los datos provienen de fuentes gubernamentales verificadas</Text>
          </View>
        </View>
        <View style={styles.infoCard}>
          <Ionicons name="flash" size={24} color={colors.brand.primary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Resultados Rápidos</Text>
            <Text style={styles.infoDesc}>La mayoría de trámites se procesan en menos de 24 horas</Text>
          </View>
        </View>
        <View style={styles.infoCard}>
          <Ionicons name="lock-closed" size={24} color={colors.brand.primary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Datos Protegidos</Text>
            <Text style={styles.infoDesc}>Tu información está encriptada y segura en todo momento</Text>
          </View>
        </View>
      </View>

      <Footer />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  hero: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing['2xl'],
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 400,
  },
  categoriesContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.bg.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border.default,
    marginRight: spacing.sm,
  },
  categoryChipActive: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  categoryChipText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    fontWeight: fontWeight.medium,
  },
  categoryChipTextActive: {
    color: colors.text.inverse,
  },
  servicesSection: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    minHeight: 300,
  },
  loading: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'],
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: fontSize.base,
    color: colors.text.secondary,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'],
  },
  emptyText: {
    marginTop: spacing.md,
    fontSize: fontSize.base,
    color: colors.text.muted,
  },
  servicesList: {
    gap: spacing.md,
  },
  infoSection: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing['2xl'],
    backgroundColor: colors.bg.secondary,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: 4,
  },
  infoDesc: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
  },
});
