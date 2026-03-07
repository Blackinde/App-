import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '@/src/utils/theme';
import { Button, Input, Card } from '@/src/components/ui';
import { useAuthStore } from '@/src/store/authStore';
import { formatCurrency, formatDate } from '@/src/utils/formatters';

export default function PerfilPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, updateProfile, logout } = useAuthStore();
  
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'El nombre es requerido');
      return;
    }

    setLoading(true);
    try {
      await updateProfile({ name, email });
      setEditing(false);
      Alert.alert('Éxito', 'Perfil actualizado correctamente');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que deseas salir?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salir',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/');
          }
        }
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Mi Perfil</Text>
        {!editing && (
          <Button
            title="Editar"
            variant="outline"
            size="sm"
            onPress={() => setEditing(true)}
            icon={<Ionicons name="pencil" size={16} color={colors.brand.primary} />}
          />
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={48} color={colors.brand.primary} />
          </View>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <View style={styles.roleBadge}>
            <Ionicons name="shield-checkmark" size={14} color={colors.brand.primary} />
            <Text style={styles.roleText}>
              {user?.role === 'admin' ? 'Administrador' : 'Usuario'}
            </Text>
          </View>
        </View>

        {/* Profile Form */}
        <Card style={styles.card}>
          {editing ? (
            <>
              <Input
                label="Nombre Completo"
                value={name}
                onChangeText={setName}
                placeholder="Tu nombre"
                icon="person-outline"
              />
              <Input
                label="Correo Electrónico"
                value={email}
                onChangeText={setEmail}
                placeholder="tu@correo.com"
                icon="mail-outline"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <View style={styles.editActions}>
                <Button
                  title="Cancelar"
                  variant="outline"
                  onPress={() => {
                    setEditing(false);
                    setName(user?.name || '');
                    setEmail(user?.email || '');
                  }}
                  style={{ flex: 1 }}
                />
                <Button
                  title="Guardar"
                  onPress={handleSave}
                  loading={loading}
                  style={{ flex: 1 }}
                />
              </View>
            </>
          ) : (
            <>
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Ionicons name="person-outline" size={20} color={colors.brand.primary} />
                </View>
                <View>
                  <Text style={styles.infoLabel}>Nombre</Text>
                  <Text style={styles.infoValue}>{user?.name}</Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Ionicons name="mail-outline" size={20} color={colors.brand.primary} />
                </View>
                <View>
                  <Text style={styles.infoLabel}>Correo</Text>
                  <Text style={styles.infoValue}>{user?.email}</Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Ionicons name="calendar-outline" size={20} color={colors.brand.primary} />
                </View>
                <View>
                  <Text style={styles.infoLabel}>Miembro desde</Text>
                  <Text style={styles.infoValue}>{user?.created_at ? formatDate(user.created_at) : 'N/A'}</Text>
                </View>
              </View>
            </>
          )}
        </Card>

        {/* Stats Card */}
        <Card title="Información de Cuenta" icon="stats-chart-outline" style={styles.card}>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatCurrency(user?.balance || 0)}</Text>
              <Text style={styles.statLabel}>Saldo Actual</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user?.role === 'admin' ? 'Admin' : 'Usuario'}</Text>
              <Text style={styles.statLabel}>Tipo de Cuenta</Text>
            </View>
          </View>
        </Card>

        {/* Settings */}
        <Card title="Configuración" icon="settings-outline" style={styles.card}>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="notifications-outline" size={22} color={colors.text.secondary} />
              <Text style={styles.settingText}>Notificaciones</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.text.muted} />
          </View>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="lock-closed-outline" size={22} color={colors.text.secondary} />
              <Text style={styles.settingText}>Cambiar Contraseña</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.text.muted} />
          </View>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="help-circle-outline" size={22} color={colors.text.secondary} />
              <Text style={styles.settingText}>Ayuda y Soporte</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.text.muted} />
          </View>
        </Card>

        {/* Logout */}
        <Button
          title="Cerrar Sesión"
          variant="danger"
          onPress={handleLogout}
          fullWidth
          icon={<Ionicons name="log-out-outline" size={20} color={colors.text.primary} />}
          style={{ marginTop: spacing.lg }}
        />
      </ScrollView>
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
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: `${colors.brand.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  userName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: `${colors.brand.primary}15`,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  roleText: {
    fontSize: fontSize.xs,
    color: colors.brand.primary,
    fontWeight: fontWeight.medium,
  },
  card: {
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: `${colors.brand.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  infoLabel: {
    fontSize: fontSize.xs,
    color: colors.text.muted,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: fontSize.base,
    color: colors.text.primary,
    fontWeight: fontWeight.medium,
  },
  editActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.brand.primary,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.text.muted,
    marginTop: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  settingText: {
    fontSize: fontSize.base,
    color: colors.text.primary,
  },
});
