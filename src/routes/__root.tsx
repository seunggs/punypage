import { Outlet, createRootRoute, useRouterState } from '@tanstack/react-router'

import { AppLayout } from '../components/AppLayout'
import { LoadingScreen } from '../components/LoadingScreen'
import { useAuth } from '../features/auth/hooks/useAuth'

// Routes that should NOT have the app layout (sidebar, etc.)
const AUTH_ROUTES = ['/sign-in', '/sign-up', '/reset-password', '/update-password'];

function RootComponent() {
  const { loading } = useAuth();
  const router = useRouterState();
  const currentPath = router.location.pathname;

  // Check if current route is an auth route
  const isAuthRoute = AUTH_ROUTES.some(route => currentPath.startsWith(route));

  if (loading) {
    return <LoadingScreen />;
  }

  // Render without layout for auth routes
  if (isAuthRoute) {
    return <Outlet />;
  }

  // Render with layout for all other routes
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}

export const Route = createRootRoute({
  component: RootComponent,
})
