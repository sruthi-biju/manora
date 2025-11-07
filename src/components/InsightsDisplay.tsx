import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Calendar, StickyNote, Heart } from "lucide-react";
import { format } from "date-fns";

interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  event_date: string | null;
  event_time: string | null;
}

interface Note {
  id: string;
  content: string;
  created_at: string;
}

interface HealthMention {
  id: string;
  content: string;
  created_at: string;
}

interface InsightsDisplayProps {
  refreshTrigger: number;
}

export const InsightsDisplay = ({ refreshTrigger }: InsightsDisplayProps) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [health, setHealth] = useState<HealthMention[]>([]);

  useEffect(() => {
    fetchData();
  }, [refreshTrigger]);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [tasksData, eventsData, notesData, healthData] = await Promise.all([
      supabase.from("tasks").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("calendar_events").select("*").eq("user_id", user.id).order("event_date", { ascending: true }),
      supabase.from("notes").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
      supabase.from("health_mentions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-accent text-accent-foreground";
      case "medium":
        return "bg-primary/20 text-primary";
      case "low":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Tasks */}
      <Card className="shadow-[var(--shadow-card)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            Tasks
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tasks yet</p>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-[var(--transition-smooth)]"
              >
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={() => toggleTask(task.id, task.completed)}
                  className="mt-1"
                />
                <div className="flex-1 space-y-1">
                  <p className={`text-sm ${task.completed ? "line-through text-muted-foreground" : ""}`}>
                    {task.title}
                  </p>
                  <Badge className={getPriorityColor(task.priority)} variant="secondary">
                    {task.priority}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Calendar Events */}
      <Card className="shadow-[var(--shadow-card)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Calendar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">No events scheduled</p>
          ) : (
            events.map((event) => (
              <div
                key={event.id}
                className="p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-[var(--transition-smooth)]"
              >
                <p className="text-sm font-medium">{event.title}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {event.event_date && format(new Date(event.event_date), "MMM dd, yyyy")}
                  {event.event_time && ` at ${event.event_time}`}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      <Card className="shadow-[var(--shadow-card)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <StickyNote className="w-5 h-5 text-primary" />
            Notes & Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {notes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No notes yet</p>
          ) : (
            notes.map((note) => (
              <div
                key={note.id}
                className="p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-[var(--transition-smooth)]"
              >
                <p className="text-sm">{note.content}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {format(new Date(note.created_at), "MMM dd, yyyy")}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Health */}
      <Card className="shadow-[var(--shadow-card)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-primary" />
            Health & Wellness
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {health.length === 0 ? (
            <p className="text-sm text-muted-foreground">No health data yet</p>
          ) : (
            health.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-[var(--transition-smooth)]"
              >
                <p className="text-sm">{item.content}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {format(new Date(item.created_at), "MMM dd, yyyy")}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};
