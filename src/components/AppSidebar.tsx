import { Link } from '@tanstack/react-router';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from '@/components/ui/sidebar';
import { DocumentsList } from '@/features/documents/components/DocumentsList';
import { UserMenu } from './sidebar/UserMenu';

export function AppSidebar() {
  return (
    <Sidebar className="border-r border-gray-200 dark:border-gray-800">
      <SidebarHeader className="border-b border-gray-200 dark:border-gray-800 px-6 h-11 flex items-start justify-start pt-3">
        <Link to="/">
          <h1 className="text-base font-medium">PunyPage</h1>
        </Link>
      </SidebarHeader>

      <SidebarContent className="gap-0">
        <DocumentsList />
      </SidebarContent>

      <SidebarFooter className="border-t border-gray-200 dark:border-gray-800 p-4">
        <UserMenu />
      </SidebarFooter>
    </Sidebar>
  );
}
