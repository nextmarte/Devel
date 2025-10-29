"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Upload, Square } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { processMedia } from "./actions";
import Logo from "@/components/logo";
import LoadingSpinner from "@/components/loading-spinner";
import TranscriptionDisplay from "@/components/transcription-display";
import { useToast } from "@/hooks/use-toast";
import AudioPlayer from "@/components/audio-player";
import SummaryDisplay from "@/components/summary-display";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function Home() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [generateSummary, setGenerateSummary] = useState(true);

  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    // Clean up the object URL when the component unmounts
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const handleProcess = async (formData: FormData) => {
    setIsProcessing(true);
    setError(null);
    setTranscription(null);
    setSummary(null);

    formData.append('generateSummary', String(generateSummary));

    const result = await processMedia(formData);
    
    if (result.error) {
      setError(result.error);
      toast({
        variant: "destructive",
        title: "Ocorreu um erro",
        description: result.error,
      });
    } else if (result.data) {
      setTranscription(result.data.transcription);
      setSummary(result.data.summary);
    }

    setIsProcessing(false);
  };

  const handleRecord = async () => {
    if (isRecording) {
      // Stop recording
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        audioChunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };

        mediaRecorderRef.current.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          const audioFile = new File([audioBlob], "recording.webm", { type: "audio/webm" });
          
          if (audioUrl) {
            URL.revokeObjectURL(audioUrl);
          }
          const newAudioUrl = URL.createObjectURL(audioBlob);
          setAudioUrl(newAudioUrl);
          
          const formData = new FormData();
          formData.append('file', audioFile);
          handleProcess(formData);

          // Stop all tracks on the stream to turn off the microphone light
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorderRef.current.start();
        setIsRecording(true);
        setError(null);
        setTranscription(null);
        setSummary(null);
      } catch (err) {
        console.error("Error accessing microphone:", err);
        const errorMessage = "Não foi possível acessar o microfone. Verifique as permissões do seu navegador.";
        setError(errorMessage);
        toast({
          variant: "destructive",
          title: "Erro no Microfone",
          description: errorMessage,
        });
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      const newAudioUrl = URL.createObjectURL(file);
      setAudioUrl(newAudioUrl);

      const formData = new FormData();
      formData.append('file', file);
      handleProcess(formData);
    }
  };
  
  const hasResult = transcription || summary;

  return (
    <div className="flex flex-col items-center min-h-screen bg-background text-foreground p-4 sm:p-8">
      <header className="w-full max-w-4xl mb-8">
        <Logo />
      </header>
      <main className="w-full max-w-4xl flex-grow flex flex-col gap-8">
        <Card className="shadow-lg shadow-primary/10 border-border">
          <CardHeader>
            <CardTitle className="text-2xl font-headline">Obtenha sua Transcrição</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Grave um áudio ou envie um arquivo de mídia. Nossa IA irá transcrever, corrigir e identificar os locutores para você.
            </p>
            <div className="flex items-center space-x-2 mb-6">
              <Switch id="summary-switch" checked={generateSummary} onCheckedChange={setGenerateSummary} />
              <Label htmlFor="summary-switch">Gerar ata da reunião</Label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button onClick={handleRecord} disabled={isProcessing} size="lg" className="h-24 text-lg bg-accent text-accent-foreground hover:bg-accent/90">
                {isRecording ? <Square className="w-8 h-8 mr-4 animate-pulse" /> : <Mic className="w-8 h-8 mr-4" />}
                {isRecording ? "Parar Gravação" : "Gravar Áudio"}
              </Button>
              <Button onClick={handleUploadClick} disabled={isProcessing || isRecording} size="lg" className="h-24 text-lg bg-accent text-accent-foreground hover:bg-accent/90">
                <Upload className="w-8 h-8 mr-4" />
                Enviar Mídia
              </Button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange}
                className="hidden" 
                accept="audio/*,video/*"
              />
            </div>
          </CardContent>
        </Card>

        {isProcessing && (
          <Card className="flex-grow shadow-lg shadow-primary/10 border-border">
            <CardContent className="h-full p-6">
              <div className="w-full h-full min-h-[200px] p-4 border border-dashed border-border rounded-lg flex flex-col items-center justify-center bg-background/50">
                <LoadingSpinner />
              </div>
            </CardContent>
          </Card>
        )}

        {error && !isProcessing && (
          <Card className="flex-grow shadow-lg shadow-destructive/20 border-destructive/50">
            <CardHeader>
              <CardTitle className="text-2xl font-headline text-destructive">Erro</CardTitle>
            </CardHeader>
            <CardContent className="h-full">
              <div className="w-full h-full min-h-[200px] p-4 border border-dashed border-destructive/50 rounded-lg flex flex-col items-center justify-center bg-background/50">
                <p className="text-destructive">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}
        
        {!isProcessing && !error && hasResult && (
          <>
            {audioUrl && <AudioPlayer src={audioUrl} />}
            {summary && <SummaryDisplay summary={summary} />}
            {transcription && (
              <Card className="shadow-lg shadow-primary/10 border-border">
                <CardHeader>
                  <CardTitle className="text-2xl font-headline">Transcrição Completa</CardTitle>
                </CardHeader>
                <CardContent>
                  <TranscriptionDisplay text={transcription} />
                </CardContent>
              </Card>
            )}
          </>
        )}

        {!isProcessing && !error && !hasResult && (
           <Card className="flex-grow shadow-lg shadow-primary/10 border-border">
            <CardHeader>
              <CardTitle className="text-2xl font-headline">Resultado</CardTitle>
            </CardHeader>
            <CardContent className="h-full">
              <div className="w-full h-full min-h-[200px] p-4 border border-dashed border-border rounded-lg flex flex-col items-center justify-center bg-background/50">
                  <p className="text-muted-foreground">Sua transcrição e ata aparecerão aqui.</p>
              </div>
            </CardContent>
          </Card>
        )}

      </main>
      <footer className="w-full max-w-4xl mt-8 text-center text-muted-foreground text-sm">
        <p>Desenvolvido por DareDevil.AI</p>
      </footer>
    </div>
  );
}
