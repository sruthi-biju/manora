import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckSquare, Calendar, FileText, Heart, MoreVertical, ChevronUp, ChevronDown, Edit, Trash } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

interface InsightsDisplayProps {
  refreshTrigger: number;
}

export const InsightsDisplay = ({ refreshTrigger }: InsightsDisplayProps) => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [health, setHealth] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingType, setEditingType] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, [refreshTrigger]);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [tasksData, eventsData, notesData, healthData] = await Promise.all([
      supabase.from("tasks").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("calendar_events").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("notes").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("health_mentions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);

    if (tasksData.data) setTasks(tasksData.data);
    if (eventsData.data) setEvents(eventsData.data);
    if (notesData.data) setNotes(notesData.data);
    if (healthData.data) setHealth(healthData.data);
  };

  const toggleTask = async (taskId: string, completed: boolean) => {
    await supabase.from("tasks").update({ completed: !completed }).eq("id", taskId);
    fetchData();
  };

  const startEdit = (id: string, type: string, currentValue: string) => {
    setEditingId(id);
    setEditingType(type);
    setEditValue(currentValue);
    setEditDialogOpen(true);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingType(null);
    setEditValue("");
    setEditDialogOpen(false);
  };

  const saveEdit = async (id: string, type: string) => {
    try {
      const table = type === "task" ? "tasks" : 
                   type === "event" ? "calendar_events" :
                   type === "note" ? "notes" : "health_mentions";
      
      const updateData = type === "task" || type === "event" 
        ? { title: editValue }
        : { content: editValue };

      const { error } = await supabase
        .from(table)
        .update(updateData)
        .eq("id", id);

      if (error) throw error;

      toast.success("Updated successfully");
      cancelEdit();
      fetchData();
    } catch (error) {
      console.error("Error updating:", error);
      toast.error("Failed to update");
    }
  };

  const moveItem = async (id: string, type: string, direction: "up" | "down") => {
    try {
      const table = type === "task" ? "tasks" : 
                   type === "event" ? "calendar_events" :
                   type === "note" ? "notes" : "health_mentions";
      
      const items = type === "task" ? tasks :
                   type === "event" ? events :
                   type === "note" ? notes : health;
      
      const currentIndex = items.findIndex((item: any) => item.id === id);
      if (currentIndex === -1) return;
      
      const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
      if (newIndex < 0 || newIndex >= items.length) return;

      // Swap created_at timestamps to change order
      const currentItem = items[currentIndex];
      const swapItem = items[newIndex];

      const { error: error1 } = await supabase
        .from(table)
        .update({ created_at: swapItem.created_at })
        .eq("id", currentItem.id);

      const { error: error2 } = await supabase
        .from(table)
        .update({ created_at: currentItem.created_at })
        .eq("id", swapItem.id);

      if (error1 || error2) throw error1 || error2;

      toast.success("Item moved");
      fetchData();
    } catch (error) {
      console.error("Error moving item:", error);
      toast.error("Failed to move item");
    }
  };

  const deleteItem = async (id: string, type: string) => {
    try {
      const table = type === "task" ? "tasks" : 
                   type === "event" ? "calendar_events" :
                   type === "note" ? "notes" : "health_mentions";

      const { error } = await supabase
        .from(table)
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Deleted successfully");
      fetchData();
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("Failed to delete");
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "destructive";
      case "medium": return "default";
      case "low": return "secondary";
      default: return "secondary";
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Tasks */}
      {tasks.length > 0 && (
        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-primary" />
              Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {tasks.map((task: any) => (
                <li key={task.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={() => toggleTask(task.id, task.completed)}
                  />
                  <div className="flex-1">
                    <p className={task.completed ? "line-through text-muted-foreground" : ""}>
                      {task.title}
                    </p>
                    <Badge variant={getPriorityColor(task.priority)} className="mt-1">
                      {task.priority}
                    </Badge>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => startEdit(task.id, "task", task.title)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => deleteItem(task.id, "task")}>
                        <Trash className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => moveItem(task.id, "task", "up")}>
                        <ChevronUp className="h-4 w-4 mr-2" />
                        Move Up
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => moveItem(task.id, "task", "down")}>
                        <ChevronDown className="h-4 w-4 mr-2" />
                        Move Down
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Calendar Events */}
      {events.length > 0 && (
        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Calendar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {events.map((event: any) => (
                <li key={event.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <Calendar className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium">{event.title}</p>
                    {event.event_date && (
                      <p className="text-sm text-muted-foreground">
                        {new Date(event.event_date).toLocaleDateString()}
                        {event.event_time && ` at ${event.event_time}`}
                      </p>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => startEdit(event.id, "event", event.title)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => deleteItem(event.id, "event")}>
                        <Trash className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => moveItem(event.id, "event", "up")}>
                        <ChevronUp className="h-4 w-4 mr-2" />
                        Move Up
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => moveItem(event.id, "event", "down")}>
                        <ChevronDown className="h-4 w-4 mr-2" />
                        Move Down
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {notes.length > 0 && (
        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Notes & Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {notes.map((note: any) => (
                <li key={note.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <FileText className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="flex-1">{note.content}</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => startEdit(note.id, "note", note.content)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => deleteItem(note.id, "note")}>
                        <Trash className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => moveItem(note.id, "note", "up")}>
                        <ChevronUp className="h-4 w-4 mr-2" />
                        Move Up
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => moveItem(note.id, "note", "down")}>
                        <ChevronDown className="h-4 w-4 mr-2" />
                        Move Down
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Health */}
      {health.length > 0 && (
        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-primary" />
              Health & Wellness
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {health.map((item: any) => (
                <li key={item.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <Heart className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="flex-1">{item.content}</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => startEdit(item.id, "health", item.content)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => deleteItem(item.id, "health")}>
                        <Trash className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => moveItem(item.id, "health", "up")}>
                        <ChevronUp className="h-4 w-4 mr-2" />
                        Move Up
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => moveItem(item.id, "health", "down")}>
                        <ChevronDown className="h-4 w-4 mr-2" />
                        Move Down
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {editingType}</DialogTitle>
          </DialogHeader>
          {editingType === "note" || editingType === "health" ? (
            <Textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="min-h-[100px]"
            />
          ) : (
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
            />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={cancelEdit}>
              Cancel
            </Button>
            <Button onClick={() => saveEdit(editingId!, editingType!)}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
