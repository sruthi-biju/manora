import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FileText, ArrowLeft, LogOut, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useNavigate } from "react-router-dom";

interface Note {
  id: string;
  content: string;
  created_at: string;
}

export default function NotesInsights() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error("Error fetching notes:", error);
      toast({
        title: "Error",
        description: "Failed to load notes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addNote = async () => {
    if (!newNote.trim()) {
      toast({
        title: "Error",
        description: "Note content cannot be empty",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("notes")
        .insert({
          content: newNote,
          user_id: user.id,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Note added successfully",
      });

      setNewNote("");
      setIsAdding(false);
      fetchNotes();
    } catch (error) {
      console.error("Error adding note:", error);
      toast({
        title: "Error",
        description: "Failed to add note",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="p-8 text-muted-foreground">Loading...</div>;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
            <div className="container mx-auto px-4 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <SidebarTrigger />
                <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </div>
              <Button variant="outline" onClick={handleSignOut} size="sm">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </header>

          <main className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold">Notes & Insights</h1>
              <Button onClick={() => setIsAdding(!isAdding)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Note
              </Button>
            </div>

            {isAdding && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Add New Note</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="note-content">Content</Label>
                    <Textarea
                      id="note-content"
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Enter note content"
                      className="min-h-[100px]"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={addNote}>Add</Button>
                    <Button variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Your Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {notes.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No notes yet</p>
          ) : (
            <div className="space-y-3">
              {notes.map((note) => (
                <div key={note.id} className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                  <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                </div>
              ))}
            </div>
          )}
            </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
