export interface Webhook {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  secret: string;
  createdAt: string;
}

export interface BrandSettings {
  name: string;
  logo: string;
  primaryColor: string;
  accentColor: string;
}

export interface EnvironmentSettings {
  mode: 'development' | 'production' | 'staging';
  apiKey: string;
  debugMode: boolean;
  sdkVersion: string;
}

export interface Settings {
  brand: BrandSettings;
  environment: EnvironmentSettings;
  webhooks: Webhook[];
}

export const mockSettings: Settings = {
  brand: {
    name: 'GateFlow Demo',
    logo: '',
    primaryColor: '#8b5cf6',
    accentColor: '#06b6d4',
  },
  environment: {
    mode: 'development',
    apiKey: 'gf_live_••••••••••••••••••••',
    debugMode: true,
    sdkVersion: '2.3.1',
  },
  webhooks: [
    {
      id: 'wh-001',
      url: 'https://api.example.com/webhooks/gateflow',
      events: ['conversion', 'trial'],
      active: true,
      secret: 'whsec_••••••••••••',
      createdAt: '2026-04-01T08:00:00Z',
    },
    {
      id: 'wh-002',
      url: 'https://hooks.slack.com/services/xxx/yyy/zzz',
      events: ['error'],
      active: true,
      secret: 'whsec_••••••••••••',
      createdAt: '2026-04-15T10:00:00Z',
    },
    {
      id: 'wh-003',
      url: 'https://analytics.example.com/ingest',
      events: ['conversion', 'trial'],
      active: false,
      secret: 'whsec_••••••••••••',
      createdAt: '2026-03-20T09:00:00Z',
    },
  ],
};
