import { Outlet } from 'react-router-dom';
import { Container } from '@gate-flow/shared';
import { DocsSidebar } from '../components/docs/DocsSidebar';
import { Header } from '../layouts/Header';
import { Footer } from '../layouts/Footer';

export function DocsLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0f]">
      <Header />
      <div className="flex-1 pt-20">
        <Container>
          <div className="flex gap-10">
            <DocsSidebar />
            <main className="flex-1 min-w-0 py-12">
              <Outlet />
            </main>
          </div>
        </Container>
      </div>
      <Footer />
    </div>
  );
}
