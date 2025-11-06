import { AsyncJob, AsyncJobStatus } from './transcription-types';

// Usar localStorage no cliente e memória no servidor
const jobs = new Map<string, AsyncJob>();

export const asyncJobStorage = {
  // Criar um novo job
  createJob(jobId: string, fileName: string, fileSize: number): AsyncJob {
    const job: AsyncJob = {
      jobId,
      status: 'PENDING',
      fileName,
      fileSize,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      progress: {
        stage: 'transcribing',
        percentage: 0,
      },
    };

    jobs.set(jobId, job);
    this.persistJob(job);

    return job;
  },

  // Atualizar status de um job
  updateJobStatus(
    jobId: string,
    status: AsyncJobStatus,
    result?: any,
    error?: string,
    processingTime?: number
  ): AsyncJob | null {
    const job = jobs.get(jobId);

    if (!job) {
      return null;
    }

    job.status = status;
    job.updatedAt = Date.now();

    if (result) {
      job.result = result;
    }

    if (error) {
      job.error = error;
    }

    if (processingTime) {
      if (!job.result) {
        job.result = {
          rawTranscription: '',
          correctedTranscription: '',
          identifiedTranscription: '',
          summary: null,
          processingTime: 0,
          audioInfo: {
            format: '',
            duration: 0,
            sampleRate: 0,
            channels: 0,
            fileSizeMb: 0,
          },
        };
      }
      job.result.processingTime = processingTime;
    }

    // Atualizar progresso
    if (status === 'STARTED') {
      job.progress = { stage: 'transcribing', percentage: 25 };
    } else if (status === 'SUCCESS') {
      job.progress = { stage: 'completed', percentage: 100 };
    } else if (status === 'FAILURE') {
      job.progress = { stage: 'completed', percentage: 0 };
    }

    jobs.set(jobId, job);
    this.persistJob(job);

    return job;
  },

  // Buscar um job pelo ID
  getJob(jobId: string): AsyncJob | null {
    const job = jobs.get(jobId);
    if (!job) {
      // Tentar recuperar do localStorage se estiver no cliente
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(`job_${jobId}`);
        if (stored) {
          return JSON.parse(stored);
        }
      }
      return null;
    }
    return job;
  },

  // Listar todos os jobs
  getAllJobs(): AsyncJob[] {
    return Array.from(jobs.values());
  },

  // Listar jobs recentes
  getRecentJobs(limit: number = 10): AsyncJob[] {
    return Array.from(jobs.values())
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  },

  // Remover um job
  deleteJob(jobId: string): boolean {
    const deleted = jobs.delete(jobId);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`job_${jobId}`);
    }
    return deleted;
  },

  // Persistir job no localStorage (para cliente)
  persistJob(job: AsyncJob): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`job_${job.jobId}`, JSON.stringify(job));
      // Manter histórico de jobs recentes
      const recentJobs = this.getRecentJobs(50);
      localStorage.setItem('recent_jobs', JSON.stringify(recentJobs));
    }
  },

  // Recuperar histórico de jobs recentes
  getJobHistory(): AsyncJob[] {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('recent_jobs');
      if (stored) {
        return JSON.parse(stored);
      }
    }
    return [];
  },

  // Limpar jobs antigos (mais de 7 dias)
  cleanup(): void {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const toDelete: string[] = [];

    jobs.forEach((job, jobId) => {
      if (job.updatedAt < sevenDaysAgo) {
        toDelete.push(jobId);
      }
    });

    toDelete.forEach((jobId) => this.deleteJob(jobId));
  },
};
