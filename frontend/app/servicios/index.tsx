import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '@/src/utils/theme';
import { Header } from '@/src/components/layout/Header';
import { Footer } from '@/src/components/layout/Footer';
import { ServiceCard } from '@/src/components/ui';
import { useServicesStore } from '@/src/store/servicesStore';
import { SERVICE_CATEGORIES } from '@/src/constants';

export default function ServiciosPage() {
  const router = useRouter();
  const { services, categories, isLoading, fetchServices, fetchCategories, selectedCategory, setSelectedCategory } = useServicesStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchServices();
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchServices(selectedCategory || undefined);
  }, [selectedCategory]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchServices(selectedCategory || undefined);
    setRefreshing(false);
  };

  const getCategoryIcon = (categoryId: string) => {
    const cat = SERVICE_CATEGORIES.find(c => c.id === categoryId);
    return cat?.icon || 'folder-outline';
  };

  return (
    <View style={styles.container}>
      <Header showBack />
      
      <View style={styles.header}>
        <Text style={styles.title}>Catálogo de Servicios</Text>
        <Text style={styles.subtitle}>Selecciona el trámite que necesitas realizar</Text>
      </View>

      {/* Category Filters */}
      <View style={styles.filters}>
        <TouchableOpacity
          style={[styles.filterPill, !selectedCategory && styles.filterPillActive]}
          onPress={() => setSelectedCategory(null)}
        >
          <Ionicons name="apps-outline" size={16} color={!selectedCategory ? colors.text.inverse : colors.text.secondary} />
          <Text style={[styles.filterText, !selectedCategory && styles.filterTextActive]}>Todos</Text>
        </TouchableOpacity>
        {SERVICE_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.filterPill, selectedCategory === cat.id && styles.filterPillActive]}
            onPress={() => setSelectedCategory(cat.id)}
          >
            <Ionicons
              name={cat.icon as any}
              size={16}
              color={selectedCategory === cat.id ? colors.text.inverse : colors.text.secondary}
            />
            <Text style={[styles.filterText, selectedCategory === cat.id && styles.filterTextActive]}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading && services.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brand.primary} />
          <Text style={styles.loadingText}>Cargando servicios...</Text>
        </View>
      ) : (
        <FlatList
          data={services}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ServiceCard
              service={item}
              onPress={() => router.push(`/servicios/${item.slug}`)}
              style={styles.serviceCard}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.brand.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="folder-open-outline" size={64} color={colors.text.muted} />
              <Text style={styles.emptyTitle}>No hay servicios disponibles</Text>
              <Text style={styles.emptyText}>Intenta con otra categoría</Text>
            </View>
          }
          ListFooterComponent={<Footer />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  filterPillActive: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  filterText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    fontWeight: fontWeight.medium,
  },
  filterTextActive: {
    color: colors.text.inverse,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
  },
  serviceCard: {
    marginBottom: spacing.md,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginTop: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
});
