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
      </Route>
      <Route element={<DocsLayout />}>
        <Route path="/docs" element={<DocsPage />} />
        <Route path="/docs/:slug" element={<DocsDetailPage />} />
      </Route>
    </Routes>
  );
}
