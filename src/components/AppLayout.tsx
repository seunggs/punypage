import { useRouterState } from '@tanstack/react-router';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouterState();
  const currentPath = router.location.pathname;

  // Only use grid-cols-2 layout for document pages (with documentId)
  const isDocumentPage = currentPath.startsWith('/documents/') && currentPath !== '/documents';

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <main className={isDocumentPage ? "flex-1 grid grid-cols-2" : "flex-1"}>
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
