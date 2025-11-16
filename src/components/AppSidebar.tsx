import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, useSidebar } from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import { BookOpen, CheckSquare, Calendar, FileText, Heart, User } from "lucide-react";
const navigationItems = [{
  title: "Previous Entries",
  url: "/entries",
  icon: BookOpen
}, {
  title: "Tasks",
  url: "/tasks",
  icon: CheckSquare
}, {
  title: "Calendar",
  url: "/calendar",
  icon: Calendar
}, {
  title: "Notes & Insights",
  url: "/notes",
  icon: FileText
}, {
  title: "Health & Wellness",
  url: "/health",
  icon: Heart
}];
export function AppSidebar() {
  const {
    state
  } = useSidebar();
  const isCollapsed = state === "collapsed";
  return <Sidebar className={isCollapsed ? "w-14" : "w-60"} collapsible="icon">
      <SidebarContent>
        <SidebarGroup className="my-[70px]">
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map(item => <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className="hover:bg-accent hover:text-accent-foreground" activeClassName="bg-accent text-accent-foreground font-medium">
                      <item.icon className="h-5 w-5 shrink-0" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink to="/profile" className="hover:bg-accent hover:text-accent-foreground" activeClassName="bg-accent text-accent-foreground font-medium">
                <User className="h-5 w-5 shrink-0" />
                {!isCollapsed && <span>Profile</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>;
}