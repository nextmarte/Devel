/**
 * Exemplo de integração e uso da transcrição assíncrona
 * Este arquivo demonstra como usar as novas funcionalidades
 */

// ============================================================================
// 1. EXEMPLO BÁSICO: Iniciar uma transcrição assíncrona
// ============================================================================

import { startAsyncTranscription, checkAsyncTranscriptionStatus } from "@/app/actions";
import { saveAsyncTask, getAsyncTask, updateAsyncTask } from "@/lib/async-transcription-storage";
import { AsyncTranscriptionTask } from "@/lib/transcription-types";

async function basicExample() {
  // Simular seleção de arquivo
  const file = new File(["audio data"], "meeting.mp3", { type: "audio/mpeg" });
  
  const formData = new FormData();
  formData.append("file", file);
  formData.append("language", "pt");

  // Iniciar transcrição assíncrona
  const { taskId, error } = await startAsyncTranscription(formData);

  if (error) {
    console.error("Erro ao iniciar:", error);
    return;
  }

  console.log(`Transcrição iniciada! Task ID: ${taskId}`);
  
  // Criar registro local
  const task: AsyncTranscriptionTask = {
    id: Date.now().toString(),
    taskId: taskId!,
    localId: taskId!,
    fileName: file.name,
    fileSize: file.size,
    status: "PENDING",
    progress: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    retries: 0,
    maxRetries: 3,
    language: "pt",
    generateSummary: true,
  };

  saveAsyncTask(task);
}

// ============================================================================
// 2. EXEMPLO: Monitorar progresso manualmente
// ============================================================================

async function monitorProgressExample(taskId: string) {
  let isComplete = false;
  let attempts = 0;
  const maxAttempts = 300; // 10 minutos com intervalo de 2s

  while (!isComplete && attempts < maxAttempts) {
    const { status, error } = await checkAsyncTranscriptionStatus(taskId);

    if (error) {
      console.error("Erro ao verificar status:", error);
      break;
    }

    if (status) {
      console.log(`Status: ${status.state}`);
      console.log(`Progresso: ${status.progress?.percentage}%`);

      switch (status.state) {
        case "SUCCESS":
          console.log("✅ Transcrição concluída!");
          console.log("Texto:", status.result?.transcription?.text);
          isComplete = true;
          break;

        case "FAILURE":
          console.error("❌ Erro na transcrição:", status.error);
          isComplete = true;
          break;

        case "CANCELLED":
          console.log("⏹️ Transcrição cancelada");
          isComplete = true;
          break;

        case "PENDING":
        case "STARTED":
        case "RETRY":
          console.log("⏳ Aguardando...");
          break;
      }
    }

    // Aguardar 2 segundos antes de verificar novamente
    await new Promise((resolve) => setTimeout(resolve, 2000));
    attempts++;
  }

  if (attempts >= maxAttempts) {
    console.warn("⏱️ Timeout: Tarefa não foi concluída em tempo");
  }
}

// ============================================================================
// 3. EXEMPLO: Processar resultado com IA
// ============================================================================

import { processAsyncTranscriptionResult } from "@/app/actions";

async function processWithAIExample(transcriptionText: string) {
  const { data, error } = await processAsyncTranscriptionResult(
    transcriptionText,
    true // generateSummary
  );

  if (error) {
    console.error("Erro no processamento:", error);
    return;
  }

  if (data) {
    console.log("📝 Resultado do processamento:");
    console.log("\nTranscrição Corrigida:");
    console.log(data.correctedTranscription);

    console.log("\nLocutores Identificados:");
    console.log(data.identifiedTranscription);

    console.log("\nResumo/Ata:");
    console.log(data.summary);
  }
}

// ============================================================================
// 4. EXEMPLO: Trabalhar com tarefas armazenadas
// ============================================================================

import {
  getAsyncTasks,
  getActiveTasks,
  getCompletedTasks,
  getFailedTasks,
  deleteAsyncTask,
  cleanupOldTasks,
} from "@/lib/async-transcription-storage";

function storageExample() {
  // Obter todas as tarefas
  const allTasks = getAsyncTasks();
  console.log("Total de tarefas:", allTasks.length);

  // Obter tarefas ativas
  const activeTasks = getActiveTasks();
  console.log("Tarefas ativas:", activeTasks.length);
  activeTasks.forEach((task) => {
    console.log(`  - ${task.fileName}: ${task.progress}%`);
  });

  // Obter tarefas concluídas
  const completedTasks = getCompletedTasks();
  console.log("Tarefas concluídas:", completedTasks.length);

  // Obter tarefas com erro
  const failedTasks = getFailedTasks();
  console.log("Tarefas com erro:", failedTasks.length);
  failedTasks.forEach((task) => {
    console.log(`  - ${task.fileName}: ${task.error}`);
  });

  // Deletar uma tarefa específica
  if (allTasks.length > 0) {
    const firstTask = allTasks[0];
    deleteAsyncTask(firstTask.localId);
    console.log(`Tarefa ${firstTask.fileName} deletada`);
  }

  // Limpar tarefas antigas (7+ dias)
  cleanupOldTasks(7);
  console.log("Limpeza de tarefas antigas concluída");
}

// ============================================================================
// 5. EXEMPLO: Hook React para monitorar tarefas
// ============================================================================

/*
  Este é um exemplo de hook React.
  Para ver o código completo, veja: ASYNC_TRANSCRIPTION_EXAMPLES.tsx
*/

// NOTA: Este exemplo com React está em um arquivo TSX separado
// Descomente abaixo para referência de implementação:

/*
export function useAsyncTranscription(taskId: string | null) {
  const [task, setTask] = useState<AsyncTranscriptionTask | null>(null);
  const [isPolling, setIsPolling] = useState(!!taskId);

  const pollStatus = useCallback(async () => {
    if (!taskId) return;

    const { status, error } = await checkAsyncTranscriptionStatus(taskId);
    if (error) {
      console.error("Erro ao verificar status:", error);
      return;
    }

    if (status?.result) {
      const localTask = getAsyncTask(taskId);
      if (localTask) {
        const updated = {
          ...localTask,
          status: status.state,
          progress: status.progress?.percentage || 0,
          result: status.result,
        };
        setTask(updated);
        updateAsyncTask(taskId, updated);

        if (["SUCCESS", "FAILURE", "CANCELLED"].includes(status.state)) {
          setIsPolling(false);
        }
      }
    }
  }, [taskId]);

  useEffect(() => {
    if (!isPolling) return;
    const interval = setInterval(pollStatus, 2000);
    pollStatus();
    return () => clearInterval(interval);
  }, [isPolling, pollStatus]);

  return { task, isPolling };
}
*/

// ============================================================================
// 8. EXEMPLO: Tratamento de Erros
// ============================================================================

async function errorHandlingExample(taskId: string) {
  try {
    const { status, error } = await checkAsyncTranscriptionStatus(taskId);

    if (error) {
      // Erro de conexão/API
      console.error("Erro na requisição:", error);
      // Implementar retry ou notificar usuário
      return;
    }

    if (status?.state === "FAILURE") {
      // Erro na transcrição
      console.error("Transcrição falhou:", status.error);
      // Opções:
      // 1. Permitir retry manual
      // 2. Deletar tarefa
      // 3. Mostrar logs detalhados
      return;
    }

    if (status?.state === "RETRY") {
      // Tentando novamente
      console.log("Tentativa", status.result?.error || "automática");
      // Continuação automática
      return;
    }

    // Sucesso - processar resultado
    if (status?.state === "SUCCESS" && status.result?.success) {
      await processWithAIExample(status.result.transcription!.text);
    }
  } catch (err) {
    console.error("Erro inesperado:", err);
    // Tratamento de exceções
  }
}

// ============================================================================
// Exportar exemplos
// ============================================================================

export {
  basicExample,
  monitorProgressExample,
  processWithAIExample,
  storageExample,
  errorHandlingExample,
};
