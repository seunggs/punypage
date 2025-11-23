import { Link } from '@tanstack/react-router';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { DocumentsList } from '@/features/documents/components/DocumentsList';
import { NewChatButton } from './sidebar/NewChatButton';
import { RecentChatsList } from './sidebar/RecentChatsList';
import { UserMenu } from './sidebar/UserMenu';

export function AppSidebar() {
  return (
    <Sidebar className="border-r border-gray-200 dark:border-gray-800">
      <SidebarHeader className="border-b border-gray-200 dark:border-gray-800 px-4 h-6 flex items-center">
        <Link to="/" className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">Punypage</h1>
        </Link>
      </SidebarHeader>

      <SidebarContent className="gap-0">
        <div className="p-4 pb-6">
          <DocumentsList />
        </div>

        <Separator />

        <div className="p-4 pb-6">
          <NewChatButton />
        </div>

        <div className="p-2">
          <h2 className="px-2 py-1 text-xs font-medium text-gray-500 dark:text-gray-400">
            Recent Chats
          </h2>
          <RecentChatsList />
        </div>
      </SidebarContent>

      <SidebarFooter className="border-t border-gray-200 dark:border-gray-800 p-4">
        <UserMenu />
      </SidebarFooter>
    </Sidebar>
  );
}
