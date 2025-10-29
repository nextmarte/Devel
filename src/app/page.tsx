"use client";

import { useState } from "react";
import { Mic, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { processMedia } from "./actions";
import Logo from "@/components/logo";
import LoadingSpinner from "@/components/loading-spinner";
import TranscriptionDisplay from "@/components/transcription-display";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleProcess = async () => {
    setIsProcessing(true);
    setError(null);
    setTranscription(null);

    const result = await processMedia();
    
    if (result.error) {
      setError(result.error);
      toast({
        variant: "destructive",
        title: "An error occurred",
        description: result.error,
      });
    } else {
      setTranscription(result.data);
    }

    setIsProcessing(false);
  };

  const handleRecord = () => {
    // A real implementation would use MediaRecorder API.
    toast({
      title: "Demo Feature",
      description: "Audio recording is simulated. Proceeding with a sample transcription.",
    });
    handleProcess();
  };

  const handleUpload = () => {
    // A real implementation would handle file uploads.
    toast({
      title: "Demo Feature",
      description: "File upload is simulated. Proceeding with a sample transcription.",
    });
    handleProcess();
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-background text-foreground p-4 sm:p-8">
      <header className="w-full max-w-4xl mb-8">
        <Logo />
      </header>
      <main className="w-full max-w-4xl flex-grow flex flex-col gap-8">
        <Card className="shadow-lg shadow-primary/10 border-border">
          <CardHeader>
            <CardTitle className="text-2xl font-headline">Get Your Transcription</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">
              Record audio or upload a media file. Our AI will transcribe, correct, and identify speakers for you.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button onClick={handleRecord} disabled={isProcessing} size="lg" className="h-24 text-lg bg-accent text-accent-foreground hover:bg-accent/90">
                <Mic className="w-8 h-8 mr-4" />
                Record Audio
              </Button>
              <Button onClick={handleUpload} disabled={isProcessing} size="lg" className="h-24 text-lg bg-accent text-accent-foreground hover:bg-accent/90">
                <Upload className="w-8 h-8 mr-4" />
                Upload Media
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="flex-grow shadow-lg shadow-primary/10 border-border">
          <CardHeader>
            <CardTitle className="text-2xl font-headline">Result</CardTitle>
          </CardHeader>
          <CardContent className="h-full">
            <div className="w-full h-full min-h-[200px] p-4 border border-dashed border-border rounded-lg flex items-center justify-center bg-background/50">
              {isProcessing ? (
                <LoadingSpinner />
              ) : error ? (
                <p className="text-destructive">{error}</p>
              ) : transcription ? (
                <TranscriptionDisplay text={transcription} />
              ) : (
                <p className="text-muted-foreground">Your transcription will appear here.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
      <footer className="w-full max-w-4xl mt-8 text-center text-muted-foreground text-sm">
        <p>Powered by DareDevil.AI</p>
      </footer>
    </div>
  );
}
