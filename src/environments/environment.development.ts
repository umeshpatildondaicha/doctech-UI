/**
 * Environment configuration for development
 */

export const environment = {
  production: false,
  apiUrl: 'http://doctech.solutions', // Use www subdomain to avoid redirects
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
      // Backend ChatConnectHandler is at /ws/chat.
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
    }
  },
  
  // Feature flags
  features: {
    enableAnalytics: false,
    enableDebugMode: true,
    enablePerformanceMonitoring: false,
    enableMockBilling: true,
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
