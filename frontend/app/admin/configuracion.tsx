import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Modal, Switch, Alert, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '@/src/utils/theme';
import { Button, Card, Input } from '@/src/components/ui';
import { Service } from '@/src/types';
import { useIntegrationsStore, Integration } from '@/src/store/integrationsStore';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

const DEFAULT_INTEGRATION: Omit<Integration, 'id' | 'created_at'> = {
  name: '',
  description: '',
  service_id: null,
  service_name: undefined,
  base_url: '',
  endpoint: '',
  method: 'POST',
  api_key: '',
  headers: {},
  timeout: 30,
  webhook_url: '',
  is_active: false,
  is_mock_mode: true,
  request_mapping: '{\n  "curp": "{{input.curp}}",\n  "nss": "{{input.nss}}"\n}',
  response_mapping: '{\n  "nombre": "{{response.data.nombre}}",\n  "estado": "{{response.data.estado}}"\n}',
  last_test_status: null,
  last_test_at: null,
};

export default function ConfiguracionPage() {
  const insets = useSafeAreaInsets();
  const { 
    integrations, 
    addIntegration, 
    updateIntegration, 
    deleteIntegration,
    linkServiceToIntegration,
    unlinkServiceFromIntegration,
    toggleActive,
    toggleMockMode,
    updateTestStatus 
  } = useIntegrationsStore();
  
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState<Omit<Integration, 'id' | 'created_at'>>(DEFAULT_INTEGRATION);
  const [headersText, setHeadersText] = useState('{}');

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const token = await AsyncStorage.getItem('tramitly_token');
      const response = await axios.get(`${API_URL}/api/services?active_only=false`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setServices(response.data);
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadServices();
    setRefreshing(false);
  };

  const handleOpenIntegration = (integration: Integration) => {
    setSelectedIntegration(integration);
    setEditForm({
      name: integration.name,
      description: integration.description,
      service_id: integration.service_id,
      service_name: integration.service_name,
      base_url: integration.base_url,
      endpoint: integration.endpoint,
      method: integration.method,
      api_key: integration.api_key,
      headers: integration.headers,
      timeout: integration.timeout,
      webhook_url: integration.webhook_url,
      is_active: integration.is_active,
      is_mock_mode: integration.is_mock_mode,
      request_mapping: integration.request_mapping,
      response_mapping: integration.response_mapping,
      last_test_status: integration.last_test_status,
      last_test_at: integration.last_test_at,
    });
    setHeadersText(JSON.stringify(integration.headers, null, 2));
    setEditMode(false);
    setModalVisible(true);
  };

  const handleNewIntegration = () => {
    setSelectedIntegration(null);
    setEditForm(DEFAULT_INTEGRATION);
    setHeadersText('{}');
    setEditMode(true);
    setModalVisible(true);
  };

  const handleSaveIntegration = () => {
    // Validation
    if (!editForm.name.trim()) {
      Alert.alert('Error', 'El nombre es requerido');
      return;
    }
    if (!editForm.base_url.trim()) {
      Alert.alert('Error', 'La URL base es requerida');
      return;
    }

    try {
      const headers = JSON.parse(headersText);
      
      if (selectedIntegration) {
        // Update existing
        updateIntegration(selectedIntegration.id, {
          ...editForm,
          headers,
        });
        Alert.alert('Éxito', 'Integración actualizada correctamente');
      } else {
        // Create new
        addIntegration({
          ...editForm,
          headers,
        });
        Alert.alert('Éxito', 'Integración creada correctamente');
      }
      
      setModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'Los headers deben ser un JSON válido');
    }
  };

  const handleDeleteIntegration = () => {
    if (!selectedIntegration) return;

    Alert.alert(
      'Eliminar Integración',
      `¿Estás seguro de eliminar "${selectedIntegration.name}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            deleteIntegration(selectedIntegration.id);
            setModalVisible(false);
            Alert.alert('Éxito', 'Integración eliminada');
          }
        }
      ]
    );
  };

  const handleLinkService = (serviceId: string | null) => {
    if (!selectedIntegration) return;
    
    if (serviceId) {
      const service = services.find(s => s.id === serviceId);
      if (service) {
        linkServiceToIntegration(selectedIntegration.id, serviceId, service.name);
        setEditForm({ ...editForm, service_id: serviceId, service_name: service.name });
      }
    } else {
      unlinkServiceFromIntegration(selectedIntegration.id);
      setEditForm({ ...editForm, service_id: null, service_name: undefined });
    }
  };

  const handleTestConnection = async () => {
    if (!selectedIntegration) return;
    
    setTesting(true);
    // Simulate API test
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const success = Math.random() > 0.3; // 70% success rate for demo
    updateTestStatus(selectedIntegration.id, success ? 'success' : 'error');
    
    // Update local state
    setSelectedIntegration({
      ...selectedIntegration,
      last_test_status: success ? 'success' : 'error',
      last_test_at: new Date().toISOString(),
    });
    
    setTesting(false);
    Alert.alert(
      success ? 'Conexión Exitosa' : 'Error de Conexión',
      success 
        ? 'La API respondió correctamente. La integración está lista para usarse.'
        : 'No se pudo conectar con la API. Verifica la URL y credenciales.',
      [{ text: 'OK' }]
    );
  };

  const handleToggleActive = () => {
    if (!selectedIntegration) return;
    toggleActive(selectedIntegration.id);
    setSelectedIntegration({
      ...selectedIntegration,
      is_active: !selectedIntegration.is_active,
    });
  };

  const handleToggleMockMode = () => {
    if (!selectedIntegration) return;
    toggleMockMode(selectedIntegration.id);
    setSelectedIntegration({
      ...selectedIntegration,
      is_mock_mode: !selectedIntegration.is_mock_mode,
    });
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'success': return colors.status.success;
      case 'error': return colors.status.error;
      case 'pending': return colors.status.warning;
      default: return colors.text.muted;
    }
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'success': return 'checkmark-circle';
      case 'error': return 'close-circle';
      case 'pending': return 'time';
      default: return 'help-circle';
    }
  };

  // Find services that are already linked
  const linkedServiceIds = integrations.map(i => i.service_id).filter(Boolean);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Integraciones API</Text>
          <Text style={styles.subtitle}>Configura las conexiones a servicios externos</Text>
        </View>
        <Button
          title="Nueva"
          onPress={handleNewIntegration}
          size="sm"
          icon={<Ionicons name="add" size={18} color={colors.text.inverse} />}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand.primary} />
        }
      >
        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{integrations.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.status.success }]}>
              {integrations.filter(i => i.is_active).length}
            </Text>
            <Text style={styles.statLabel}>Activas</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.brand.primary }]}>
              {integrations.filter(i => i.service_id).length}
            </Text>
            <Text style={styles.statLabel}>Vinculadas</Text>
          </View>
        </View>

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle" size={20} color={colors.status.info} />
          <Text style={styles.infoText}>
            Vincula cada integración a un servicio para que las órdenes se procesen automáticamente.
            El modo <Text style={styles.bold}>Mock</Text> devuelve datos simulados.
          </Text>
        </View>

        {/* Integrations List */}
        {integrations.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cloud-outline" size={64} color={colors.text.muted} />
            <Text style={styles.emptyTitle}>Sin integraciones</Text>
            <Text style={styles.emptyText}>Crea tu primera integración API</Text>
            <Button title="Crear Integración" onPress={handleNewIntegration} style={{ marginTop: spacing.lg }} />
          </View>
        ) : (
          integrations.map((integration) => (
            <TouchableOpacity
              key={integration.id}
              style={styles.integrationCard}
              onPress={() => handleOpenIntegration(integration)}
              activeOpacity={0.7}
            >
              <View style={styles.integrationHeader}>
                <View style={[
                  styles.statusDot,
                  { backgroundColor: integration.is_active ? colors.status.success : colors.text.muted }
                ]} />
                <View style={styles.integrationInfo}>
                  <Text style={styles.integrationName}>{integration.name}</Text>
                  <Text style={styles.integrationDesc}>{integration.description}</Text>
                </View>
                <View style={styles.integrationBadges}>
                  {integration.is_mock_mode && (
                    <View style={styles.mockBadge}>
                      <Text style={styles.mockBadgeText}>MOCK</Text>
                    </View>
                  )}
                  <Ionicons
                    name={getStatusIcon(integration.last_test_status)}
                    size={20}
                    color={getStatusColor(integration.last_test_status)}
                  />
                </View>
              </View>
              
              <View style={styles.integrationMeta}>
                <View style={styles.metaItem}>
                  <Ionicons name="link" size={14} color={colors.text.muted} />
                  <Text style={styles.metaText}>{integration.base_url}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="code-slash" size={14} color={colors.text.muted} />
                  <Text style={styles.metaText}>{integration.method} {integration.endpoint}</Text>
                </View>
              </View>

              {integration.service_name ? (
                <View style={styles.serviceLink}>
                  <Ionicons name="cube" size={14} color={colors.status.success} />
                  <Text style={styles.serviceLinkText}>Vinculado a: {integration.service_name}</Text>
                </View>
              ) : (
                <View style={styles.serviceLink}>
                  <Ionicons name="warning" size={14} color={colors.status.warning} />
                  <Text style={styles.serviceLinkWarning}>Sin servicio vinculado</Text>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Integration Detail/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editMode ? (selectedIntegration ? 'Editar' : 'Nueva') + ' Integración' : 'Detalle de Integración'}
            </Text>
            <View style={styles.modalActions}>
              {!editMode && selectedIntegration && (
                <Button
                  title="Editar"
                  variant="outline"
                  size="sm"
                  onPress={() => setEditMode(true)}
                />
              )}
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>
          </View>
          
          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            {editMode ? (
              <>
                <Input
                  label="Nombre de la Integración *"
                  value={editForm.name}
                  onChangeText={(text) => setEditForm({ ...editForm, name: text })}
                  placeholder="Ej: IMSS Historial Laboral"
                  icon="text-outline"
                />
                
                <Input
                  label="Descripción"
                  value={editForm.description}
                  onChangeText={(text) => setEditForm({ ...editForm, description: text })}
                  placeholder="Breve descripción de la integración"
                  icon="document-text-outline"
                />

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Vincular a Servicio</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.serviceSelector}>
                    <TouchableOpacity
                      style={[styles.serviceOption, !editForm.service_id && styles.serviceOptionActive]}
                      onPress={() => setEditForm({ ...editForm, service_id: null, service_name: undefined })}
                    >
                      <Text style={[styles.serviceOptionText, !editForm.service_id && styles.serviceOptionTextActive]}>
                        Ninguno
                      </Text>
                    </TouchableOpacity>
                    {services.map((service) => {
                      const isLinkedToOther = linkedServiceIds.includes(service.id) && editForm.service_id !== service.id;
                      return (
                        <TouchableOpacity
                          key={service.id}
                          style={[
                            styles.serviceOption, 
                            editForm.service_id === service.id && styles.serviceOptionActive,
                            isLinkedToOther && styles.serviceOptionDisabled
                          ]}
                          onPress={() => {
                            if (!isLinkedToOther) {
                              setEditForm({ ...editForm, service_id: service.id, service_name: service.name });
                            }
                          }}
                          disabled={isLinkedToOther}
                        >
                          <Text style={[
                            styles.serviceOptionText, 
                            editForm.service_id === service.id && styles.serviceOptionTextActive,
                            isLinkedToOther && styles.serviceOptionTextDisabled
                          ]}>
                            {service.name}
                            {isLinkedToOther && ' (vinculado)'}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                <Input
                  label="Base URL *"
                  value={editForm.base_url}
                  onChangeText={(text) => setEditForm({ ...editForm, base_url: text })}
                  placeholder="https://api.example.com"
                  icon="globe-outline"
                  autoCapitalize="none"
                />

                <Input
                  label="Endpoint *"
                  value={editForm.endpoint}
                  onChangeText={(text) => setEditForm({ ...editForm, endpoint: text })}
                  placeholder="/v1/consulta"
                  icon="code-slash-outline"
                  autoCapitalize="none"
                />

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Método HTTP</Text>
                  <View style={styles.methodSelector}>
                    {(['GET', 'POST', 'PUT', 'DELETE'] as const).map((method) => (
                      <TouchableOpacity
                        key={method}
                        style={[styles.methodOption, editForm.method === method && styles.methodOptionActive]}
                        onPress={() => setEditForm({ ...editForm, method })}
                      >
                        <Text style={[styles.methodText, editForm.method === method && styles.methodTextActive]}>
                          {method}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <Input
                  label="API Key / Token"
                  value={editForm.api_key}
                  onChangeText={(text) => setEditForm({ ...editForm, api_key: text })}
                  placeholder="sk_live_xxxx"
                  icon="key-outline"
                  secureTextEntry
                />

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Headers (JSON)</Text>
                  <TextInput
                    style={styles.codeInput}
                    value={headersText}
                    onChangeText={setHeadersText}
                    placeholder='{"Content-Type": "application/json"}'
                    placeholderTextColor={colors.text.muted}
                    multiline
                    numberOfLines={4}
                  />
                </View>

                <Input
                  label="Timeout (segundos)"
                  value={editForm.timeout.toString()}
                  onChangeText={(text) => setEditForm({ ...editForm, timeout: parseInt(text) || 30 })}
                  placeholder="30"
                  icon="time-outline"
                  keyboardType="numeric"
                />

                <Input
                  label="Webhook URL (opcional)"
                  value={editForm.webhook_url}
                  onChangeText={(text) => setEditForm({ ...editForm, webhook_url: text })}
                  placeholder="https://yoursite.com/webhook"
                  icon="git-branch-outline"
                  autoCapitalize="none"
                />

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Mapeo de Request (JSON Template)</Text>
                  <TextInput
                    style={styles.codeInput}
                    value={editForm.request_mapping}
                    onChangeText={(text) => setEditForm({ ...editForm, request_mapping: text })}
                    placeholder='{"field": "{{input.field}}"}'
                    placeholderTextColor={colors.text.muted}
                    multiline
                    numberOfLines={4}
                  />
                  <Text style={styles.formHint}>Usa {'{{input.campo}}'} para mapear campos del formulario</Text>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Mapeo de Response (JSON Template)</Text>
                  <TextInput
                    style={styles.codeInput}
                    value={editForm.response_mapping}
                    onChangeText={(text) => setEditForm({ ...editForm, response_mapping: text })}
                    placeholder='{"result": "{{response.data}}"}'
                    placeholderTextColor={colors.text.muted}
                    multiline
                    numberOfLines={4}
                  />
                  <Text style={styles.formHint}>Usa {'{{response.campo}}'} para extraer datos de la respuesta</Text>
                </View>

                <View style={styles.toggleRow}>
                  <View style={styles.toggleInfo}>
                    <Text style={styles.toggleLabel}>Modo Mock</Text>
                    <Text style={styles.toggleDesc}>Devuelve datos simulados sin llamar a la API real</Text>
                  </View>
                  <Switch
                    value={editForm.is_mock_mode}
                    onValueChange={(value) => setEditForm({ ...editForm, is_mock_mode: value })}
                    trackColor={{ false: colors.bg.tertiary, true: `${colors.status.warning}50` }}
                    thumbColor={editForm.is_mock_mode ? colors.status.warning : colors.text.muted}
                  />
                </View>

                <View style={styles.toggleRow}>
                  <View style={styles.toggleInfo}>
                    <Text style={styles.toggleLabel}>Integración Activa</Text>
                    <Text style={styles.toggleDesc}>Habilita esta integración para procesar órdenes</Text>
                  </View>
                  <Switch
                    value={editForm.is_active}
                    onValueChange={(value) => setEditForm({ ...editForm, is_active: value })}
                    trackColor={{ false: colors.bg.tertiary, true: `${colors.brand.primary}50` }}
                    thumbColor={editForm.is_active ? colors.brand.primary : colors.text.muted}
                  />
                </View>

                <Button
                  title={selectedIntegration ? 'Guardar Cambios' : 'Crear Integración'}
                  onPress={handleSaveIntegration}
                  loading={saving}
                  size="lg"
                  fullWidth
                  style={{ marginTop: spacing.lg }}
                />

                {selectedIntegration && (
                  <Button
                    title="Eliminar Integración"
                    variant="danger"
                    onPress={handleDeleteIntegration}
                    fullWidth
                    style={{ marginTop: spacing.md }}
                  />
                )}
              </>
            ) : selectedIntegration && (
              <>
                <View style={styles.detailHeader}>
                  <View style={[
                    styles.detailIcon,
                    { backgroundColor: selectedIntegration.is_active ? `${colors.status.success}20` : `${colors.text.muted}20` }
                  ]}>
                    <Ionicons
                      name="cloud"
                      size={32}
                      color={selectedIntegration.is_active ? colors.status.success : colors.text.muted}
                    />
                  </View>
                  <Text style={styles.detailName}>{selectedIntegration.name}</Text>
                  <Text style={styles.detailDesc}>{selectedIntegration.description}</Text>
                  <View style={styles.detailBadges}>
                    <View style={[styles.badge, { backgroundColor: selectedIntegration.is_active ? `${colors.status.success}20` : `${colors.text.muted}20` }]}>
                      <Text style={[styles.badgeText, { color: selectedIntegration.is_active ? colors.status.success : colors.text.muted }]}>
                        {selectedIntegration.is_active ? 'Activa' : 'Inactiva'}
                      </Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: `${colors.status.warning}20` }]}>
                      <Text style={[styles.badgeText, { color: colors.status.warning }]}>
                        {selectedIntegration.is_mock_mode ? 'Mock' : 'Real'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Service Link Section */}
                <Card style={styles.detailCard}>
                  <Text style={styles.cardTitle}>Servicio Vinculado</Text>
                  {selectedIntegration.service_name ? (
                    <View style={styles.linkedServiceBox}>
                      <View style={styles.linkedServiceInfo}>
                        <Ionicons name="cube" size={24} color={colors.status.success} />
                        <View>
                          <Text style={styles.linkedServiceName}>{selectedIntegration.service_name}</Text>
                          <Text style={styles.linkedServiceHint}>Las órdenes de este servicio usarán esta API</Text>
                        </View>
                      </View>
                      <Button
                        title="Desvincular"
                        variant="outline"
                        size="sm"
                        onPress={() => handleLinkService(null)}
                      />
                    </View>
                  ) : (
                    <>
                      <Text style={styles.noServiceText}>Selecciona un servicio para vincular:</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.serviceLinkSelector}>
                        {services.filter(s => !linkedServiceIds.includes(s.id)).map((service) => (
                          <TouchableOpacity
                            key={service.id}
                            style={styles.serviceLinkOption}
                            onPress={() => handleLinkService(service.id)}
                          >
                            <Ionicons name="cube-outline" size={20} color={colors.brand.primary} />
                            <Text style={styles.serviceLinkOptionText}>{service.name}</Text>
                            <Ionicons name="add-circle" size={18} color={colors.brand.primary} />
                          </TouchableOpacity>
                        ))}
                        {services.filter(s => !linkedServiceIds.includes(s.id)).length === 0 && (
                          <Text style={styles.allLinkedText}>Todos los servicios ya están vinculados</Text>
                        )}
                      </ScrollView>
                    </>
                  )}
                </Card>

                <Card style={styles.detailCard}>
                  <Text style={styles.cardTitle}>Configuración de API</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Base URL:</Text>
                    <Text style={styles.detailValue}>{selectedIntegration.base_url}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Endpoint:</Text>
                    <Text style={styles.detailValue}>{selectedIntegration.method} {selectedIntegration.endpoint}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Timeout:</Text>
                    <Text style={styles.detailValue}>{selectedIntegration.timeout}s</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>API Key:</Text>
                    <Text style={styles.detailValue}>{selectedIntegration.api_key ? '••••••••' : 'No configurada'}</Text>
                  </View>
                </Card>

                <Card style={styles.detailCard}>
                  <Text style={styles.cardTitle}>Estado de Conexión</Text>
                  <View style={styles.testStatus}>
                    <Ionicons
                      name={getStatusIcon(selectedIntegration.last_test_status)}
                      size={32}
                      color={getStatusColor(selectedIntegration.last_test_status)}
                    />
                    <View>
                      <Text style={styles.testStatusText}>
                        {selectedIntegration.last_test_status === 'success' ? 'Última prueba exitosa' :
                         selectedIntegration.last_test_status === 'error' ? 'Última prueba fallida' :
                         'Sin probar'}
                      </Text>
                      {selectedIntegration.last_test_at && (
                        <Text style={styles.testStatusDate}>
                          {new Date(selectedIntegration.last_test_at).toLocaleString()}
                        </Text>
                      )}
                    </View>
                  </View>
                  <Button
                    title={testing ? 'Probando...' : 'Probar Conexión'}
                    onPress={handleTestConnection}
                    variant="outline"
                    loading={testing}
                    fullWidth
                    icon={<Ionicons name="flash" size={18} color={colors.brand.primary} />}
                    style={{ marginTop: spacing.md }}
                  />
                </Card>

                <View style={styles.quickActions}>
                  <TouchableOpacity style={styles.quickAction} onPress={handleToggleActive}>
                    <Ionicons
                      name={selectedIntegration.is_active ? 'pause-circle' : 'play-circle'}
                      size={24}
                      color={selectedIntegration.is_active ? colors.status.warning : colors.status.success}
                    />
                    <Text style={styles.quickActionText}>
                      {selectedIntegration.is_active ? 'Desactivar' : 'Activar'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.quickAction} onPress={handleToggleMockMode}>
                    <Ionicons
                      name={selectedIntegration.is_mock_mode ? 'cloud-upload' : 'flask'}
                      size={24}
                      color={colors.brand.primary}
                    />
                    <Text style={styles.quickActionText}>
                      {selectedIntegration.is_mock_mode ? 'Modo Real' : 'Modo Mock'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ScrollView>
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
  subtitle: {
    fontSize: fontSize.xs,
    color: colors.text.muted,
    marginTop: 2,
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
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.text.muted,
    marginTop: 2,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: `${colors.status.info}15`,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  infoText: {
    flex: 1,
    fontSize: fontSize.xs,
    color: colors.status.info,
    lineHeight: 18,
  },
  bold: {
    fontWeight: fontWeight.bold,
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing['3xl'],
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginTop: spacing.lg,
  },
  emptyText: {
    fontSize: fontSize.base,
    color: colors.text.muted,
    marginTop: spacing.xs,
  },
  integrationCard: {
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  integrationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 6,
    marginRight: spacing.md,
  },
  integrationInfo: {
    flex: 1,
  },
  integrationName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  integrationDesc: {
    fontSize: fontSize.xs,
    color: colors.text.muted,
    marginTop: 2,
  },
  integrationBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  mockBadge: {
    backgroundColor: `${colors.status.warning}20`,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  mockBadgeText: {
    fontSize: fontSize.xs,
    color: colors.status.warning,
    fontWeight: fontWeight.bold,
  },
  integrationMeta: {
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    fontFamily: 'monospace',
  },
  serviceLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  serviceLinkText: {
    fontSize: fontSize.xs,
    color: colors.status.success,
    fontWeight: fontWeight.medium,
  },
  serviceLinkWarning: {
    fontSize: fontSize.xs,
    color: colors.status.warning,
    fontWeight: fontWeight.medium,
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
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  modalContent: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  formGroup: {
    marginBottom: spacing.md,
  },
  formLabel: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    fontWeight: fontWeight.medium,
  },
  formHint: {
    fontSize: fontSize.xs,
    color: colors.text.muted,
    marginTop: spacing.xs,
  },
  codeInput: {
    backgroundColor: colors.bg.tertiary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.text.primary,
    fontFamily: 'monospace',
    fontSize: fontSize.sm,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  serviceSelector: {
    flexDirection: 'row',
    maxHeight: 50,
  },
  serviceOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.bg.tertiary,
    marginRight: spacing.sm,
  },
  serviceOptionActive: {
    backgroundColor: colors.brand.primary,
  },
  serviceOptionDisabled: {
    opacity: 0.5,
  },
  serviceOptionText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  serviceOptionTextActive: {
    color: colors.text.inverse,
  },
  serviceOptionTextDisabled: {
    color: colors.text.muted,
  },
  methodSelector: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  methodOption: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.bg.tertiary,
    alignItems: 'center',
  },
  methodOptionActive: {
    backgroundColor: colors.brand.primary,
  },
  methodText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text.secondary,
  },
  methodTextActive: {
    color: colors.text.inverse,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.bg.card,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  toggleInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  toggleLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
  },
  toggleDesc: {
    fontSize: fontSize.xs,
    color: colors.text.muted,
    marginTop: 2,
  },
  // Detail view
  detailHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  detailIcon: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  detailName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: 4,
  },
  detailDesc: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  detailBadges: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  detailCard: {
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: fontSize.sm,
    color: colors.text.muted,
    marginBottom: spacing.md,
    fontWeight: fontWeight.semibold,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  detailLabel: {
    fontSize: fontSize.sm,
    color: colors.text.muted,
  },
  detailValue: {
    fontSize: fontSize.sm,
    color: colors.text.primary,
    fontWeight: fontWeight.medium,
    fontFamily: 'monospace',
  },
  linkedServiceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  linkedServiceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  linkedServiceName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  linkedServiceHint: {
    fontSize: fontSize.xs,
    color: colors.text.muted,
  },
  noServiceText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  serviceLinkSelector: {
    flexDirection: 'row',
  },
  serviceLinkOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.bg.tertiary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginRight: spacing.sm,
  },
  serviceLinkOptionText: {
    fontSize: fontSize.sm,
    color: colors.brand.primary,
    fontWeight: fontWeight.medium,
  },
  allLinkedText: {
    fontSize: fontSize.sm,
    color: colors.text.muted,
    fontStyle: 'italic',
  },
  testStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  testStatusText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
  },
  testStatusDate: {
    fontSize: fontSize.xs,
    color: colors.text.muted,
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  quickAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.bg.card,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  quickActionText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
  },
});
