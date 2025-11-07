"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Upload, Square } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  startAsyncTranscription,
  getAsyncTranscriptionStatus,
  cancelAsyncTranscription,
} from './actions';
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
import { ProcessingProgressDetail } from "@/components/processing-progress-detail";
import DiffView from "@/components/diff-view";
import SettingsPanel from "@/components/settings-panel";
import TranscriptionAnalytics from "@/components/transcription-analytics";
import BookmarkManager from "@/components/bookmark-manager";
import NoteManager from "@/components/note-manager";
import TranscriptionActions from "@/components/transcription-actions";
import AppLayout from "@/components/app-layout";
import AppSidebar from "@/components/app-sidebar";
import ActionBar from "@/components/action-bar";
import { TranscriptionData, TranscriptionEdit, Bookmark, Note } from "@/lib/transcription-types";
import { saveTranscription, updateTranscription, removeDuplicates } from "@/lib/transcription-storage";
import { useTranscriptionPolling } from "@/hooks/use-transcription-polling";
import { useSessionId } from "@/hooks/use-session-id";
import { useSessionState } from "@/hooks/use-session-state";

export default function Home() {
  // Session ID para isolação de usuários
  const sessionId = useSessionId();
  
  // Estado persistente da sessão
  const { sessionState, setSessionState, clearSessionState, isHydrated } = useSessionState();
  
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
  
  // Estados para transcrição assíncrona
  const [currentJobId, setCurrentJobIdInternal] = useState<string | null>(null);
  
  // Wrapper para sincronizar com sessionState
  const setCurrentJobId = (jobId: string | null) => {
    setCurrentJobIdInternal(jobId);
    setSessionState({ 
      currentJobId: jobId,
      isProcessing: jobId !== null,
    });
  };
  
  // Restaurar estado na hidratação
  useEffect(() => {
    console.log('🔍 useEffect restauração - isHydrated:', isHydrated, 'jobId:', sessionState.currentJobId);
    
    if (isHydrated && sessionState.currentJobId) {
      console.log('🔄 Restaurando job em andamento:', sessionState.currentJobId);
      setCurrentJobIdInternal(sessionState.currentJobId);
      setIsProcessing(sessionState.isProcessing);
      setFileName(sessionState.fileName);
      setAudioDuration(sessionState.audioDuration);
      
      console.log('✅ Estado restaurado - polling deve iniciar automaticamente');
    } else if (isHydrated) {
      console.log('📭 Nenhum job em andamento para restaurar');
    }
  }, [isHydrated, sessionState.currentJobId]);
  
  // Debug: Log sempre que os estados mudarem
  useEffect(() => {
    console.log('📊 Estado atual:', {
      currentJobId,
      isProcessing,
      isHydrated,
      sessionStateJobId: sessionState.currentJobId,
    });
  }, [currentJobId, isProcessing, isHydrated, sessionState.currentJobId]);
  
  // Ref para evitar chamadas múltiplas do onComplete
  const hasCompletedRef = useRef<Set<string>>(new Set());

  // Hook de polling para transcrição assíncrona
  const { job: asyncJob, isPolling, error: pollingError } = useTranscriptionPolling({
    jobId: currentJobId,
    sessionId: sessionId,
    onComplete: async (completedJob) => {
      // Prevenir múltiplas chamadas para o mesmo job
      if (hasCompletedRef.current.has(completedJob.jobId)) {
        console.log('⚠️ Job já foi processado, ignorando:', completedJob.jobId);
        return;
      }
      hasCompletedRef.current.add(completedJob.jobId);
      
      console.log('✅ Transcrição do Daredevil concluída!', completedJob);
      console.log('📦 Dados do job:', JSON.stringify(completedJob, null, 2));
      
      if (completedJob.result) {
        const transcriptionText = completedJob.result.rawTranscription || '';
        
        console.log('📝 Texto da transcrição:', transcriptionText.substring(0, 100));
        console.log('📦 Result completo:', JSON.stringify(completedJob.result, null, 2));
        
        // NOVO: Processar flows de IA
        console.log('[APP] ✅ Os flows já foram processados no servidor! Apenas usando os resultados...');
        
        // Usar os resultados que já vêm prontos do servidor
        const flowsResult = {
          success: true,
          correctedTranscription: completedJob.result.correctedTranscription,
          identifiedTranscription: completedJob.result.identifiedTranscription,
          summary: completedJob.result.summary,
        };
        
        // Atualizar estado com os resultados prontos do servidor do servidor
        console.log('[APP] ✅ Usando resultados já processados no servidor');
        setRawTranscription(transcriptionText);
        setCorrectedTranscription(flowsResult.correctedTranscription || transcriptionText);
        setIdentifiedTranscription(flowsResult.identifiedTranscription || transcriptionText);
        setSummary(flowsResult.summary || null);
        
        // Salvar no histórico
        const transcriptionData: TranscriptionData = {
          id: completedJob.jobId,
          timestamp: completedJob.createdAt,
          duration: completedJob.result.audioInfo?.duration || audioDuration,
          rawTranscription: transcriptionText,
          correctedTranscription: flowsResult.correctedTranscription || transcriptionText,
          identifiedTranscription: flowsResult.identifiedTranscription || transcriptionText,
          summary: flowsResult.summary || null,
          fileName: completedJob.fileName,
          bookmarks: [],
          notes: [],
        };
        
        console.log('💾 Salvando transcrição:', transcriptionData.id);
        saveTranscription(transcriptionData);
        setCurrentTranscriptionId(transcriptionData.id);
        setBookmarks([]);
        setNotes([]);
      } else {
        console.warn('⚠️ Job completou mas sem result!');
      }
      
      setIsProcessing(false);
      setCurrentJobId(null); // Limpar jobId para parar polling
      clearSessionState(); // Limpar estado persistente
      releaseWakeLock();
    },
    onError: (errorMsg) => {
      console.error('❌ Erro no polling:', errorMsg);
      setError(errorMsg);
      setIsProcessing(false);
      setCurrentJobId(null); // Limpar jobId para parar polling
      clearSessionState(); // Limpar estado persistente
      releaseWakeLock();
      toast({
        variant: "destructive",
        title: "Erro na Transcrição",
        description: errorMsg,
      });
    },
    pollInterval: 2000,
  });

  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const wakeLockRef = useRef<any>(null);

  // Limpar duplicatas do histórico na montagem
  useEffect(() => {
    console.log('🧹 Limpando duplicatas do histórico...');
    removeDuplicates();
  }, []);
  
  // Mostrar toast quando restaurar sessão
  useEffect(() => {
    if (isHydrated && sessionState.currentJobId && sessionState.isProcessing) {
      toast({
        title: "Sessão Restaurada",
        description: `Continuando processamento de ${sessionState.fileName}`,
        duration: 3000,
      });
    }
  }, [isHydrated]);

  // Função para manter a tela ligada durante gravação/processamento
  const acquireWakeLock = async () => {
    try {
      if ('wakeLock' in navigator && !wakeLockRef.current) {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
      }
    } catch (err) {
      console.log('Wake Lock não disponível:', err);
    }
  };

  // Função para liberar a tela
  const releaseWakeLock = () => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release();
      wakeLockRef.current = null;
    }
  };

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
      // Manter a tela ligada durante processamento
      await acquireWakeLock();

      // Modo assíncrono com polling
      setProcessingStep('transcribing');
      const result = await startAsyncTranscription(formData, sessionId);
      
      if (result.error) {
        setError(result.error);
        setIsProcessing(false);
        releaseWakeLock();
        toast({
          variant: "destructive",
          title: "Ocorreu um erro",
          description: result.error,
        });
      } else if (result.jobId) {
        console.log('✅ Job iniciado:', result.jobId);
        setCurrentJobId(result.jobId);
        
        // Salvar informações do arquivo no estado da sessão
        const file = formData.get('file') as File;
        setSessionState({
          currentJobId: result.jobId,
          isProcessing: true,
          fileName: file.name,
          audioDuration: audioDuration,
        });
        
        // Polling iniciará automaticamente via hook
      }
    } catch (error: any) {
      console.error("Error processing media:", error);
      setError(error.message || "Falha ao processar a transcrição.");
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Falha ao processar a transcrição.",
      });
      setIsProcessing(false);
      releaseWakeLock();
    }
  };

  const handleRecord = async () => {
    if (isRecording) {
      // Stop recording
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      releaseWakeLock();
    } else {
      // Start recording
      try {
        // Manter a tela ligada durante gravação
        await acquireWakeLock();
        
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
    <AppLayout
      sidebar={<AppSidebar onRestoreTranscription={handleRestoreTranscription} />}
    >
      <div className="flex flex-col min-h-screen bg-background text-foreground">
        <main className="flex-1 p-4 sm:p-8 max-w-6xl mx-auto w-full">
          <Card className="shadow-lg shadow-primary/10 border-border">
            <CardHeader>
              <CardTitle className="text-2xl font-headline">Obtenha sua Transcrição</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Grave um áudio ou envie um arquivo de mídia. Nossa IA irá transcrever, corrigir e identificar os locutores para você.
              </p>
              <div className="space-y-4 mb-6">
                <div className="flex items-center space-x-2">
                  <Switch id="summary-switch" checked={generateSummary} onCheckedChange={setGenerateSummary} />
                  <Label htmlFor="summary-switch">Gerar ata da reunião</Label>
                </div>
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
                {!isProcessing && !error && (identifiedTranscription || rawTranscription) && (
                  <Button 
                    onClick={handleNewTranscription} 
                    size="lg" 
                    className="h-24 text-lg sm:col-span-2 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Mic className="w-8 h-8 mr-4" />
                    Nova Transcrição
                  </Button>
                )}
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

          <div className="mt-8 space-y-8">

        {isProcessing && (
          <Card className="flex-grow shadow-lg shadow-primary/10 border-border">
            <CardHeader>
              <CardTitle className="text-2xl font-headline">
                📡 Processando em Background...
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <LoadingSpinner />
                  <div>
                    <p className="font-medium">Job ID: {currentJobId}</p>
                    <p className="text-sm text-muted-foreground">
                      Status: {asyncJob?.status || 'PENDING'}
                    </p>
                    {asyncJob?.progress && (
                      <p className="text-sm text-muted-foreground">
                        Progresso: {asyncJob.progress.percentage}%
                      </p>
                    )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    A transcrição está sendo processada no servidor. Você pode consultar o status a qualquer momento usando o ID do job.
                  </p>
                  <ProcessingProgressDetail 
                    events={asyncJob?.processingEvents} 
                    currentStage={asyncJob?.status}
                  />
                  {currentJobId && (
                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={async () => {
                          try {
                            const result = await cancelAsyncTranscription(currentJobId, sessionId);
                            if (result.error) {
                              toast({
                                variant: "destructive",
                                title: "Erro",
                                description: result.error,
                              });
                            } else {
                              toast({
                                title: "Cancelado",
                                description: "Transcrição cancelada com sucesso.",
                              });
                              setIsProcessing(false);
                              setCurrentJobId(null);
                              clearSessionState();
                            }
                          } catch (err: any) {
                            toast({
                              variant: "destructive",
                              title: "Erro",
                              description: err.message || "Falha ao cancelar transcrição.",
                            });
                          }
                        }}
                      >
                        <Square className="w-4 h-4 mr-2" />
                        Cancelar
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsProcessing(false);
                          setCurrentJobId(null);
                          clearSessionState();
                          toast({
                            title: "Sessão Limpa",
                            description: "Estado da sessão foi resetado.",
                          });
                        }}
                      >
                        Limpar Sessão
                      </Button>
                    </div>
                  )}
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
          </>
        )}

        {!isProcessing && !error && !hasResult && (
           <Card className="shadow-lg shadow-primary/10 border-border">
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

          </div>

          <footer className="mt-8 text-center text-muted-foreground text-sm pb-8">
            <p className="mb-2">Desenvolvido por <span className="font-semibold">Marcus Antonio</span></p>
            <p className="text-xs">
              📧 <a href="mailto:marcusantonio@id.uff.br" className="hover:text-primary transition-colors">marcusantonio@id.uff.br</a>
            </p>
          </footer>
        </main>
      </div>

      <ActionBar 
        text={identifiedTranscription || ""} 
        isVisible={!isProcessing && !error && !!identifiedTranscription}
        title="Transcrição"
      />
    </AppLayout>
  );
}
