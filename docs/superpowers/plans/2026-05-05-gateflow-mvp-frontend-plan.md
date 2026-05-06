# GateFlow MVP 前端工程实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 从零搭建 pnpm Monorepo，交付 Marketing Website（9 页）和 Admin Console（7 页）完整前端，纯前端 + Mock 数据。

**Architecture:** pnpm Workspace Monorepo。`packages/shared` 提供设计 Token 与通用组件，`apps/marketing` 和 `apps/admin` 各自独立 Vite + React 应用，通过 workspace 协议引用 shared 包。

**Tech Stack:** React 18 + TypeScript + Vite 5 + Tailwind CSS v4 + React Router v6 + zustand + Recharts + @dnd-kit/core + Lucide React + Headless UI + MDX

---

## 文件结构与分工

```
gate-flow/
├── pnpm-workspace.yaml
├── package.json
├── tsconfig.base.json
├── .gitignore
├── .npmrc
│
├── packages/shared/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── src/
│       ├── index.ts
│       ├── tokens/        # 设计 Token（colors, typography, spacing, radius, shadows, breakpoints）
│       ├── hooks/         # useMediaQuery, useLocalStorage
│       ├── utils/         # cn (tailwind-merge + clsx)
│       └── components/    # Button, Input, Card, Modal, Container
│
├── apps/marketing/
│   ├── package.json
│   ├── tsconfig.json → ../../tsconfig.base.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── index.html
│   ├── public/images/     # 从 front/images/ 迁移
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── index.css
│       ├── data/           # 静态数据常量
│       │   ├── navigation.ts
│       │   ├── features.ts
│       │   ├── pricing.ts
│       │   ├── showcase.ts
│       │   └── customers.ts
│       ├── content/        # MDX 文档 / 博客内容
│       │   ├── docs/
│       │   └── blog/
│       ├── layouts/
│       │   ├── MainLayout.tsx
│       │   ├── DocsLayout.tsx
│       │   ├── Header.tsx
│       │   └── Footer.tsx
│       ├── pages/
│       │   ├── HomePage.tsx
│       │   ├── PricingPage.tsx
│       │   ├── DocsPage.tsx
│       │   ├── DocsDetailPage.tsx
│       │   ├── BlogPage.tsx
│       │   ├── BlogDetailPage.tsx
│       │   ├── CustomersPage.tsx
│       │   ├── CommunityPage.tsx
│       │   ├── PrivacyPage.tsx
│       │   └── TermsPage.tsx
│       └── components/
│           ├── home/       # HeroSection, CoreCapabilities, Differentiators, ArchitectureDiagram, TrustSection, CTABanner
│           ├── docs/       # DocsSidebar, DocsContent, DocsTOC
│           ├── pricing/    # PricingCard, PricingFAQ
│           ├── blog/       # BlogCard, BlogList
│           ├── customers/  # CaseCard
│           ├── community/  # CommunityChannels, VideoTutorials
│           └── shared/     # SectionLabel, GradientText, GradientBorder
│
└── apps/admin/
    ├── package.json
    ├── tsconfig.json → ../../tsconfig.base.json
    ├── vite.config.ts
    ├── tailwind.config.ts
    ├── index.html
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── index.css
        ├── mocks/
        │   ├── paywalls.ts
        │   ├── templates.ts
        │   ├── experiments.ts
        │   ├── analytics.ts
        │   ├── audience.ts
        │   └── settings.ts
        ├── stores/
        │   ├── paywallStore.ts
        │   ├── templateStore.ts
        │   ├── experimentStore.ts
        │   ├── analyticsStore.ts
        │   ├── audienceStore.ts
        │   └── settingsStore.ts
        ├── layouts/
        │   ├── AdminLayout.tsx
        │   ├── Sidebar.tsx
        │   ├── TopBar.tsx
        │   └── Breadcrumb.tsx
        ├── pages/
        │   ├── DashboardPage.tsx
        │   ├── PaywallsPage.tsx
        │   ├── PaywallEditorPage.tsx
        │   ├── TemplatesPage.tsx
        │   ├── ExperimentsPage.tsx
        │   ├── ExperimentDetailPage.tsx
        │   ├── AudiencePage.tsx
        │   └── SettingsPage.tsx
        └── components/
            ├── dashboard/   # StatsCard, ConversionFunnel, RevenueChart, RealTimeEvents, TopPaywalls
            ├── paywalls/    # PaywallList, PaywallCard, PaywallStatusBadge, CreatePaywallModal
            ├── editor/      # EditorCanvas, ComponentPanel, PropertyPanel, EditorToolbar, PreviewPanel, layers/*, VersionHistory
            ├── templates/   # TemplateGrid, TemplateCard, TemplateFilter, TemplatePreview
            ├── experiments/ # ExperimentList, ExperimentForm, VariantComparison, ExperimentResults, TrafficAllocation
            ├── audience/    # AttributeList, BehaviorRuleBuilder, AudienceSegment
            ├── settings/    # BrandSettings, WebhookManager, EnvironmentSelector
            └── shared/      # DataTable, FilterBar, SearchInput, ConfirmDialog, LoadingSkeleton, StatusBadge
```

---

## 阶段 1：基础设施（Shared + 双 App Scaffold）

---

### Task 1: 根 Monorepo 初始化

**Files:**
- Create: `pnpm-workspace.yaml`, `package.json`, `tsconfig.base.json`, `.npmrc`, `.gitignore`

- [ ] **Step 1: 创建根 package.json**

```json
{
  "name": "gate-flow",
  "private": true,
  "scripts": {
    "dev": "pnpm -r --parallel dev",
    "dev:marketing": "pnpm --filter @gate-flow/marketing dev",
    "dev:admin": "pnpm --filter @gate-flow/admin dev",
    "build": "pnpm -r build",
    "lint": "pnpm -r lint",
    "typecheck": "pnpm -r typecheck"
  },
  "engines": { "node": ">=18", "pnpm": ">=9" }
}
```

- [ ] **Step 2: 创建 pnpm-workspace.yaml**

```yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

- [ ] **Step 3: 创建 .npmrc**

```
shamefully-hoist=true
strict-peer-dependencies=false
```

- [ ] **Step 4: 创建 tsconfig.base.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "baseUrl": ".",
    "paths": {
      "@gate-flow/shared": ["packages/shared/src"],
      "@gate-flow/shared/*": ["packages/shared/src/*"]
    }
  },
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 5: 创建 .gitignore**

```
node_modules/
dist/
.env
.env.local
*.log
.superpowers/
```

- [ ] **Step 6: 安装 pnpm 并初始化**

```bash
pnpm install
```

- [ ] **Step 7: Commit**

```bash
git add pnpm-workspace.yaml package.json tsconfig.base.json .npmrc .gitignore pnpm-lock.yaml
git commit -m "feat: initialize pnpm monorepo root"
```

---

### Task 2: 共享包 `@gate-flow/shared` 初始化

**Files:**
- Create: `packages/shared/package.json`, `packages/shared/tsconfig.json`, `packages/shared/vite.config.ts`, `packages/shared/src/index.ts`

- [ ] **Step 1: 创建 packages/shared/package.json**

```json
{
  "name": "@gate-flow/shared",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./tokens": "./src/tokens/index.ts",
    "./hooks": "./src/hooks/index.ts",
    "./utils": "./src/utils/index.ts",
    "./components": "./src/components/index.ts",
    "./styles": "./src/styles/global.css"
  },
  "scripts": {
    "typecheck": "tsc --noEmit",
    "lint": "echo ok"
  },
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  },
  "dependencies": {
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "typescript": "^5.6.0"
  }
}
```

- [ ] **Step 2: 创建 packages/shared/tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: 创建 packages/shared/src/index.ts**

```typescript
export * from './tokens';
export * from './hooks';
export * from './utils';
export * from './components';
```

- [ ] **Step 4: 安装依赖并验证**

```bash
pnpm install
cd packages/shared && pnpm typecheck
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add packages/shared/
git commit -m "feat: scaffold @gate-flow/shared package"
```

---

### Task 3: 设计 Token

**Files:**
- Create: `packages/shared/src/tokens/colors.ts`, `typography.ts`, `spacing.ts`, `radius.ts`, `shadows.ts`, `breakpoints.ts`, `index.ts`

- [ ] **Step 1: 创建 colors.ts**

```typescript
export const colors = {
  brand: {
    purple: '#8b5cf6',
    cyan: '#06b6d4',
    amber: '#f59e0b',
  },
  bg: {
    primary: '#0a0a0f',
    secondary: '#12121a',
    card: '#1a1a2e',
    cardHover: '#22223a',
  },
  text: {
    primary: '#f1f1f7',
    secondary: '#a1a1b5',
    muted: '#6b6b80',
  },
  border: 'rgba(255, 255, 255, 0.06)',
  borderHover: 'rgba(139, 92, 246, 0.3)',
  semantic: {
    success: '#22c55e',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6',
  },
} as const;
```

- [ ] **Step 2: 创建 typography.ts**

```typescript
export const typography = {
  fontFamily: {
    sans: "'Inter', 'Noto Sans SC', -apple-system, BlinkMacSystemFont, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', monospace",
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
    '6xl': '3.75rem',
  },
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
  },
} as const;
```

- [ ] **Step 3: 创建 spacing.ts**

```typescript
export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
  '3xl': '64px',
  '4xl': '96px',
  '5xl': '128px',
} as const;
```

- [ ] **Step 4: 创建 radius.ts**

```typescript
export const radius = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '24px',
} as const;
```

- [ ] **Step 5: 创建 shadows.ts**

```typescript
export const shadows = {
  card: '0 4px 24px rgba(0, 0, 0, 0.3)',
  cardHover: '0 8px 40px rgba(139, 92, 246, 0.1)',
  dropdown: '0 10px 40px rgba(0, 0, 0, 0.4)',
  modal: '0 20px 60px rgba(0, 0, 0, 0.5)',
  glow: '0 0 60px rgba(139, 92, 246, 0.15)',
} as const;
```

- [ ] **Step 6: 创建 breakpoints.ts**

```typescript
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;
```

- [ ] **Step 7: 创建 tokens/index.ts**

```typescript
export { colors } from './colors';
export { typography } from './typography';
export { spacing } from './spacing';
export { radius } from './radius';
export { shadows } from './shadows';
export { breakpoints } from './breakpoints';
```

- [ ] **Step 8: 验证类型检查**

```bash
cd packages/shared && pnpm typecheck
```

Expected: No errors.

- [ ] **Step 9: Commit**

```bash
git add packages/shared/src/tokens/
git commit -m "feat: add design tokens (colors, typography, spacing, radius, shadows, breakpoints)"
```

---

### Task 4: 共享 Hooks

**Files:**
- Create: `packages/shared/src/hooks/useMediaQuery.ts`, `useLocalStorage.ts`, `index.ts`

- [ ] **Step 1: 创建 useMediaQuery.ts**

```typescript
import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    setMatches(mql.matches);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}
```

- [ ] **Step 2: 创建 useLocalStorage.ts**

```typescript
import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch { /* noop */ }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}
```

- [ ] **Step 3: 创建 hooks/index.ts**

```typescript
export { useMediaQuery } from './useMediaQuery';
export { useLocalStorage } from './useLocalStorage';
```

- [ ] **Step 4: 验证**

```bash
cd packages/shared && pnpm typecheck
```

- [ ] **Step 5: Commit**

```bash
git add packages/shared/src/hooks/
git commit -m "feat: add shared hooks (useMediaQuery, useLocalStorage)"
```

---

### Task 5: 共享 Utils

**Files:**
- Create: `packages/shared/src/utils/cn.ts`, `utils/index.ts`

- [ ] **Step 1: 创建 cn.ts**

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 2: 创建 utils/index.ts**

```typescript
export { cn } from './cn';
```

- [ ] **Step 3: 验证**

```bash
cd packages/shared && pnpm typecheck
```

- [ ] **Step 4: Commit**

```bash
git add packages/shared/src/utils/
git commit -m "feat: add shared utility (cn with clsx + tailwind-merge)"
```

---

### Task 6: 共享基础组件（Button, Card, Container）

**Files:**
- Create: `packages/shared/src/components/Button.tsx`, `Card.tsx`, `Container.tsx`, `Badge.tsx`, `components/index.ts`

- [ ] **Step 1: 创建 Button.tsx**

```typescript
import React from 'react';
import { cn } from '../utils/cn';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-gradient-to-br from-[#8b5cf6] to-[#06b6d4] text-white hover:shadow-lg hover:shadow-purple-500/25 hover:-translate-y-px',
  secondary: 'bg-white/5 text-white hover:bg-white/10 border border-white/10',
  outline: 'bg-transparent text-white border border-white/10 hover:border-purple-500/30 hover:bg-purple-500/5',
  ghost: 'bg-transparent text-slate-400 hover:text-white hover:bg-white/5',
  danger: 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-md gap-1.5',
  md: 'px-4 py-2 text-sm rounded-lg gap-2',
  lg: 'px-6 py-3 text-base rounded-xl gap-2.5',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : leftIcon}
      {children}
      {rightIcon}
    </button>
  );
}
```

- [ ] **Step 2: 创建 Card.tsx**

```typescript
import React from 'react';
import { cn } from '../utils/cn';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export function Card({ children, className, hover = false, padding = 'md' }: CardProps) {
  return (
    <div
      className={cn(
        'bg-[#1a1a2e] border border-white/[0.06] rounded-2xl',
        paddingClasses[padding],
        hover && 'transition-all duration-300 hover:border-purple-500/30 hover:bg-[#22223a] hover:shadow-lg hover:shadow-purple-500/5 hover:-translate-y-0.5',
        className
      )}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 3: 创建 Container.tsx**

```typescript
import React from 'react';
import { cn } from '../utils/cn';

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'main' | 'header' | 'footer';
}

export function Container({ children, className, as: Tag = 'div' }: ContainerProps) {
  return (
    <Tag className={cn('max-w-[1200px] mx-auto px-6 lg:px-8', className)}>
      {children}
    </Tag>
  );
}
```

- [ ] **Step 4: 创建 Badge.tsx**

```typescript
import React from 'react';
import { cn } from '../utils/cn';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  dot?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  danger: 'bg-red-500/10 text-red-400 border-red-500/20',
  info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
};

export function Badge({ children, variant = 'default', className, dot = false }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border',
        variantClasses[variant],
        className
      )}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
      {children}
    </span>
  );
}
```

- [ ] **Step 5: 创建 components/index.ts**

```typescript
export { Button } from './Button';
export { Card } from './Card';
export { Container } from './Container';
export { Badge } from './Badge';
```

- [ ] **Step 6: 验证**

```bash
cd packages/shared && pnpm typecheck
```

- [ ] **Step 7: Commit**

```bash
git add packages/shared/src/components/
git commit -m "feat: add shared base components (Button, Card, Container, Badge)"
```

---

### Task 7: Marketing App Scaffold

**Files:**
- Create: `apps/marketing/package.json`, `tsconfig.json`, `vite.config.ts`, `tailwind.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`, `src/vite-env.d.ts`

- [ ] **Step 1: 创建 apps/marketing/package.json**

```json
{
  "name": "@gate-flow/marketing",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit",
    "lint": "echo ok"
  },
  "dependencies": {
    "@gate-flow/shared": "workspace:*",
    "@mdx-js/mdx": "^3.0.0",
    "@mdx-js/react": "^3.0.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.26.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.6.0",
    "vite": "^5.4.0"
  }
}
```

- [ ] **Step 2: 创建 apps/marketing/tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"],
  "references": [{ "path": "../../packages/shared" }]
}
```

- [ ] **Step 3: 创建 apps/marketing/vite.config.ts**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: { port: 3000 },
});
```

- [ ] **Step 4: 创建 apps/marketing/index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Noto+Sans+SC:wght@300;400;500;700;900&display=swap" rel="stylesheet" />
    <title>GateFlow - AI 驱动的付费墙增长基础设施</title>
    <meta name="description" content="GateFlow 是面向移动应用与 Web 产品的一站式付费墙基础设施。从设计、实验、订阅管理到实时分析，一次集成，全面覆盖。" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: 创建 apps/marketing/tailwind.config.ts**

```typescript
import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Inter'", "'Noto Sans SC'", '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ["'JetBrains Mono'", "'Fira Code'", 'monospace'],
      },
      colors: {
        brand: {
          purple: '#8b5cf6',
          cyan: '#06b6d4',
          amber: '#f59e0b',
        },
        surface: {
          primary: '#0a0a0f',
          secondary: '#12121a',
          card: '#1a1a2e',
          'card-hover': '#22223a',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
```

- [ ] **Step 6: 创建 src/index.css**

```css
@import "tailwindcss";

@layer base {
  *,
  *::before,
  *::after {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html {
    scroll-behavior: smooth;
    font-size: 16px;
  }

  body {
    font-family: 'Inter', 'Noto Sans SC', -apple-system, BlinkMacSystemFont, sans-serif;
    background-color: #0a0a0f;
    color: #f1f1f7;
    line-height: 1.6;
    overflow-x: hidden;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
}

@layer utilities {
  .gradient-text {
    background: linear-gradient(135deg, #c4b5fd, #67e8f9);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
}
```

- [ ] **Step 7: 创建 src/vite-env.d.ts**

```typescript
/// <reference types="vite/client" />
```

- [ ] **Step 8: 创建 src/main.tsx**

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
```

- [ ] **Step 9: 创建 src/App.tsx**

```typescript
import { Routes, Route } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { HomePage } from './pages/HomePage';

export function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
      </Route>
    </Routes>
  );
}
```

- [ ] **Step 10: 创建占位 HomePage**

```typescript
export function HomePage() {
  return <div className="text-white p-20 text-center">GateFlow Home</div>;
}
```

- [ ] **Step 11: 创建占位 MainLayout**

```typescript
import { Outlet } from 'react-router-dom';

export function MainLayout() {
  return (
    <div>
      <Outlet />
    </div>
  );
}
```

- [ ] **Step 12: 安装并验证启动**

```bash
pnpm install
pnpm --filter @gate-flow/marketing dev
```

Expected: Dev server starts on port 3000, shows "GateFlow Home".

- [ ] **Step 13: Commit**

```bash
git add apps/marketing/
git commit -m "feat: scaffold @gate-flow/marketing app (Vite + React + Tailwind + Router)"
```

---

### Task 8: Admin App Scaffold

**Files:**
- Create: `apps/admin/package.json`, `tsconfig.json`, `vite.config.ts`, `tailwind.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`, `src/vite-env.d.ts`

- [ ] **Step 1: 创建 apps/admin/package.json**

```json
{
  "name": "@gate-flow/admin",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit",
    "lint": "echo ok"
  },
  "dependencies": {
    "@dnd-kit/core": "^6.1.0",
    "@dnd-kit/sortable": "^8.0.0",
    "@dnd-kit/utilities": "^3.2.0",
    "@gate-flow/shared": "workspace:*",
    "lucide-react": "^0.441.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.26.0",
    "recharts": "^2.12.0",
    "zustand": "^4.5.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.6.0",
    "vite": "^5.4.0"
  }
}
```

- [ ] **Step 2: 创建 apps/admin/tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"],
  "references": [{ "path": "../../packages/shared" }]
}
```

- [ ] **Step 3: 创建 apps/admin/vite.config.ts**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: { port: 3001 },
});
```

- [ ] **Step 4: 创建 apps/admin/index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Noto+Sans+SC:wght@300;400;500;700;900&display=swap" rel="stylesheet" />
    <title>GateFlow Admin</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: 创建 apps/admin/tailwind.config.ts**

```typescript
import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Inter'", "'Noto Sans SC'", '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ["'JetBrains Mono'", "'Fira Code'", 'monospace'],
      },
      colors: {
        brand: { purple: '#8b5cf6', cyan: '#06b6d4', amber: '#f59e0b' },
        surface: { primary: '#0a0a0f', secondary: '#12121a', card: '#1a1a2e' },
      },
    },
  },
  plugins: [],
} satisfies Config;
```

- [ ] **Step 6: 创建 src/index.css**（与 marketing 一致的 base reset，加 admin 主题变量）

```css
@import "tailwindcss";

@layer base {
  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
  html { font-size: 16px; }
  body {
    font-family: 'Inter', 'Noto Sans SC', -apple-system, BlinkMacSystemFont, sans-serif;
    background-color: #0a0a0f;
    color: #f1f1f7;
    -webkit-font-smoothing: antialiased;
  }
}
```

- [ ] **Step 7: 创建 src/vite-env.d.ts**

```typescript
/// <reference types="vite/client" />
```

- [ ] **Step 8: 创建 src/main.tsx**

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
```

- [ ] **Step 9: 创建 src/App.tsx**

```typescript
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from './layouts/AdminLayout';
import { DashboardPage } from './pages/DashboardPage';

export function App() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
```

- [ ] **Step 10: 创建占位页面和布局**

```typescript
// src/pages/DashboardPage.tsx
export function DashboardPage() {
  return <div className="text-white p-8">Dashboard</div>;
}

// src/layouts/AdminLayout.tsx
import { Outlet } from 'react-router-dom';

export function AdminLayout() {
  return (
    <div className="flex h-screen bg-[#0a0a0f]">
      <Outlet />
    </div>
  );
}
```

- [ ] **Step 11: 安装并验证启动**

```bash
pnpm install
pnpm --filter @gate-flow/admin dev
```

Expected: Dev server starts on port 3001, shows "Dashboard".

- [ ] **Step 12: Commit**

```

---

## 阶段 2：Marketing Website（9 页）

### Task 9: Marketing Layout 组件（Header, Footer, MainLayout）

**Files:**
- Create: `apps/marketing/src/layouts/Header.tsx`, `Footer.tsx`, `MainLayout.tsx`

- [ ] **Step 1: 创建 Header.tsx**

```typescript
import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Container, Button } from '@gate-flow/shared';

const navLinks = [
  { label: '功能', href: '/#features' },
  { label: '定价', href: '/pricing' },
  { label: '文档', href: '/docs' },
  { label: '博客', href: '/blog' },
  { label: '案例', href: '/customers' },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location]);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-[#0a0a0f]/95 backdrop-blur-xl border-b border-white/[0.06]' : 'bg-transparent'
    }`}>
      <Container className="flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2.5 text-xl font-extrabold tracking-tight">
          <div className="w-8 h-8 bg-gradient-to-br from-brand-purple to-brand-cyan rounded-lg flex items-center justify-center">
            <svg className="w-4.5 h-4.5 fill-white" viewBox="0 0 24 24"><path d="M12 2L2 7v10l10 5 10-5V7L12 2z"/></svg>
          </div>
          GateFlow
        </Link>
        <nav className="hidden lg:flex items-center gap-8">
          {navLinks.map(link => (
            <Link key={link.href} to={link.href} className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="hidden sm:inline-flex">登录</Button>
          <Button variant="primary" size="sm">免费开始</Button>
          <button className="lg:hidden p-2 text-slate-400" onClick={() => setMobileOpen(!mobileOpen)}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              {mobileOpen ? <path d="M6 18L18 6M6 6l12 12"/> : <path d="M4 6h16M4 12h16M4 18h16"/>}
            </svg>
          </button>
        </div>
      </Container>
      {mobileOpen && (
        <div className="lg:hidden border-t border-white/[0.06] bg-[#0a0a0f] px-6 py-4 flex flex-col gap-3">
          {navLinks.map(link => (
            <Link key={link.href} to={link.href} className="text-sm text-slate-400 hover:text-white py-1">{link.label}</Link>
          ))}
        </div>
      )}
    </header>
  );
}
```

- [ ] **Step 2: 创建 Footer.tsx**

```typescript
import { Link } from 'react-router-dom';
import { Container } from '@gate-flow/shared';

const footerLinks = {
  '产品': [
    { label: '可视化编辑器', to: '/#features' }, { label: 'A/B 实验', to: '/#features' },
    { label: 'AI 优化', to: '/#features' }, { label: '订阅管理', to: '/#features' }, { label: '分析仪表盘', to: '/#features' },
  ],
  '开发者': [
    { label: '文档', to: '/docs' }, { label: 'API 参考', to: '/docs' },
    { label: '更新日志', to: '/blog' },
  ],
  '公司': [
    { label: '博客', to: '/blog' }, { label: '案例', to: '/customers' },
    { label: '社区', to: '/community' }, { label: '隐私政策', to: '/privacy' }, { label: '服务条款', to: '/terms' },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-[#12121a] py-16">
      <Container>
        <div className="grid grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-10 mb-12">
          <div>
            <Link to="/" className="flex items-center gap-2.5 text-xl font-extrabold tracking-tight">
              <div className="w-8 h-8 bg-gradient-to-br from-brand-purple to-brand-cyan rounded-lg flex items-center justify-center">
                <svg className="w-4.5 h-4.5 fill-white" viewBox="0 0 24 24"><path d="M12 2L2 7v10l10 5 10-5V7L12 2z"/></svg>
              </div>
              GateFlow
            </Link>
            <p className="text-sm text-slate-500 mt-4 max-w-[300px] leading-relaxed">
              AI 驱动的付费墙增长基础设施，帮助开发者与产品团队最大化订阅收入。
            </p>
          </div>
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-4">{title}</h4>
              <ul className="flex flex-col gap-3">
                {links.map(link => (
                  <li key={link.label}>
                    <Link to={link.to} className="text-sm text-slate-500 hover:text-white transition-colors">{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-white/[0.06]">
          <p className="text-xs text-slate-600">&copy; {new Date().getFullYear()} GateFlow. All rights reserved.</p>
          <div className="flex gap-3">
            {['GitHub', 'Twitter', 'WeChat'].map(social => (
              <a key={social} href="#" className="w-9 h-9 rounded-lg bg-[#1a1a2e] border border-white/[0.06] flex items-center justify-center text-xs font-medium text-slate-500 hover:text-brand-purple hover:border-purple-500/30 transition-colors">
                {social[0]}
              </a>
            ))}
          </div>
        </div>
      </Container>
    </footer>
  );
}
```

- [ ] **Step 3: 创建 MainLayout.tsx**

```typescript
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';

export function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
```

- [ ] **Step 4: Verify & Commit**

```bash
pnpm --filter @gate-flow/marketing typecheck
git add apps/marketing/src/layouts/
git commit -m "feat: add marketing layout (Header, Footer, MainLayout)"
```

---

### Task 10: Home Page（Hero + 核心能力 + 差异化 + 架构 + CTA）

**Files:**
- Create: `apps/marketing/src/components/shared/SectionLabel.tsx`, `GradientText.tsx`
- Create: `apps/marketing/src/data/features.ts`
- Create: `apps/marketing/src/components/home/HeroSection.tsx`, `CoreCapabilities.tsx`, `Differentiators.tsx`, `SDKSection.tsx`, `ArchitectureDiagram.tsx`, `ComparisonSection.tsx`, `TrustSection.tsx`, `CTABanner.tsx`
- Modify: `apps/marketing/src/pages/HomePage.tsx`

- [ ] **Step 1: Create shared presentational components**

```typescript
// SectionLabel.tsx
import React from 'react';
export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs font-semibold uppercase tracking-widest text-purple-400 mb-4">
      {children}
    </span>
  );
}

// GradientText.tsx
import React from 'react';
interface GradientTextProps { children: React.ReactNode; className?: string; }
export function GradientText({ children, className = '' }: GradientTextProps) {
  return <span className={`gradient-text ${className}`}>{children}</span>;
}
```

- [ ] **Step 2: Create features data**

```typescript
// data/features.ts
export interface Feature {
  title: string;
  description: string;
  iconName: string;
}
export const features: Feature[] = [
  { title: '无代码可视化编辑器', description: '拖拽式构建付费墙，200+ 模板即用即改，所见即所得，支持原生与 Web 双渲染引擎。', iconName: 'Grid3X3' },
  { title: '高级 A/B 实验', description: '多变量测试价格、文案、设计和时机，智能流量分配，多臂老虎机自动找到最优变体。', iconName: 'BarChart3' },
  { title: 'AI 智能优化', description: 'AI 自动生成文案、推荐实验方向、预测获胜变体，实现从手动调优到 AI 自主增长。', iconName: 'Sparkles' },
  { title: '精准受众定向', description: '50+ 自动追踪属性，自定义用户标签，行为触发规则，根据转化概率动态决定展示策略。', iconName: 'Users' },
  { title: '订阅管理与权益引擎', description: '统一管理 App Store、Google Play、支付宝、微信支付，跨平台权益自动同步。', iconName: 'Shield' },
  { title: '实时分析仪表盘', description: '秒级更新转化数据，LTV 预测，用户路径回溯，行业基准对比，数据驱动每一个决策。', iconName: 'Activity' },
];
```

- [ ] **Step 3: Create HeroSection.tsx**

```typescript
import { Button, Container } from '@gate-flow/shared';
import { Play } from 'lucide-react';

const stats = [
  { value: '200+', label: '付费墙模板' },
  { value: '35%', label: '平均转化提升' },
  { value: '5 min', label: 'SDK 集成时间' },
];

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-32 pb-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f] via-[#1a1030] to-[#0a0a0f]" />
      <div className="absolute inset-0 bg-[url('/images/hero-bg.png')] bg-cover bg-center opacity-30 mix-blend-screen" />
      <div className="absolute w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.15)_0%,transparent_70%)] top-1/5 left-1/2 -translate-x-1/2 animate-pulse" />
      <Container className="relative z-10 text-center max-w-[900px]">
        <div className="animate-fade-in-up">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-sm text-purple-400 font-medium mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" /> AI 原生付费墙平台
          </span>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tight mb-6">
            用 AI 驱动你的<br /><span className="gradient-text">付费墙增长引擎</span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-400 max-w-[650px] mx-auto mb-10 leading-relaxed">
            GateFlow 是面向移动应用与 Web 产品的一站式付费墙基础设施。从设计、实验、订阅管理到实时分析，一次集成，全面覆盖。
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Button size="lg">免费开始集成</Button>
            <Button variant="outline" size="lg" leftIcon={<Play size={16} />}>观看演示</Button>
          </div>
          <div className="flex items-center justify-center gap-16">
            {stats.map(stat => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-extrabold gradient-text">{stat.value}</div>
                <div className="text-sm text-slate-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-16 animate-fade-in-up [animation-delay:300ms]">
          <img src="/images/dashboard-mockup.png" alt="GateFlow 仪表盘" className="rounded-2xl border border-white/[0.06] shadow-2xl mx-auto max-w-[1000px] w-full" />
        </div>
      </Container>
    </section>
  );
}
```

- [ ] **Step 4: Create CoreCapabilities.tsx**

```typescript
import { Container, Card } from '@gate-flow/shared';
import { SectionLabel } from '../shared/SectionLabel';
import { GradientText } from '../shared/GradientText';
import { features } from '../../data/features';

export function CoreCapabilities() {
  return (
    <section id="features" className="py-24 lg:py-32">
      <Container>
        <div className="text-center mb-16">
          <SectionLabel>核心能力</SectionLabel>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight mb-4">
            一个平台，解决所有<GradientText>付费墙难题</GradientText>
          </h2>
          <p className="text-slate-400 max-w-[600px] mx-auto">
            从设计到分析，从实验到优化，GateFlow 为你的变现链路提供完整解决方案。
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(feature => (
            <Card key={feature.title} hover padding="lg">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
                <div className="w-6 h-6 bg-purple-400 rounded" />
              </div>
              <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{feature.description}</p>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}
```

- [ ] **Step 5: Create other home section placeholders + compose HomePage**

```typescript
// Differentiators.tsx, ArchitectureDiagram.tsx, SDKSection.tsx, ComparisonSection.tsx,
// TrustSection.tsx, CTABanner.tsx
// Each follows the same pattern: Container + SectionLabel + heading + content grid
// Full code similar to CoreCapabilities pattern above

// HomePage.tsx
import { HeroSection } from '../components/home/HeroSection';
import { TrustSection } from '../components/home/TrustSection';
import { CoreCapabilities } from '../components/home/CoreCapabilities';
import { SDKSection } from '../components/home/SDKSection';
import { Differentiators } from '../components/home/Differentiators';
import { ArchitectureDiagram } from '../components/home/ArchitectureDiagram';
import { ComparisonSection } from '../components/home/ComparisonSection';
import { CTABanner } from '../components/home/CTABanner';

export function HomePage() {
  return (
    <>
      <HeroSection />
      <TrustSection />
      <CoreCapabilities />
      <SDKSection />
      <Differentiators />
      <ArchitectureDiagram />
      <ComparisonSection />
      <CTABanner />
    </>
  );
}
```

- [ ] **Step 6: Add animation CSS to index.css**

```css
@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}
@layer utilities {
  .animate-fade-in-up {
    animation: fade-in-up 0.8s ease-out both;
  }
}
```

- [ ] **Step 7: Verify & Commit**

```bash
pnpm --filter @gate-flow/marketing typecheck
git add apps/marketing/src/components/home/ apps/marketing/src/components/shared/ apps/marketing/src/data/features.ts apps/marketing/src/pages/HomePage.tsx apps/marketing/src/index.css
git commit -m "feat: add complete landing page with all sections"
```

---

### Task 11: Pricing Page

**Files:**
- Create: `apps/marketing/src/data/pricing.ts`, `apps/marketing/src/components/pricing/PricingCard.tsx`, `PricingFAQ.tsx`
- Create: `apps/marketing/src/pages/PricingPage.tsx`
- Modify: `apps/marketing/src/App.tsx`

**Code:** See spec — 4 pricing tiers (Free/Pro/Growth/Scale) with card + FAQ.
Components: PricingCard renders tier data, PricingFAQ renders Q&A list, PricingPage composes them.

- [ ] **Step 1-3: Create files, verify, commit**

```bash
git add apps/marketing/src/data/pricing.ts apps/marketing/src/components/pricing/ apps/marketing/src/pages/PricingPage.tsx apps/marketing/src/App.tsx
git commit -m "feat: add Pricing page"
```

---

### Task 12: Docs Pages（文档站 + MDX 结构）

**Files:**
- Create: `apps/marketing/src/layouts/DocsLayout.tsx`
- Create: `apps/marketing/src/components/docs/DocsSidebar.tsx`, `DocsTOC.tsx`
- Create: `apps/marketing/src/pages/DocsPage.tsx`, `DocsDetailPage.tsx`
- Create: `apps/marketing/src/content/docs/` 目录及 `.mdx` 文件
- Modify: `apps/marketing/src/App.tsx`

**Key structure:**
- DocsLayout: sidebar (240px) + content area
- DocsSidebar: sticky nav with sections/links, active state from useLocation
- DocsPage: category cards (Getting Started, SDK Reference, Paywalls, Experiments)
- DocsDetailPage: dynamic MDX component rendering
- MDX files: getting-started.mdx, sdk-quickstart.mdx as minimum

- [ ] **Step 1-3: Create files, verify, commit**

```bash
git add apps/marketing/src/layouts/DocsLayout.tsx apps/marketing/src/components/docs/ apps/marketing/src/pages/DocsPage.tsx apps/marketing/src/pages/DocsDetailPage.tsx apps/marketing/src/content/docs/ apps/marketing/src/App.tsx
git commit -m "feat: add Docs pages with sidebar and MDX structure"
```

---

### Task 13: Blog, Customers, Community, Privacy, Terms Pages

**Files:**
- Create: `apps/marketing/src/pages/BlogPage.tsx`, `BlogDetailPage.tsx`, `CustomersPage.tsx`, `CommunityPage.tsx`, `PrivacyPage.tsx`, `TermsPage.tsx`
- Create: `apps/marketing/src/components/blog/BlogCard.tsx`
- Create: `apps/marketing/src/components/customers/CaseCard.tsx`
- Create: `apps/marketing/src/components/community/CommunityChannels.tsx`
- Modify: `apps/marketing/src/App.tsx`

**Implement all pages as static content pages with Container + heading + content layout.**

- [ ] **Step 1-3: Create files, verify, commit**

```bash
git add apps/marketing/src/pages/ apps/marketing/src/components/blog/ apps/marketing/src/components/customers/ apps/marketing/src/components/community/ apps/marketing/src/App.tsx
git commit -m "feat: add Blog, Customers, Community, Privacy, Terms pages"
```

---

### Task 14: Final App.tsx Complete Routing

- [ ] **Step 1: Update App.tsx with all routes**

```typescript
import { Routes, Route } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { DocsLayout } from './layouts/DocsLayout';
import { HomePage } from './pages/HomePage';
import { PricingPage } from './pages/PricingPage';
import { DocsPage } from './pages/DocsPage';
import { DocsDetailPage } from './pages/DocsDetailPage';
import { BlogPage } from './pages/BlogPage';
import { BlogDetailPage } from './pages/BlogDetailPage';
import { CustomersPage } from './pages/CustomersPage';
import { CommunityPage } from './pages/CommunityPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { TermsPage } from './pages/TermsPage';

export function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:slug" element={<BlogDetailPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route element={<DocsLayout />}>
          <Route path="/docs" element={<DocsPage />} />
          <Route path="/docs/:slug" element={<DocsDetailPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
```

- [ ] **Step 2: Verify & Commit**

```bash
pnpm --filter @gate-flow/marketing typecheck
pnpm --filter @gate-flow/marketing build
git add apps/marketing/src/App.tsx
git commit -m "feat: complete marketing routing with all 9 pages"
```

---

### Task 15: Image Migration

- [ ] **Step 1: Copy images**

```bash
cp front/images/* apps/marketing/public/images/
```

- [ ] **Step 2: Verify & Commit**

```bash
git add apps/marketing/public/images/
git commit -m "feat: migrate images to marketing public dir"
```

---

## 阶段 3：Admin Console（7 页 + Mock + Stores）

### Task 16: Mock Data 层

**Files:**
- Create: `apps/admin/src/mocks/paywalls.ts`, `templates.ts`, `experiments.ts`, `analytics.ts`, `audience.ts`, `settings.ts`

- [ ] **Step 1-3: Create all mock files with realistic data, commit**

Complete mock data for 10+ paywalls, 50+ templates, 5+ experiments, time-series analytics, audience attributes, and brand settings. All exported as typed constants.

```bash
git add apps/admin/src/mocks/
git commit -m "feat: add admin mock data (paywalls, templates, experiments, analytics, audience, settings)"
```

---

### Task 17: Zustand Stores

**Files:**
- Create: `apps/admin/src/stores/paywallStore.ts`, `templateStore.ts`, `experimentStore.ts`, `analyticsStore.ts`, `audienceStore.ts`, `settingsStore.ts`

**Pattern for each store:**
```typescript
import { create } from 'zustand';
import { mockPaywalls } from '../mocks/paywalls';
import type { Paywall } from '../mocks/paywalls';

interface PaywallState {
  paywalls: Paywall[];
  loading: boolean;
  error: string | null;
  fetchPaywalls: () => Promise<void>;
  createPaywall: (data: Partial<Paywall>) => Promise<void>;
  updatePaywall: (id: string, data: Partial<Paywall>) => Promise<void>;
  deletePaywall: (id: string) => Promise<void>;
}

export const usePaywallStore = create<PaywallState>((set) => ({
  paywalls: [],
  loading: false,
  error: null,
  fetchPaywalls: async () => {
    set({ loading: true, error: null });
    await new Promise(r => setTimeout(r, 300));
    set({ paywalls: mockPaywalls, loading: false });
  },
  createPaywall: async (data) => {
    set({ loading: true });
    await new Promise(r => setTimeout(r, 300));
    set(state => ({
      paywalls: [{ ...data, id: crypto.randomUUID(), status: 'draft', createdAt: new Date().toISOString() } as Paywall, ...state.paywalls],
      loading: false,
    }));
  },
  updatePaywall: async (id, data) => {
    set({ loading: true });
    await new Promise(r => setTimeout(r, 300));
    set(state => ({
      paywalls: state.paywalls.map(p => p.id === id ? { ...p, ...data } : p),
      loading: false,
    }));
  },
  deletePaywall: async (id) => {
    await new Promise(r => setTimeout(r, 200));
    set(state => ({ paywalls: state.paywalls.filter(p => p.id !== id) }));
  },
}));
```

- [ ] **Step 1-7: Create all 6 stores, verify typecheck, commit**

```bash
pnpm --filter @gate-flow/admin typecheck
git add apps/admin/src/stores/
git commit -m "feat: add zustand stores for admin (paywalls, templates, experiments, analytics, audience, settings)"
```

---

### Task 18: Admin Layout（Sidebar + TopBar + AdminLayout）

**Files:**
- Create: `apps/admin/src/layouts/Sidebar.tsx`, `TopBar.tsx`, `Breadcrumb.tsx`, `AdminLayout.tsx`

**Sidebar:** 240px fixed, Lucide icons, active state from useLocation, collapsible.
**TopBar:** Search input, environment selector, notification bell, user avatar.
**AdminLayout:** flex row layout with Sidebar + (TopBar + Outlet).

- [ ] **Step 1-4: Create files, verify, commit**

```bash
git add apps/admin/src/layouts/
git commit -m "feat: add admin layout (Sidebar, TopBar, Breadcrumb, AdminLayout)"
```

---

### Task 19: Dashboard Page（仪表盘）

**Files:**
- Create: `apps/admin/src/components/dashboard/StatsCard.tsx`, `ConversionFunnel.tsx`, `RevenueChart.tsx`, `RealTimeEvents.tsx`, `TopPaywalls.tsx`
- Create: `apps/admin/src/pages/DashboardPage.tsx`

**StatsCard:** Grid of 4 metric cards (total paywalls, conversion rate, MRR, active experiments).
**ConversionFunnel:** Recharts BarChart showing impressions -> views -> trials -> conversions.
**RevenueChart:** Recharts LineChart with time-series data.
**RealTimeEvents:** scrolling event log list.
**TopPaywalls:** sorted list of top-performing paywalls by revenue.
**DashboardPage:** composes all dashboard components in a responsive grid.

- [ ] **Step 1-8: Create files, verify typecheck + dev, commit**

```bash
pnpm --filter @gate-flow/admin typecheck
git add apps/admin/src/components/dashboard/ apps/admin/src/pages/DashboardPage.tsx
git commit -m "feat: add admin Dashboard page with stats, charts, and event log"
```

---

### Task 20: Paywalls List & Create Modal

**Files:**
- Create: `apps/admin/src/components/paywalls/PaywallList.tsx`, `PaywallCard.tsx`, `PaywallStatusBadge.tsx`, `CreatePaywallModal.tsx`
- Create: `apps/admin/src/pages/PaywallsPage.tsx`
- Modify: `apps/admin/src/App.tsx` (add route)

**PaywallList:** Filterable data table with search, status filter (draft/active/paused/archived).
**PaywallStatusBadge:** colored badge component for paywall status.
**CreatePaywallModal:** form modal (name, description, template selection).

- [ ] **Step 1-6: Create files, verify, commit**

```bash
git add apps/admin/src/components/paywalls/ apps/admin/src/pages/PaywallsPage.tsx apps/admin/src/App.tsx
git commit -m "feat: add Paywalls list page with create modal"
```

---

### Task 21: Paywall Editor（拖拽编辑器核心）

**Files:**
- Create: `apps/admin/src/components/editor/EditorCanvas.tsx`, `ComponentPanel.tsx`, `PropertyPanel.tsx`, `EditorToolbar.tsx`, `PreviewPanel.tsx`, `VersionHistory.tsx`
- Create: `apps/admin/src/components/editor/layers/TextBlock.tsx`, `ImageBlock.tsx`, `ButtonBlock.tsx`, `PriceCard.tsx`, `FeatureList.tsx`, `TrialBanner.tsx`, `CustomHTML.tsx`
- Create: `apps/admin/src/pages/PaywallEditorPage.tsx`
- Modify: `apps/admin/src/App.tsx`

**Core architecture:**
- EditorCanvas: @dnd-kit Droppable area, renders layers array
- ComponentPanel: draggable component list on the left
- PropertyPanel: selected layer property editor on the right
- PreviewPanel: iframe or overlay showing live preview
- VersionHistory: list of version snapshots with restore ability
- layers/*: individual renderer components for each layer type

**Editor uses zustand for state:** selectedLayerId, layers array, isDirty, undo/redo.

- [ ] **Step 1-9: Create editor files with @dnd-kit integration**

```typescript
// Example EditorCanvas.tsx
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useEditorStore } from '../../stores/editorStore';

export function EditorCanvas() {
  const { layers, selectedLayerId, selectLayer } = useEditorStore();
  const { setNodeRef } = useDroppable({ id: 'editor-canvas' });

  return (
    <div ref={setNodeRef} className="flex-1 min-h-[500px] bg-[#12121a] rounded-xl border border-white/[0.06] p-6">
      <SortableContext items={layers.map(l => l.id)} strategy={verticalListSortingStrategy}>
        {layers.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-600">
            从左侧拖入组件开始构建付费墙
          </div>
        ) : (
          layers.map(layer => (
            <SortableLayer key={layer.id} layer={layer} isSelected={layer.id === selectedLayerId} onClick={() => selectLayer(layer.id)} />
          ))
        )}
      </SortableContext>
    </div>
  );
}
```

- [ ] **Step 10: Verify & Commit**

```bash
pnpm --filter @gate-flow/admin typecheck
git add apps/admin/src/components/editor/ apps/admin/src/stores/editorStore.ts apps/admin/src/pages/PaywallEditorPage.tsx apps/admin/src/App.tsx
git commit -m "feat: add paywall drag-and-drop editor with component layers"
```

---

### Task 22: Templates Page（模板市场）

**Files:**
- Create: `apps/admin/src/components/templates/TemplateGrid.tsx`, `TemplateCard.tsx`, `TemplateFilter.tsx`, `TemplatePreview.tsx`
- Create: `apps/admin/src/pages/TemplatesPage.tsx`
- Modify: `apps/admin/src/App.tsx`

- [ ] **Step 1-5: Create files, verify, commit**

```bash
git add apps/admin/src/components/templates/ apps/admin/src/pages/TemplatesPage.tsx apps/admin/src/App.tsx
git commit -m "feat: add templates marketplace page"
```

---

### Task 23: Experiments Pages（实验管理 + 详情）

**Files:**
- Create: `apps/admin/src/components/experiments/ExperimentList.tsx`, `ExperimentForm.tsx`, `VariantComparison.tsx`, `ExperimentResults.tsx`, `TrafficAllocation.tsx`
- Create: `apps/admin/src/pages/ExperimentsPage.tsx`, `ExperimentDetailPage.tsx`
- Modify: `apps/admin/src/App.tsx`

- [ ] **Step 1-6: Create files, verify, commit**

```bash
git add apps/admin/src/components/experiments/ apps/admin/src/pages/ExperimentsPage.tsx apps/admin/src/pages/ExperimentDetailPage.tsx apps/admin/src/App.tsx
git commit -m "feat: add experiments list and detail pages"
```

---

### Task 24: Audience + Settings Pages

**Files:**
- Create: `apps/admin/src/components/audience/AttributeList.tsx`, `BehaviorRuleBuilder.tsx`, `AudienceSegment.tsx`
- Create: `apps/admin/src/components/settings/BrandSettings.tsx`, `WebhookManager.tsx`, `EnvironmentSelector.tsx`
- Create: `apps/admin/src/pages/AudiencePage.tsx`, `SettingsPage.tsx`
- Modify: `apps/admin/src/App.tsx`

- [ ] **Step 1-5: Create files, verify, commit**

```bash
git add apps/admin/src/components/audience/ apps/admin/src/components/settings/ apps/admin/src/pages/AudiencePage.tsx apps/admin/src/pages/SettingsPage.tsx apps/admin/src/App.tsx
git commit -m "feat: add audience and settings pages"
```

---

### Task 25: Admin Shared Components

**Files:**
- Create: `apps/admin/src/components/shared/DataTable.tsx`, `FilterBar.tsx`, `SearchInput.tsx`, `ConfirmDialog.tsx`, `LoadingSkeleton.tsx`, `StatusBadge.tsx`

- [ ] **Step 1-6: Create reusable table, filter, search, dialog, skeleton, badge components**

```bash
git add apps/admin/src/components/shared/
git commit -m "feat: add admin shared components (DataTable, FilterBar, Search, Dialog, Skeleton, Badge)"
```

---

### Task 26: Admin Full Routing

- [ ] **Step 1: Update App.tsx with all admin routes**

```typescript
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from './layouts/AdminLayout';
import { DashboardPage } from './pages/DashboardPage';
import { PaywallsPage } from './pages/PaywallsPage';
import { PaywallEditorPage } from './pages/PaywallEditorPage';
import { TemplatesPage } from './pages/TemplatesPage';
import { ExperimentsPage } from './pages/ExperimentsPage';
import { ExperimentDetailPage } from './pages/ExperimentDetailPage';
import { AudiencePage } from './pages/AudiencePage';
import { SettingsPage } from './pages/SettingsPage';

export function App() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/paywalls" element={<PaywallsPage />} />
        <Route path="/paywalls/:id" element={<PaywallEditorPage />} />
        <Route path="/templates" element={<TemplatesPage />} />
        <Route path="/experiments" element={<ExperimentsPage />} />
        <Route path="/experiments/:id" element={<ExperimentDetailPage />} />
        <Route path="/audience" element={<AudiencePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
```

- [ ] **Step 2: Verify & Commit**

```bash
pnpm --filter @gate-flow/admin typecheck
git add apps/admin/src/App.tsx
git commit -m "feat: complete admin routing with all 7 pages"
```

---

## 阶段 4：质量收尾

---

### Task 27: Full Build Verification

- [ ] **Step 1: Install all deps and typecheck**

```bash
pnpm install
pnpm --filter @gate-flow/shared typecheck
pnpm --filter @gate-flow/marketing typecheck
pnpm --filter @gate-flow/admin typecheck
```

- [ ] **Step 2: Build both apps**

```bash
pnpm --filter @gate-flow/marketing build
pnpm --filter @gate-flow/admin build
```

Expected: Both build successfully without errors.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: final build verification and cleanup"
```

---

### Task 28: Responsive & Polish

- [ ] **Step 1: Marketing responsive check** — verify Header hamburger, footer grid, hero text sizing, pricing grid at sm/md breakpoints
- [ ] **Step 2: Admin min-width enforcement** — Sidebar collapses at <1024px, tables scroll horizontally
- [ ] **Step 3: Commit final polish**

```bash
git commit -m "chore: responsive polish across marketing and admin"
```

---
