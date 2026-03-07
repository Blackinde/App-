// Tramitly Constants

export const APP_NAME = 'Tramitly';
export const APP_TAGLINE = 'Trámites Digitales Simplificados';
export const APP_DESCRIPTION = 'Plataforma SaaS de trámites y consultas digitales en México';

export const ORDER_STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: string }> = {
  pending: { label: 'Pendiente', color: '#F59E0B', bgColor: 'rgba(245, 158, 11, 0.15)', icon: 'time-outline' },
  paid: { label: 'Pagado', color: '#3B82F6', bgColor: 'rgba(59, 130, 246, 0.15)', icon: 'card-outline' },
  processing: { label: 'En Proceso', color: '#6366F1', bgColor: 'rgba(99, 102, 241, 0.15)', icon: 'sync-outline' },
  completed: { label: 'Completado', color: '#10B981', bgColor: 'rgba(16, 185, 129, 0.15)', icon: 'checkmark-circle-outline' },
  failed: { label: 'Fallido', color: '#EF4444', bgColor: 'rgba(239, 68, 68, 0.15)', icon: 'close-circle-outline' },
  refunded: { label: 'Reembolsado', color: '#64748B', bgColor: 'rgba(100, 116, 139, 0.15)', icon: 'return-down-back-outline' },
};

export const SERVICE_CATEGORIES = [
  { id: 'seguridad-social', name: 'Seguridad Social', icon: 'shield-checkmark' },
  { id: 'identidad', name: 'Identidad', icon: 'person-circle' },
  { id: 'fiscal', name: 'Fiscal', icon: 'document-text' },
  { id: 'creditos', name: 'Créditos', icon: 'cash' },
];

export const FIELD_LABELS: Record<string, string> = {
  name: 'Nombre Completo',
  curp: 'CURP',
  nss: 'Número de Seguro Social (NSS)',
  rfc: 'RFC',
  email: 'Correo Electrónico',
  phone: 'Teléfono',
  address: 'Dirección',
};

export const FIELD_ICONS: Record<string, string> = {
  name: 'person-outline',
  curp: 'card-outline',
  nss: 'shield-checkmark-outline',
  rfc: 'document-text-outline',
  email: 'mail-outline',
  phone: 'call-outline',
  address: 'location-outline',
};

export const NAV_ITEMS = {
  public: [
    { label: 'Inicio', href: '/', icon: 'home-outline' },
    { label: 'Servicios', href: '/servicios', icon: 'grid-outline' },
    { label: 'Cómo Funciona', href: '/como-funciona', icon: 'information-circle-outline' },
    { label: 'FAQ', href: '/faq', icon: 'help-circle-outline' },
    { label: 'Contacto', href: '/contacto', icon: 'mail-outline' },
  ],
  dashboard: [
    { label: 'Dashboard', href: '/dashboard', icon: 'speedometer-outline' },
    { label: 'Mis Pedidos', href: '/dashboard/pedidos', icon: 'receipt-outline' },
    { label: 'Saldo', href: '/dashboard/saldo', icon: 'wallet-outline' },
    { label: 'Perfil', href: '/dashboard/perfil', icon: 'person-outline' },
  ],
  admin: [
    { label: 'Dashboard', href: '/admin', icon: 'speedometer-outline' },
    { label: 'Usuarios', href: '/admin/usuarios', icon: 'people-outline' },
    { label: 'Órdenes', href: '/admin/ordenes', icon: 'receipt-outline' },
    { label: 'Servicios', href: '/admin/servicios', icon: 'grid-outline' },
    { label: 'Configuración', href: '/admin/configuracion', icon: 'settings-outline' },
  ],
};
