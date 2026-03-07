import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '@/src/utils/theme';
import { Header } from '@/src/components/layout/Header';
import { Button, Input } from '@/src/components/ui';
import { useAuthStore } from '@/src/store/authStore';
import { APP_NAME } from '@/src/constants';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email) newErrors.email = 'El correo es requerido';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Correo inválido';
    if (!password) newErrors.password = 'La contraseña es requerida';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    
    setLoading(true);
    try {
      await login(email, password);
      router.replace('/dashboard');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Header showBack showAuth={false} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="flash" size={40} color={colors.text.inverse} />
          </View>
          <Text style={styles.title}>Bienvenido a {APP_NAME}</Text>
          <Text style={styles.subtitle}>Inicia sesión para acceder a tu cuenta</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Correo Electrónico"
            value={email}
            onChangeText={setEmail}
            placeholder="tu@correo.com"
            icon="mail-outline"
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />
          <Input
            label="Contraseña"
            value={password}
            onChangeText={setPassword}
            placeholder="Tu contraseña"
            icon="lock-closed-outline"
            secureTextEntry
            error={errors.password}
          />
          <Button title="Iniciar Sesión" onPress={handleLogin} loading={loading} size="lg" fullWidth />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>¿No tienes una cuenta?</Text>
          <Button title="Crear cuenta" onPress={() => router.push('/register')} variant="ghost" />
        </View>

        {/* Demo Credentials */}
        <View style={styles.demoSection}>
          <View style={styles.demoCard}>
            <View style={styles.demoHeader}>
              <Ionicons name="information-circle" size={18} color={colors.status.info} />
              <Text style={styles.demoTitle}>Credenciales de Prueba</Text>
            </View>
            <View style={styles.demoItem}>
              <Text style={styles.demoLabel}>Admin:</Text>
              <Text style={styles.demoValue}>admin@tramitly.mx / Admin123!</Text>
            </View>
            <View style={styles.demoItem}>
              <Text style={styles.demoLabel}>Usuario:</Text>
              <Text style={styles.demoValue}>demo@tramitly.mx / Demo123!</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  content: {
    flexGrow: 1,
    padding: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    marginTop: spacing.xl,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.brand.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
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
    textAlign: 'center',
  },
  form: {
    marginBottom: spacing.xl,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
  },
  footerText: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
  },
  demoSection: {
    marginTop: spacing['2xl'],
  },
  demoCard: {
    backgroundColor: `${colors.status.info}10`,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: `${colors.status.info}30`,
  },
  demoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  demoTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.status.info,
  },
  demoItem: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  demoLabel: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    width: 60,
  },
  demoValue: {
    fontSize: fontSize.sm,
    color: colors.text.primary,
    flex: 1,
  },
});
