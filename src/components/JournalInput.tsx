import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Sparkles, Mic, Square } from "lucide-react";

interface JournalInputProps {
  onProcessed: () => void;
}

export const JournalInput = ({ onProcessed }: JournalInputProps) => {
  const [content, setContent] = useState("");
  const [processing, setProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          setContent(prev => prev ? `${prev} ${finalTranscript}` : finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsRecording(false);
        
        if (event.error === 'not-allowed') {
          toast.error("Microphone access denied. Please allow microphone permissions.");
        } else if (event.error === 'no-speech') {
          toast.error("No speech detected. Please try again.");
        } else {
          toast.error("Speech recognition failed. Please try again.");
        }
      };

      recognitionRef.current.onend = () => {
        if (isRecording) {
          setIsRecording(false);
          toast.success("Recording stopped");
        }
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      toast.error("Speech recognition is not supported in your browser. Please use Chrome or Edge.");
      return;
    }

    try {
      recognitionRef.current.start();
      setIsRecording(true);
      toast.success("Recording started - speak now!");
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("Failed to start recording. Please try again.");
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

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
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={processing}
              className="flex-shrink-0"
            >
              {isRecording ? (
                <>
                  <Square className="w-4 h-4 mr-2" />
                  Stop Recording
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 mr-2" />
                  Record
                </>
              )}
            </Button>
            <Button
              type="submit"
              disabled={processing || isRecording}
              className="flex-1"
            >
              {processing ? "Processing..." : "Process Journal Entry"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
