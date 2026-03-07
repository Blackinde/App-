import { create } from 'zustand';

export interface Integration {
  id: string;
  name: string;
  description: string;
  service_id: string | null;
  service_name?: string;
  base_url: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  api_key: string;
  headers: Record<string, string>;
  timeout: number;
  webhook_url: string;
  is_active: boolean;
  is_mock_mode: boolean;
  request_mapping: string;
  response_mapping: string;
  last_test_status: 'success' | 'error' | 'pending' | null;
  last_test_at: string | null;
  created_at: string;
}

// Initial demo integrations
const INITIAL_INTEGRATIONS: Integration[] = [
  {
    id: 'int-1',
    name: 'IMSS Historial Laboral',
    description: 'Consulta historial laboral vía API del IMSS',
    service_id: null,
    service_name: undefined,
    base_url: 'https://api.imss.gob.mx',
    endpoint: '/v1/historial-laboral',
    method: 'POST',
    api_key: 'sk_imss_demo_key',
    headers: { 'Content-Type': 'application/json' },
    timeout: 30,
    webhook_url: '',
    is_active: true,
    is_mock_mode: true,
    request_mapping: '{"nss": "{{input.nss}}", "curp": "{{input.curp}}"}',
    response_mapping: '{"semanas": "{{response.semanas_cotizadas}}", "patron": "{{response.ultimo_patron}}"}',
    last_test_status: 'success',
    last_test_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: 'int-2',
    name: 'SAT Constancia Fiscal',
    description: 'Generación de constancia de situación fiscal',
    service_id: null,
    service_name: undefined,
    base_url: 'https://api.sat.gob.mx',
    endpoint: '/v1/constancia-situacion',
    method: 'POST',
    api_key: 'sk_sat_demo_key',
    headers: { 'Content-Type': 'application/json', 'X-SAT-Version': '2.0' },
    timeout: 60,
    webhook_url: 'https://tramitly.mx/webhooks/sat',
    is_active: false,
    is_mock_mode: true,
    request_mapping: '{"rfc": "{{input.rfc}}"}',
    response_mapping: '{"pdf_url": "{{response.documento_url}}", "vigencia": "{{response.vigencia}}"}',
    last_test_status: 'error',
    last_test_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: 'int-3',
    name: 'RENAPO CURP',
    description: 'Verificación de CURP vía RENAPO',
    service_id: null,
    service_name: undefined,
    base_url: 'https://api.renapo.gob.mx',
    endpoint: '/v2/consulta-curp',
    method: 'GET',
    api_key: '',
    headers: {},
    timeout: 15,
    webhook_url: '',
    is_active: true,
    is_mock_mode: true,
    request_mapping: '{"curp": "{{input.curp}}"}',
    response_mapping: '{"nombre": "{{response.nombres}}", "apellidos": "{{response.apellido1}} {{response.apellido2}}"}',
    last_test_status: 'pending',
    last_test_at: null,
    created_at: new Date().toISOString(),
  },
];

interface IntegrationsState {
  integrations: Integration[];
  isLoading: boolean;
  
  // Actions
  loadIntegrations: () => void;
  addIntegration: (integration: Omit<Integration, 'id' | 'created_at'>) => Integration;
  updateIntegration: (id: string, updates: Partial<Integration>) => void;
  deleteIntegration: (id: string) => void;
  linkServiceToIntegration: (integrationId: string, serviceId: string, serviceName: string) => void;
  unlinkServiceFromIntegration: (integrationId: string) => void;
  getIntegrationForService: (serviceId: string) => Integration | undefined;
  getIntegrationById: (id: string) => Integration | undefined;
  toggleActive: (id: string) => void;
  toggleMockMode: (id: string) => void;
  updateTestStatus: (id: string, status: 'success' | 'error' | 'pending') => void;
}

export const useIntegrationsStore = create<IntegrationsState>()(
  (set, get) => ({
    integrations: INITIAL_INTEGRATIONS,
    isLoading: false,

    loadIntegrations: () => {
      // Already loaded from initial state
      set({ isLoading: false });
    },

    addIntegration: (integrationData) => {
      const newIntegration: Integration = {
        ...integrationData,
        id: `int-${Date.now()}`,
        created_at: new Date().toISOString(),
      };
      
      set((state) => ({
        integrations: [...state.integrations, newIntegration]
      }));
      
      return newIntegration;
    },

    updateIntegration: (id, updates) => {
      set((state) => ({
        integrations: state.integrations.map((int) =>
          int.id === id ? { ...int, ...updates } : int
        )
      }));
    },

    deleteIntegration: (id) => {
      set((state) => ({
        integrations: state.integrations.filter((int) => int.id !== id)
      }));
    },

    linkServiceToIntegration: (integrationId, serviceId, serviceName) => {
      set((state) => ({
        integrations: state.integrations.map((int) => {
          // First, unlink this service from any other integration
          if (int.service_id === serviceId && int.id !== integrationId) {
            return { ...int, service_id: null, service_name: undefined };
          }
          // Then link to the target integration
          if (int.id === integrationId) {
            return { ...int, service_id: serviceId, service_name: serviceName };
          }
          return int;
        })
      }));
    },

    unlinkServiceFromIntegration: (integrationId) => {
      set((state) => ({
        integrations: state.integrations.map((int) =>
          int.id === integrationId
            ? { ...int, service_id: null, service_name: undefined }
            : int
        )
      }));
    },

    getIntegrationForService: (serviceId) => {
      return get().integrations.find((int) => int.service_id === serviceId);
    },

    getIntegrationById: (id) => {
      return get().integrations.find((int) => int.id === id);
    },

    toggleActive: (id) => {
      set((state) => ({
        integrations: state.integrations.map((int) =>
          int.id === id ? { ...int, is_active: !int.is_active } : int
        )
      }));
    },

    toggleMockMode: (id) => {
      set((state) => ({
        integrations: state.integrations.map((int) =>
          int.id === id ? { ...int, is_mock_mode: !int.is_mock_mode } : int
        )
      }));
    },

    updateTestStatus: (id, status) => {
      set((state) => ({
        integrations: state.integrations.map((int) =>
          int.id === id
            ? { ...int, last_test_status: status, last_test_at: new Date().toISOString() }
            : int
        )
      }));
    },
  })
);
