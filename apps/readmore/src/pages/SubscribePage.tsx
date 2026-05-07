import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { subscribe } from '../lib/api';
import { victor } from '../lib/victor';

const plans = [
  { type: 'monthly', name: '月度会员', price: 29, desc: '每月自动续费' },
  { type: 'yearly', name: '年度会员', price: 299, desc: '立省59元' },
];

export default function SubscribePage() {
  const [selected, setSelected] = useState(0);
  const [message, setMessage] = useState('');
  const userId = victor.getUserId();

  useEffect(() => {
    victor.initialize();
    victor.trackEvent('page_view', { page: 'subscribe' });
  }, []);

  const handleSubscribe = async () => {
    if (!userId) {
      setMessage('请先初始化用户');
      return;
    }
    const plan = plans[selected];
    victor.trackEvent('subscribe_click', { planType: plan.type });
    try {
      await subscribe(userId, plan.type);
      victor.trackEvent('subscribe_success', { planType: plan.type, amount: plan.price });
      setMessage(`订阅成功！${plan.name}已开通`);
    } catch {
      setMessage('订阅失败，请重试');
    }
  };

  return (
    <Layout>
      <h1 className="text-xl font-bold mb-4">开通会员</h1>
      <div className="space-y-3 mb-6">
        {plans.map((plan, i) => (
          <div
            key={plan.type}
            onClick={() => setSelected(i)}
            className={`p-4 rounded-lg border-2 cursor-pointer ${
              selected === i ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white'
            }`}
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold">{plan.name}</h3>
                <p className="text-sm text-gray-500">{plan.desc}</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-blue-600">{plan.price}</span>
                <span className="text-gray-500">元</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleSubscribe}
        className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold active:bg-blue-700"
      >
        立即开通
      </button>

      {message && (
        <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm">
          {message}
        </div>
      )}
    </Layout>
  );
}
