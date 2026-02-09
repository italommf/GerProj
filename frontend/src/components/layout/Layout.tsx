import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useSidebar } from '@/context/SidebarContext';
import { NotificationsButton } from '@/components/NotificationsButton';
import { cn } from '@/lib/utils';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/sprints': 'Sprints',
  '/projects': 'Projetos',
  '/people': 'Pessoas',
  '/priorities': 'Prioridades',
  '/mytasks': 'Meus Afazeres',
  '/geekday': 'Geek Day',
  '/settings': 'Configurações',
  '/tree': 'Árvore de Projetos',
  '/suggestions': 'Sugestões',
};

export default function Layout() {
  const location = useLocation();
  const { collapsed } = useSidebar();
  const pageTitle = pageTitles[location.pathname] || 'BWA Tech';

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <Sidebar />
      
      {/* Main content area - margem esquerda ajusta com o sidebar */}
      <div
        className={cn(
          "transition-all duration-300",
          collapsed ? "pl-[64px]" : "pl-[256px]"
        )}
      >
        {/* Header - 64px (8 * 8) */}
        <header className="sticky top-0 z-30 flex h-[64px] items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-card)] px-[32px]">
          <h1 className="text-xl font-semibold text-[var(--color-foreground)]">
            {pageTitle}
          </h1>
          <div className="flex items-center gap-[16px]">
            <NotificationsButton />
          </div>
        </header>
        
        {/* Content area - padding de 32px (4 * 8) */}
        <main className="p-[32px]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
