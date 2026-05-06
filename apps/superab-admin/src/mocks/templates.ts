export interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  thumbnail: string;
  rating: number;
  usageCount: number;
  conversions: number;
  preview: string;
}

const categories = [
  { name: '经典', prefix: 'classic' },
  { name: '引导', prefix: 'onboarding' },
  { name: '促销', prefix: 'promo' },
  { name: '游戏化', prefix: 'gamified' },
  { name: '极简', prefix: 'minimal' },
  { name: '沉浸式', prefix: 'immersive' },
  { name: '视频', prefix: 'video' },
  { name: '教育', prefix: 'education' },
  { name: '社交', prefix: 'social' },
  { name: '健康', prefix: 'health' },
];

function generateTemplates(): Template[] {
  const templates: Template[] = [];
  let id = 1;

  for (const cat of categories) {
    const count = cat.name === '经典' || cat.name === '促销' ? 7 : 5;
    for (let i = 1; i <= count; i++) {
      templates.push({
        id: `tpl-${String(id).padStart(3, '0')}`,
        name: `${cat.name}模板 ${i}`,
        category: cat.name,
        description: `适合${cat.name}场景的付费墙模板，提供${i}种布局变体。`,
        thumbnail: '',
        rating: +(3.5 + Math.random() * 1.5).toFixed(1),
        usageCount: Math.floor(Math.random() * 5000) + 100,
        conversions: Math.floor(Math.random() * 3000) + 50,
        preview: '',
      });
      id++;
    }
  }

  return templates;
}

export const mockTemplates: Template[] = generateTemplates();
