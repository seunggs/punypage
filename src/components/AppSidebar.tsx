import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { NewChatButton } from './sidebar/NewChatButton';
import { RecentChatsList } from './sidebar/RecentChatsList';
import { UserMenu } from './sidebar/UserMenu';

export function AppSidebar() {
  return (
    <Sidebar className="border-r border-gray-200 dark:border-gray-800">
      <SidebarContent className="gap-0">
        <div className="px-3 pt-3 pb-6">
          <NewChatButton />
        </div>

        <div className="px-2">
          <h2 className="px-2 py-1 text-xs font-medium text-gray-500 dark:text-gray-400">
            Recent Chats
          </h2>
          <RecentChatsList />
        </div>
      </SidebarContent>

      <SidebarFooter className="border-t border-gray-200 dark:border-gray-800 p-2">
        <UserMenu />
      </SidebarFooter>
    </Sidebar>
  );
}
