import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar } from "lucide-react";
import { format } from "date-fns";

interface JournalEntry {
  id: string;
  content: string;
  created_at: string;
}

interface JournalHistoryProps {
  refreshTrigger: number;
}

export function JournalHistory({ refreshTrigger }: JournalHistoryProps) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  useEffect(() => {
    fetchEntries();
  }, [refreshTrigger]);

  const fetchEntries = async () => {
    try {
      const { data, error } = await supabase
        .from("journal_entries")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error("Error fetching journal entries:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sidebar className={isCollapsed ? "w-14" : "w-80"} collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Journal History</SidebarGroupLabel>
          <SidebarGroupContent>
            <ScrollArea className="h-[calc(100vh-8rem)]">
              <SidebarMenu>
                {loading ? (
                  <div className="p-4 text-sm text-muted-foreground">Loading...</div>
                ) : entries.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground">No entries yet</div>
                ) : (
                  entries.map((entry) => (
                    <SidebarMenuItem key={entry.id}>
                      <SidebarMenuButton className="h-auto py-3 flex-col items-start gap-1">
                        <div className="flex items-center gap-2 w-full">
                          <Calendar className="h-4 w-4 text-primary shrink-0" />
                          {!isCollapsed && (
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(entry.created_at), "MMM d, yyyy h:mm a")}
                            </span>
                          )}
                        </div>
                        {!isCollapsed && (
                          <p className="text-sm text-left line-clamp-3 mt-1">
                            {entry.content}
                          </p>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))
                )}
              </SidebarMenu>
            </ScrollArea>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
