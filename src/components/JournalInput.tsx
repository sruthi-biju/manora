import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

interface JournalInputProps {
  onProcessed: () => void;
}

export const JournalInput = ({ onProcessed }: JournalInputProps) => {
  const [content, setContent] = useState("");
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      toast.error("Please write something in your journal");
      return;
    }

    setProcessing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Please sign in to continue");
        return;
      }

      const { data, error } = await supabase.functions.invoke("process-journal", {
        body: {
          journalContent: content,
          userId: user.id,
        },
      });

      if (error) throw error;

      toast.success("Journal processed! Your insights are ready.");
      setContent("");
      onProcessed();
    } catch (error: any) {
      console.error("Error processing journal:", error);
      toast.error(error.message || "Failed to process journal entry");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Card className="shadow-[var(--shadow-card)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Today's Journal
        </CardTitle>
        <CardDescription>
          Tell me about your day and I'll organize everything for you
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            placeholder="Today I woke up early and went for a run. Need to finish the project report by Friday. Feeling energized! Meeting with Sarah at 2pm tomorrow..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[200px] resize-none transition-[var(--transition-smooth)]"
          />
          <Button
            type="submit"
            disabled={processing}
            className="w-full"
          >
            {processing ? "Processing..." : "Process Journal Entry"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
