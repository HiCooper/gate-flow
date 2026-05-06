interface TemplateThumbnailProps {
  category: string;
  variant?: number;
}

/** Renders a miniature paywall preview for each template category */
export function TemplateThumbnail({ category, variant = 1 }: TemplateThumbnailProps) {
  const key = `${category}-${variant}`;

  switch (category) {
    case '经典':
      return <ClassicThumbnail key={key} variant={variant} />;
    case '引导':
      return <OnboardingThumbnail key={key} variant={variant} />;
    case '促销':
      return <PromoThumbnail key={key} variant={variant} />;
    case '游戏化':
      return <GamifiedThumbnail key={key} variant={variant} />;
    case '极简':
      return <MinimalThumbnail key={key} variant={variant} />;
    case '沉浸式':
      return <ImmersiveThumbnail key={key} variant={variant} />;
    case '视频':
      return <VideoThumbnail key={key} variant={variant} />;
    case '教育':
      return <EducationThumbnail key={key} variant={variant} />;
    case '社交':
      return <SocialThumbnail key={key} variant={variant} />;
    case '健康':
      return <HealthThumbnail key={key} variant={variant} />;
    default:
      return <ClassicThumbnail key={key} variant={variant} />;
  }
}

/* ── 经典 - Three-tier cards ── */
function ClassicThumbnail({ variant }: { variant: number }) {
  const tiers = ['基础', '专业', '企业'];
  const prices = ['¥0', '¥98', '¥298'];
  const highlights = [0, 1, 2].map(i => i === variant % 3);
  return (
    <svg viewBox="0 0 320 180" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
      <rect width="320" height="180" rx="12" fill="#131519" />
      <rect width="320" height="28" rx="12" fill="#1a1d23" />
      <rect y="16" width="320" height="12" fill="#1a1d23" />
      <text x="10" y="12" font-size="8" fill="#a1a1aa" font-family="sans-serif">PREMIUM</text>
      {tiers.map((t, i) => {
        const x = 10 + i * 104;
        const highlight = highlights[i];
        return (
          <g key={t}>
            <rect
              x={x} y={44} width="94" height="120" rx="8"
              fill={highlight ? '#0d2e2b' : '#1a1d23'}
              stroke={highlight ? '#2dd4bf' : 'rgba(255,255,255,0.06)'}
              stroke-width="1"
            />
            <text x={x + 47} y="64" text-anchor="middle" font-size="9" font-weight="bold" fill="#e4e4e7" font-family="sans-serif">{t}</text>
            <text x={x + 47} y="80" text-anchor="middle" font-size="14" font-weight="bold" fill="#2dd4bf" font-family="sans-serif">{prices[i]}</text>
            {[0, 1, 2].map(j => (
              <rect key={j} x={x + 14} y={92 + j * 14} width="66" height="4" rx="2" fill={highlight ? 'rgba(45,212,191,0.2)' : 'rgba(255,255,255,0.06)'} />
            ))}
            <rect x={x + 14} y={140} width="66" height="18" rx="9" fill={highlight ? '#2dd4bf' : 'rgba(255,255,255,0.06)'} />
          </g>
        );
      })}
    </svg>
  );
}

/* ── 引导 - Step indicators ── */
function OnboardingThumbnail({ variant }: { variant: number }) {
  const steps = 4;
  const active = variant % steps;
  return (
    <svg viewBox="0 0 320 180" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
      <rect width="320" height="180" rx="12" fill="#131519" />
      {/* Header */}
      <rect x="100" y="14" width="120" height="4" rx="2" fill="rgba(255,255,255,0.08)" />
      <rect x="120" y="24" width="80" height="3" rx="1.5" fill="rgba(255,255,255,0.04)" />
      {/* Step dots */}
      <g transform="translate(78, 44)">
        {Array.from({ length: steps }, (_, i) => (
          <g key={i}>
            <circle cx={i * 44} cy="8" r="10" fill={i <= active ? '#0d2e2b' : '#1a1d23'} stroke={i <= active ? '#2dd4bf' : 'rgba(255,255,255,0.06)'} stroke-width="1.5" />
            <text x={i * 44} y="12" text-anchor="middle" font-size="9" font-weight="bold" fill={i <= active ? '#2dd4bf' : '#71717a'} font-family="sans-serif">{i + 1}</text>
            {i < steps - 1 && <line x1={i * 44 + 20} y1="8" x2={i * 44 + 34} y2="8" stroke={i < active ? '#2dd4bf' : 'rgba(255,255,255,0.06)'} stroke-width="2" />}
          </g>
        ))}
      </g>
      {/* Content cards */}
      <g transform="translate(16, 72)">
        <rect x="0" y="0" width="288" height="36" rx="6" fill="#1a1d23" stroke="rgba(255,255,255,0.04)" stroke-width="1" />
        <rect x="12" y="10" width="180" height="4" rx="2" fill="rgba(255,255,255,0.08)" />
        <rect x="12" y="18" width="120" height="3" rx="1.5" fill="rgba(255,255,255,0.04)" />
        <rect x="220" y="8" width="56" height="20" rx="10" fill="#2dd4bf" />
      </g>
      <g transform="translate(16, 116)">
        <rect x="0" y="0" width="288" height="36" rx="6" fill="#1a1d23" stroke="rgba(255,255,255,0.04)" stroke-width="1" />
        <rect x="12" y="10" width="160" height="4" rx="2" fill="rgba(255,255,255,0.06)" />
        <rect x="12" y="18" width="100" height="3" rx="1.5" fill="rgba(255,255,255,0.03)" />
      </g>
    </svg>
  );
}

/* ── 促销 - Badge + offer cards ── */
function PromoThumbnail({ variant }: { variant: number }) {
  const badgePos = variant % 3;
  return (
    <svg viewBox="0 0 320 180" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
      <rect width="320" height="180" rx="12" fill="#131519" />
      {/* Banner */}
      <rect x="0" y="0" width="320" height="32" rx="12" fill="#0d2e2b" />
      <rect y="20" width="320" height="12" fill="#0d2e2b" />
      <text x="160" y="21" text-anchor="middle" font-size="10" font-weight="bold" fill="#2dd4bf" font-family="sans-serif">限时优惠 - 年度订阅 7 折</text>
      {/* Offer cards */}
      {[0, 1].map(i => (
        <g key={i} transform={`translate(${16 + i * 148}, 44)`}>
          <rect x="0" y="0" width="136" height="120" rx="8" fill={badgePos === i ? '#0d2e2b' : '#1a1d23'} stroke={badgePos === i ? '#2dd4bf' : 'rgba(255,255,255,0.06)'} stroke-width="1" />
          {badgePos === i && (
            <g>
              <rect x="90" y="-1" width="46" height="18" rx="4" fill="#f59e0b" />
              <rect x="90" y="8" width="46" height="9" fill="#f59e0b" />
              <text x="113" y="12" text-anchor="middle" font-size="8" font-weight="bold" fill="#0f1114" font-family="sans-serif">热门</text>
            </g>
          )}
          <text x="68" y="24" text-anchor="middle" font-size="9" font-weight="bold" fill="#e4e4e7" font-family="sans-serif">Pro Plan</text>
          <text x="68" y="46" text-anchor="middle" font-size="18" font-weight="bold" fill="#2dd4bf" font-family="sans-serif">¥68</text>
          <text x="68" y="58" text-anchor="middle" font-size="7" fill="#71717a" font-family="sans-serif">原价 ¥98</text>
          {[0, 1, 2].map(j => (
            <rect key={j} x="20" y={70 + j * 14} width="96" height="4" rx="2" fill="rgba(255,255,255,0.06)" />
          ))}
          <rect x="20" y="92" width="96" height="22" rx="11" fill={badgePos === i ? '#2dd4bf' : 'rgba(255,255,255,0.06)'} />
        </g>
      ))}
    </svg>
  );
}

/* ── 游戏化 - Progress + streak ── */
function GamifiedThumbnail({ variant }: { variant: number }) {
  const pct = 30 + (variant % 5) * 15;
  return (
    <svg viewBox="0 0 320 180" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
      <rect width="320" height="180" rx="12" fill="#131519" />
      {/* Streak flame */}
      <g transform="translate(16, 12)">
        <rect x="0" y="0" width="80" height="24" rx="12" fill="#1a1d23" stroke="rgba(255,255,255,0.06)" stroke-width="1" />
        <text x="64" y="8" font-size="12" fill="#f59e0b" font-family="sans-serif" transform="rotate(0)">🔥</text>
        <text x="68" y="16" font-size="9" font-weight="bold" fill="#e4e4e7" font-family="sans-serif">7 天</text>
      </g>
      {/* Progress bar */}
      <g transform="translate(16, 44)">
        <text x="0" y="10" font-size="8" fill="#a1a1aa" font-family="sans-serif">解锁进度</text>
        <rect x="0" y="16" width="288" height="12" rx="6" fill="#1a1d23" />
        <rect x="0" y="16" width={288 * pct / 100} height="12" rx="6" fill="#2dd4bf" />
        <text x="144" y="12" text-anchor="middle" font-size="7" fill="#fff" font-family="sans-serif">{pct}%</text>
      </g>
      {/* Rewards */}
      <g transform="translate(16, 80)">
        {Array.from({ length: 4 }, (_, i) => (
          <g key={i} transform={`translate(${i * 74}, 0)`}>
            <rect x="0" y="0" width="64" height="64" rx="8" fill={i < 2 ? '#0d2e2b' : '#1a1d23'} stroke={i < 2 ? '#2dd4bf' : 'rgba(255,255,255,0.06)'} stroke-width="1" />
            <circle cx="32" cy="24" r="8" fill="rgba(255,255,255,0.06)" />
            <rect x="16" y="38" width="32" height="4" rx="2" fill="rgba(255,255,255,0.08)" />
            <rect x="20" y="46" width="24" height="3" rx="1.5" fill="rgba(255,255,255,0.04)" />
          </g>
        ))}
      </g>
    </svg>
  );
}

/* ── 极简 - Single CTA ── */
function MinimalThumbnail({ variant }: { variant: number }) {
  const layouts = ['center', 'left', 'split']; // use variant to vary alignment feel
  return (
    <svg viewBox="0 0 320 180" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
      <rect width="320" height="180" rx="12" fill="#131519" />
      {/* Clean centered layout */}
      <g transform="translate(60, 28)">
        <rect x="0" y="0" width="200" height="124" rx="12" fill="#1a1d23" stroke="rgba(255,255,255,0.04)" stroke-width="1" />
        <circle cx="100" cy="24" r="14" fill="rgba(45,212,191,0.12)" />
        <text x="100" y="28" text-anchor="middle" font-size="12" fill="#2dd4bf" font-family="sans-serif">★</text>
        <text x="100" y="56" text-anchor="middle" font-size="11" font-weight="bold" fill="#e4e4e7" font-family="sans-serif">解锁全部功能</text>
        <text x="100" y="72" text-anchor="middle" font-size="7" fill="#71717a" font-family="sans-serif">免费试用 7 天</text>
        <rect x="50" y="84" width="100" height="28" rx="14" fill="#2dd4bf" />
        <text x="100" y="102" text-anchor="middle" font-size="9" font-weight="bold" fill="#0f1114" font-family="sans-serif">免费开始</text>
      </g>
    </svg>
  );
}

/* ── 沉浸式 - Full-screen hero ── */
function ImmersiveThumbnail({ variant }: { variant: number }) {
  return (
    <svg viewBox="0 0 320 180" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
      <rect width="320" height="180" rx="12" fill="#0d2e2b" />
      {/* Gradient bars background */}
      {Array.from({ length: 8 }, (_, i) => (
        <rect key={i} x="0" y={i * 24} width="320" height="1" fill="rgba(45,212,191,0.08)" />
      ))}
      {/* Hero content */}
      <g transform="translate(40, 30)">
        <text x="120" y="0" text-anchor="middle" font-size="14" font-weight="bold" fill="#e4e4e7" font-family="sans-serif">Pro</text>
        <text x="120" y="20" text-anchor="middle" font-size="24" font-weight="bold" fill="#2dd4bf" font-family="sans-serif">¥198</text>
        <text x="120" y="36" text-anchor="middle" font-size="7" fill="#5eead4" font-family="sans-serif">/ 月</text>
        {/* Feature rows */}
        {[0, 1, 2, 3].map(j => (
          <g key={j} transform={`translate(20, ${50 + j * 18})`}>
            <circle cx="0" cy="4" r="3" fill="#2dd4bf" />
            <rect x="10" y="2" width="180" height="4" rx="2" fill="rgba(45,212,191,0.2)" />
          </g>
        ))}
        <rect x="30" y="130" width="180" height="28" rx="14" fill="#2dd4bf" />
        <text x="120" y="148" text-anchor="middle" font-size="10" font-weight="bold" fill="#0f1114" font-family="sans-serif">立即订阅</text>
      </g>
    </svg>
  );
}

/* ── 视频 - Play button + frames ── */
function VideoThumbnail({ variant }: { variant: number }) {
  return (
    <svg viewBox="0 0 320 180" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
      <rect width="320" height="180" rx="12" fill="#131519" />
      {/* Video player area */}
      <rect x="40" y="14" width="240" height="100" rx="8" fill="#1a1d23" stroke="rgba(255,255,255,0.06)" stroke-width="1" />
      {/* Play button */}
      <circle cx="160" cy="64" r="18" fill="rgba(45,212,191,0.15)" stroke="#2dd4bf" stroke-width="1.5" />
      <polygon points="156,56 156,72 170,64" fill="#2dd4bf" />
      {/* Progress bar */}
      <rect x="40" y="122" width="240" height="4" rx="2" fill="#1a1d23" />
      <rect x="40" y="122" width="100" height="4" rx="2" fill="#2dd4bf" />
      {/* CTA below */}
      <rect x="80" y="138" width="160" height="26" rx="13" fill="#2dd4bf" />
      <text x="160" y="155" text-anchor="middle" font-size="9" font-weight="bold" fill="#0f1114" font-family="sans-serif">解锁完整视频</text>
    </svg>
  );
}

/* ── 教育 - Course card grid ── */
function EducationThumbnail({ variant }: { variant: number }) {
  const unlocked = variant % 4 + 1;
  return (
    <svg viewBox="0 0 320 180" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
      <rect width="320" height="180" rx="12" fill="#131519" />
      {[0, 1, 2, 3].map(i => {
        const x = 16 + i * 75;
        const locked = i >= unlocked;
        return (
          <g key={i} transform={`translate(${x}, 20)`}>
            <rect x="0" y="0" width="65" height="90" rx="6" fill={locked ? '#1a1d23' : '#0d2e2b'} stroke={locked ? 'rgba(255,255,255,0.04)' : '#2dd4bf'} stroke-width="1" />
            <rect x="8" y="8" width="49" height="32" rx="4" fill="rgba(255,255,255,0.04)" />
            {locked && (
              <g transform="translate(20, 16)">
                <circle cx="12" cy="12" r="8" fill="rgba(255,255,255,0.06)" />
                <text x="12" y="16" text-anchor="middle" font-size="10" fill="#71717a" font-family="sans-serif">🔒</text>
              </g>
            )}
            <rect x="8" y="46" width="49" height="4" rx="2" fill={locked ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.08)'} />
            <rect x="8" y="54" width="35" height="3" rx="1.5" fill={locked ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.04)'} />
          </g>
        );
      })}
      {/* Bottom CTA */}
      <rect x="16" y="126" width="288" height="28" rx="8" fill="#1a1d23" stroke="rgba(255,255,255,0.06)" stroke-width="1" />
      <text x="160" y="145" text-anchor="middle" font-size="9" font-weight="bold" fill="#e4e4e7" font-family="sans-serif">解锁全部课程</text>
    </svg>
  );
}

/* ── 社交 - Testimonials / avatars ── */
function SocialThumbnail({ variant }: { variant: number }) {
  const colors = ['#2dd4bf', '#a78bfa', '#f59e0b', '#60a5fa'];
  return (
    <svg viewBox="0 0 320 180" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
      <rect width="320" height="180" rx="12" fill="#131519" />
      {/* Avatars row */}
      <g transform="translate(50, 14)">
        {[0, 1, 2, 3].map(i => (
          <circle key={i} cx={i * 22} cy="12" r="9" fill={colors[i]} opacity="0.2" stroke={colors[i]} stroke-width="1" />
        ))}
        <text x="100" y="16" font-size="8" fill="#a1a1aa" font-family="sans-serif">+2.3k 用户</text>
      </g>
      {/* Testimonial card */}
      <g transform="translate(20, 44)">
        <rect x="0" y="0" width="280" height="60" rx="8" fill="#1a1d23" stroke="rgba(255,255,255,0.06)" stroke-width="1" />
        {[0, 1, 2, 3, 4].map(i => (
          <text key={i} x="20" y={12 + i * 10} font-size="6" fill="#a1a1aa" font-family="sans-serif">★</text>
        ))}
        <text x="55" y="12" font-size="8" fill="#e4e4e7" font-family="sans-serif">效果显著，转化率提升 35%</text>
        <rect x="20" y="42" width="130" height="3" rx="1.5" fill="rgba(255,255,255,0.04)" />
        <rect x="20" y="50" width="80" height="2" rx="1" fill="rgba(255,255,255,0.03)" />
        <circle cx="240" cy="30" r="14" fill="rgba(45,212,191,0.1)" />
        <text x="240" y="34" text-anchor="middle" font-size="8" fill="#2dd4bf" font-family="sans-serif">✓</text>
      </g>
      {/* Second testimonial */}
      <g transform="translate(20, 114)">
        <rect x="0" y="0" width="280" height="48" rx="8" fill="#1a1d23" stroke="rgba(255,255,255,0.04)" stroke-width="1" />
        <circle cx="20" cy="24" r="8" fill="rgba(167,139,250,0.15)" />
        <text x="38" y="14" font-size="8" fill="#e4e4e7" font-family="sans-serif">ARPU 增长 20%</text>
        <text x="38" y="26" font-size="6" fill="#71717a" font-family="sans-serif">来自教育行业客户</text>
      </g>
    </svg>
  );
}

/* ── 健康 - Clean wellness cards ── */
function HealthThumbnail({ variant }: { variant: number }) {
  const green = '#34d399';
  return (
    <svg viewBox="0 0 320 180" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
      <rect width="320" height="180" rx="12" fill="#131519" />
      {/* Header */}
      <rect x="100" y="10" width="120" height="4" rx="2" fill="rgba(255,255,255,0.06)" />
      {/* Plan cards */}
      {[0, 1, 2].map(i => {
        const x = 16 + i * 100;
        const active = i === 1;
        return (
          <g key={i} transform={`translate(${x}, 24)`}>
            <rect x="0" y="0" width="90" height="130" rx="8" fill={active ? '#0a1f1a' : '#1a1d23'} stroke={active ? green : 'rgba(255,255,255,0.06)'} stroke-width="1" />
            <circle cx="45" cy="22" r="10" fill={active ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.04)'} />
            <text x="45" y="44" text-anchor="middle" font-size="8" font-weight="bold" fill="#e4e4e7" font-family="sans-serif">基础</text>
            <text x="45" y="62" text-anchor="middle" font-size="16" font-weight="bold" fill={active ? green : '#a1a1aa'} font-family="sans-serif">¥48</text>
            {[0, 1, 2].map(j => (
              <rect key={j} x="14" y={74 + j * 14} width="62" height="3" rx="1.5" fill={active ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.04)'} />
            ))}
            <rect x="14" y="102" width="62" height="20" rx="10" fill={active ? green : 'rgba(255,255,255,0.06)'} />
          </g>
        );
      })}
    </svg>
  );
}
