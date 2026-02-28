/**
 * Environment configuration for development
 */

export const environment = {
  production: false,
  apiUrl: 'http://doctech.solutions',
  appName: 'Shree Clinic Management System',
  version: '1.0.0',
  buildNumber: '2024.1.0',
  
  // API Endpoints
  endpoints: {
    auth: {
      login: '/api/auth/login',
      refresh: '/api/auth/refresh',
      logout: '/api/auth/logout',
      forgotPassword: '/api/auth/forgot-password',
      resetPassword: '/api/auth/reset-password'
    },
    doctors: {
      base: '/api/doctors',
      invite: '/api/doctors/invite',
      profile: '/api/doctors/profile'
    },
    patients: {
      base: '/api/patients',
      profile: '/api/patients/profile'
    },
    appointments: {
      base: '/api/appointments',
      schedule: '/api/appointments/schedule'
    },
    chat: {
      base: '/api/chat',
      ws: 'wss://doctech.solutions/ws/chat'
    },
    billing: {
      base: '/api/billing',
      invoices: '/api/billing/invoices',
      payments: '/api/billing/payments',
      pdf: '/api/billing/invoices/pdf'
    },
    baseConfiguration: {
      base: '/base/util/rest/BaseConfiguration',
      details: '/base/util/rest/BaseConfiguration/getBaseConfigurationDetails',
      count: '/base/util/rest/BaseConfiguration/count',
      getByTag: '/base/util/rest/BaseConfiguration/getBaseConfigByTag',
      getByKeyTypeApp: '/base/util/rest/BaseConfiguration/key-type-app'
    },
    hospitals: {
      base: '/api/hospitals',
      register: '/api/hospitals'
    },
    staff: {
      base: '/api/staff',
      invite: '/api/staff/invite',
      acceptInvite: '/api/staff/accept-invite',
      active: '/api/staff/active',
      available: '/api/staff/available',
      byDepartment: (deptId: number) => `/api/staff/by-department/${deptId}`,
      approve: (id: number) => `/api/staff/${id}/approve`,
      availability: (id: number) => `/api/staff/${id}/availability`
    },
    roles: {
      base: '/api/roles',
      byId: (id: string) => `/api/roles/${id}`,
      permissions: (roleId: string) => `/api/roles/${roleId}/permissions`,
      grantPermission: (roleId: string, featureId: string) => `/api/roles/${roleId}/permissions/grant/${featureId}`,
      revokePermission: (roleId: string, permId: string) => `/api/roles/${roleId}/permissions/revoke/${permId}`
    },
    departments: {
      base: '/api/departments',
      byId: (id: number) => `/api/departments/${id}`,
      staff: (deptId: number) => `/api/departments/${deptId}/staff`
    },
    catalog: {
      features: '/api/catalog/features',
      services: '/api/catalog/services'
    }
  },
  
  // Feature flags
  features: {
    enableAnalytics: false,
    enableDebugMode: true,
    enablePerformanceMonitoring: false,
    enableMockBilling: false,
    /** When true, invite doctor returns success without calling backend (use until backend implements POST invite) */
    enableMockDoctorInvite: true
  },
  
  // Security settings
  security: {
    tokenExpiryWarningMinutes: 5,
    maxLoginAttempts: 5,
    lockoutDurationMinutes: 15
  },
  
  // UI Configuration
  ui: {
    defaultLanguage: 'en',
    supportedLanguages: ['en', 'hi'],
    theme: 'light',
    pageSize: 20,
    maxFileSize: 10 * 1024 * 1024 // 10MB
  }
};

