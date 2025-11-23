import { Link } from '@tanstack/react-router';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { NewChatButton } from './sidebar/NewChatButton';
import { RecentChatsList } from './sidebar/RecentChatsList';
import { UserMenu } from './sidebar/UserMenu';

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader className="border-b px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">Punypage</h1>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <div className="px-3 py-2">
          <NewChatButton />
        </div>

        <div className="px-3 py-2">
          <h2 className="mb-2 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Recent Chats
          </h2>
          <RecentChatsList />
        </div>
      </SidebarContent>

      <SidebarFooter className="border-t">
        <UserMenu />
      </SidebarFooter>
    </Sidebar>
  );
}
