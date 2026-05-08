import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import {
  FlaskConical,
} from 'lucide-react';
import { clsx } from 'clsx';

// Pages
import { ExperimentsPage } from './pages/ExperimentsPage';
import { ExperimentDetailPage } from './pages/ExperimentDetailPage';

const NAV_ITEMS = [
  { path: '/', label: '实验概览', icon: FlaskConical },
];

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        {/* Sidebar */}
        <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 z-40">
          <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-700">
            <FlaskConical className="w-6 h-6 text-primary-600 mr-3" />
            <div>
              <span className="text-lg font-semibold text-slate-900 dark:text-white">
                DS Platform
              </span>
              <span className="block text-xs text-slate-500">实验分析平台</span>
            </div>
          </div>
          <nav className="p-4 space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer',
                      isActive
                        ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700'
                    )
                  }
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>v0.2.0</span>
              <span>DS Platform</span>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="ml-64 p-6">
          <div className="max-w-7xl mx-auto">
            <Routes>
              {/* Experiments */}
              <Route path="/" element={<ExperimentsPage />} />
              <Route path="/experiments" element={<ExperimentsPage />} />
              <Route path="/experiments/:id" element={<ExperimentDetailPage />} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
