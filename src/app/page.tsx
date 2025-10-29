"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Upload, Square } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { processMedia } from "./actions";
import Logo from "@/components/logo";
import LoadingSpinner from "@/components/loading-spinner";
import TranscriptionDisplay from "@/components/transcription-display";
import EnhancedTranscriptionDisplay from "@/components/enhanced-transcription-display";
import { useToast } from "@/hooks/use-toast";
import AudioPlayer from "@/components/audio-player";
import SummaryDisplay from "@/components/summary-display";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import ProcessingProgress, { type ProcessingStep } from "@/components/processing-progress";
import DiffView from "@/components/diff-view";
import TranscriptionActions from "@/components/transcription-actions";
import TranscriptionHistory from "@/components/transcription-history";
import ThemeToggle from "@/components/theme-toggle";
import TranscriptionAnalytics from "@/components/transcription-analytics";
import BookmarkManager from "@/components/bookmark-manager";
import NoteManager from "@/components/note-manager";
import { TranscriptionData, TranscriptionEdit, Bookmark, Note } from "@/lib/transcription-types";
import { saveTranscription, updateTranscription } from "@/lib/transcription-storage";

export default function Home() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<ProcessingStep>('transcribing');
  const [rawTranscription, setRawTranscription] = useState<string | null>(null);
  const [correctedTranscription, setCorrectedTranscription] = useState<string | null>(null);
  const [identifiedTranscription, setIdentifiedTranscription] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [generateSummary, setGenerateSummary] = useState(true);
  const [currentTranscriptionId, setCurrentTranscriptionId] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [fileName, setFileName] = useState<string>('');
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);

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
    setProcessingStep('transcribing');
    setRawTranscription(null);
    setCorrectedTranscription(null);
    setIdentifiedTranscription(null);
    setSummary(null);

    formData.append('generateSummary', String(generateSummary));

    try {
      // Simulate step progression
      setProcessingStep('transcribing');
      await new Promise(resolve => setTimeout(resolve, 500));

      const result = await processMedia(formData);
      
      if (result.error) {
        setError(result.error);
        toast({
          variant: "destructive",
          title: "Ocorreu um erro",
          description: result.error,
        });
      } else if (result.data) {
        setProcessingStep('correcting');
        await new Promise(resolve => setTimeout(resolve, 300));
        
        setRawTranscription(result.data.rawTranscription);
        setCorrectedTranscription(result.data.correctedTranscription);
        
        setProcessingStep('identifying');
        await new Promise(resolve => setTimeout(resolve, 300));
        
        setIdentifiedTranscription(result.data.identifiedTranscription);
        
        if (generateSummary && result.data.summary) {
          setProcessingStep('summarizing');
          await new Promise(resolve => setTimeout(resolve, 300));
          setSummary(result.data.summary);
        }

        // Save to history
        const transcriptionData: TranscriptionData = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          duration: audioDuration,
          rawTranscription: result.data.rawTranscription,
          correctedTranscription: result.data.correctedTranscription,
          identifiedTranscription: result.data.identifiedTranscription,
          summary: result.data.summary,
          fileName: fileName,
          bookmarks: [],
          notes: [],
        };
        
        saveTranscription(transcriptionData);
        setCurrentTranscriptionId(transcriptionData.id);
        setBookmarks([]);
        setNotes([]);
      }
    } finally {
      setIsProcessing(false);
    }
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
        setRawTranscription(null);
        setCorrectedTranscription(null);
        setIdentifiedTranscription(null);
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
      setFileName(file.name);

      // Get audio duration
      const audio = new Audio(newAudioUrl);
      audio.addEventListener('loadedmetadata', () => {
        setAudioDuration(audio.duration);
      });

      const formData = new FormData();
      formData.append('file', file);
      handleProcess(formData);
    }
  };

  const handleNewTranscription = () => {
    setRawTranscription(null);
    setCorrectedTranscription(null);
    setIdentifiedTranscription(null);
    setSummary(null);
    setError(null);
    setCurrentTranscriptionId(null);
    setFileName('');
    setAudioDuration(0);
    setBookmarks([]);
    setNotes([]);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
  };

  const handleRestoreTranscription = (transcription: TranscriptionData) => {
    setRawTranscription(transcription.rawTranscription);
    setCorrectedTranscription(transcription.correctedTranscription);
    setIdentifiedTranscription(transcription.identifiedTranscription);
    setSummary(transcription.summary);
    setCurrentTranscriptionId(transcription.id);
    setFileName(transcription.fileName || '');
    setAudioDuration(transcription.duration);
    setBookmarks(transcription.bookmarks || []);
    setNotes(transcription.notes || []);
    setError(null);
    
    toast({
      title: 'Transcrição restaurada',
      description: 'A transcrição foi carregada do histórico',
    });
  };

  const handleEditTranscription = (editedText: string, edits: TranscriptionEdit[]) => {
    setIdentifiedTranscription(editedText);
    
    if (currentTranscriptionId) {
      updateTranscription(currentTranscriptionId, {
        identifiedTranscription: editedText,
        edits: edits,
      });
    }
  };

  const handleAddBookmark = (bookmark: Omit<Bookmark, 'id'>) => {
    const newBookmark: Bookmark = {
      ...bookmark,
      id: Date.now().toString(),
    };
    const updatedBookmarks = [...bookmarks, newBookmark];
    setBookmarks(updatedBookmarks);
    
    if (currentTranscriptionId) {
      updateTranscription(currentTranscriptionId, { bookmarks: updatedBookmarks });
    }
  };

  const handleDeleteBookmark = (id: string) => {
    const updatedBookmarks = bookmarks.filter(b => b.id !== id);
    setBookmarks(updatedBookmarks);
    
    if (currentTranscriptionId) {
      updateTranscription(currentTranscriptionId, { bookmarks: updatedBookmarks });
    }
  };

  const handleUpdateBookmark = (id: string, updates: Partial<Bookmark>) => {
    const updatedBookmarks = bookmarks.map(b => 
      b.id === id ? { ...b, ...updates } : b
    );
    setBookmarks(updatedBookmarks);
    
    if (currentTranscriptionId) {
      updateTranscription(currentTranscriptionId, { bookmarks: updatedBookmarks });
    }
  };

  const handleAddNote = (note: Omit<Note, 'id'>) => {
    const newNote: Note = {
      ...note,
      id: Date.now().toString(),
    };
    const updatedNotes = [...notes, newNote];
    setNotes(updatedNotes);
    
    if (currentTranscriptionId) {
      updateTranscription(currentTranscriptionId, { notes: updatedNotes });
    }
  };

  const handleDeleteNote = (id: string) => {
    const updatedNotes = notes.filter(n => n.id !== id);
    setNotes(updatedNotes);
    
    if (currentTranscriptionId) {
      updateTranscription(currentTranscriptionId, { notes: updatedNotes });
    }
  };

  const handleUpdateNote = (id: string, updates: Partial<Note>) => {
    const updatedNotes = notes.map(n => 
      n.id === id ? { ...n, ...updates } : n
    );
    setNotes(updatedNotes);
    
    if (currentTranscriptionId) {
      updateTranscription(currentTranscriptionId, { notes: updatedNotes });
    }
  };
  
  const hasResult = identifiedTranscription || summary;

  return (
    <div className="flex flex-col items-center min-h-screen bg-background text-foreground p-4 sm:p-8">
      <header className="w-full max-w-4xl mb-8 flex justify-between items-center">
        <Logo />
        <ThemeToggle />
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

        {!isProcessing && !error && !hasResult && (
          <TranscriptionHistory onRestore={handleRestoreTranscription} />
        )}

        {isProcessing && (
          <Card className="flex-grow shadow-lg shadow-primary/10 border-border">
            <CardHeader>
              <CardTitle className="text-2xl font-headline">Processando...</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <ProcessingProgress currentStep={processingStep} generateSummary={generateSummary} />
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
            {rawTranscription && correctedTranscription && identifiedTranscription && (
              <TranscriptionAnalytics
                rawTranscription={rawTranscription}
                correctedTranscription={correctedTranscription}
                identifiedTranscription={identifiedTranscription}
                duration={audioDuration}
              />
            )}
            {summary && <SummaryDisplay summary={summary} />}
            {identifiedTranscription && (
              <Card className="shadow-lg shadow-primary/10 border-border">
                <CardHeader>
                  <CardTitle className="text-2xl font-headline">Transcrição Completa</CardTitle>
                  <div className="mt-4">
                    <TranscriptionActions text={identifiedTranscription} title="Transcrição" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2">
                      <EnhancedTranscriptionDisplay 
                        raw={rawTranscription || undefined}
                        corrected={correctedTranscription || undefined}
                        identified={identifiedTranscription || undefined}
                        onEdit={handleEditTranscription}
                        editable={true}
                      />
                    </div>
                    <div className="space-y-4">
                      <BookmarkManager
                        bookmarks={bookmarks}
                        onAdd={handleAddBookmark}
                        onDelete={handleDeleteBookmark}
                        onUpdate={handleUpdateBookmark}
                        onJumpTo={(position) => {
                          // Scroll to position - will be implemented when we have position tracking
                          console.log('Jump to position:', position);
                        }}
                      />
                      <NoteManager
                        notes={notes}
                        onAdd={handleAddNote}
                        onDelete={handleDeleteNote}
                        onUpdate={handleUpdateNote}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            {rawTranscription && correctedTranscription && (
              <Card className="shadow-lg shadow-primary/10 border-border">
                <CardHeader>
                  <CardTitle className="text-2xl font-headline">Comparativo de Correções</CardTitle>
                </CardHeader>
                <CardContent>
                  <DiffView original={rawTranscription} corrected={correctedTranscription} />
                </CardContent>
              </Card>
            )}
            <Button 
              onClick={handleNewTranscription} 
              size="lg" 
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Mic className="w-5 h-5 mr-2" />
              Nova Transcrição
            </Button>
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
