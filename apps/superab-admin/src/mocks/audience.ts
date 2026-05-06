export interface Attribute {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array';
  description: string;
  category: string;
}

export interface BehaviorRule {
  id: string;
  attribute: string;
  operator: '=' | '!=' | '>' | '<' | 'in' | 'contains';
  value: string | number | boolean | string[];
}

export interface AudienceSegment {
  id: string;
  name: string;
  description: string;
  rules: BehaviorRule[];
  estimatedSize: number;
  activePaywalls: number;
  createdAt: string;
}

export const mockAttributes: Attribute[] = [
  { id: 'attr-001', name: 'app_version', type: 'string', description: '应用版本号', category: '设备' },
  { id: 'attr-002', name: 'platform', type: 'string', description: '平台类型（iOS/Android/Web）', category: '设备' },
  { id: 'attr-003', name: 'os_version', type: 'string', description: '操作系统版本', category: '设备' },
  { id: 'attr-004', name: 'device_model', type: 'string', description: '设备型号', category: '设备' },
  { id: 'attr-005', name: 'language', type: 'string', description: '系统语言', category: '设备' },
  { id: 'attr-006', name: 'screen_size', type: 'string', description: '屏幕分辨率', category: '设备' },
  { id: 'attr-007', name: 'days_since_install', type: 'number', description: '安装后天数', category: '行为' },
  { id: 'attr-008', name: 'session_count', type: 'number', description: '会话总数', category: '行为' },
  { id: 'attr-009', name: 'last_seen_days', type: 'number', description: '最近活跃距今天数', category: '行为' },
  { id: 'attr-010', name: 'paywall_views', type: 'number', description: '付费墙查看次数', category: '行为' },
  { id: 'attr-011', name: 'has_seen_paywall', type: 'boolean', description: '是否查看过付费墙', category: '行为' },
  { id: 'attr-012', name: 'has_trialed', type: 'boolean', description: '是否曾经试用', category: '行为' },
  { id: 'attr-013', name: 'has_converted', type: 'boolean', description: '是否已转化', category: '行为' },
  { id: 'attr-014', name: 'has_cancelled', type: 'boolean', description: '是否曾取消订阅', category: '行为' },
  { id: 'attr-015', name: 'subscription_status', type: 'string', description: '当前订阅状态', category: '订阅' },
  { id: 'attr-016', name: 'current_plan', type: 'string', description: '当前订阅方案', category: '订阅' },
  { id: 'attr-017', name: 'ltv', type: 'number', description: '用户生命周期价值', category: '订阅' },
  { id: 'attr-018', name: 'purchase_count', type: 'number', description: '累计购买次数', category: '订阅' },
  { id: 'attr-019', name: 'total_spent', type: 'number', description: '累计消费金额', category: '订阅' },
  { id: 'attr-020', name: 'country', type: 'string', description: '国家/地区', category: '地理' },
  { id: 'attr-021', name: 'region', type: 'string', description: '区域', category: '地理' },
  { id: 'attr-022', name: 'timezone', type: 'string', description: '时区', category: '地理' },
  { id: 'attr-023', name: 'utm_source', type: 'string', description: '流量来源', category: '归因' },
  { id: 'attr-024', name: 'utm_campaign', type: 'string', description: '营销活动', category: '归因' },
  { id: 'attr-025', name: 'referral_code', type: 'string', description: '邀请码', category: '归因' },
];

export const mockSegments: AudienceSegment[] = [
  {
    id: 'seg-001',
    name: '高价值用户',
    description: 'LTV 超过 ¥200 且已转化的用户',
    rules: [
      { id: 'rule-001', attribute: 'ltv', operator: '>', value: 200 },
      { id: 'rule-002', attribute: 'has_converted', operator: '=', value: true },
    ],
    estimatedSize: 12500,
    activePaywalls: 2,
    createdAt: '2026-03-01T08:00:00Z',
  },
  {
    id: 'seg-002',
    name: '流失风险用户',
    description: '最近 7 天未活跃且从未转化的用户',
    rules: [
      { id: 'rule-003', attribute: 'last_seen_days', operator: '>', value: 7 },
      { id: 'rule-004', attribute: 'has_converted', operator: '=', value: false },
    ],
    estimatedSize: 34000,
    activePaywalls: 1,
    createdAt: '2026-03-15T10:00:00Z',
  },
  {
    id: 'seg-003',
    name: '新用户（7天内）',
    description: '安装后 7 天内的新用户',
    rules: [
      { id: 'rule-005', attribute: 'days_since_install', operator: '<', value: 7 },
    ],
    estimatedSize: 28000,
    activePaywalls: 3,
    createdAt: '2026-02-20T09:00:00Z',
  },
  {
    id: 'seg-004',
    name: 'iOS 高付费意愿',
    description: 'iOS 平台且查看过付费墙 3 次以上的用户',
    rules: [
      { id: 'rule-006', attribute: 'platform', operator: '=', value: 'ios' },
      { id: 'rule-007', attribute: 'paywall_views', operator: '>', value: 3 },
    ],
    estimatedSize: 8900,
    activePaywalls: 2,
    createdAt: '2026-04-01T11:00:00Z',
  },
  {
    id: 'seg-005',
    name: '取消订阅用户',
    description: '曾经取消过订阅的用户，适合挽回活动',
    rules: [
      { id: 'rule-008', attribute: 'has_cancelled', operator: '=', value: true },
    ],
    estimatedSize: 5600,
    activePaywalls: 1,
    createdAt: '2026-04-10T08:00:00Z',
  },
];
