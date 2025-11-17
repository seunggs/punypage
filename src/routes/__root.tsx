import { Outlet, createRootRoute } from '@tanstack/react-router'

import { AppLayout } from '../components/AppLayout'
import { LoadingScreen } from '../components/LoadingScreen'
import { useAuth } from '../features/auth/hooks/useAuth'

function RootComponent() {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}

export const Route = createRootRoute({
  component: RootComponent,
})
