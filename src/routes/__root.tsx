import { Outlet, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

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
      <TanStackDevtools
        config={{
          position: 'bottom-right',
        }}
        plugins={[
          {
            name: 'Tanstack Router',
            render: <TanStackRouterDevtoolsPanel />,
          },
        ]}
      />
    </AppLayout>
  );
}

export const Route = createRootRoute({
  component: RootComponent,
})
