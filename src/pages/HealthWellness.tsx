import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface HealthMention {
  id: string;
  content: string;
  created_at: string;
}

export default function HealthWellness() {
  const [healthMentions, setHealthMentions] = useState<HealthMention[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchHealthMentions();
  }, []);

  const fetchHealthMentions = async () => {
    try {
      const { data, error } = await supabase
        .from("health_mentions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setHealthMentions(data || []);
    } catch (error) {
      console.error("Error fetching health mentions:", error);
      toast({
        title: "Error",
        description: "Failed to load health mentions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Health & Wellness</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Health Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          {healthMentions.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No health mentions yet</p>
          ) : (
            <div className="space-y-3">
              {healthMentions.map((mention) => (
                <div key={mention.id} className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                  <p className="text-sm whitespace-pre-wrap">{mention.content}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
