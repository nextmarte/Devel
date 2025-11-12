import { vi } from 'vitest';

/**
 * Mocks para React Hooks usados nos componentes
 */

// Types
interface MockUser {
  id: string;
  email: string;
  name: string;
  role: string;
  subscriptionPlan: string;
  subscriptionStatus: string;
}

interface MockSession {
  user: {
    id: string;
    email: string;
    name: string;
  };
  expires: string;
}

interface MockAuthContext {
  user: MockUser | null;
  session: MockSession | null;
  isLoading: boolean;
  isError: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<MockUser>) => Promise<void>;
}

// ============================================================================
// Mock de useAuth
// ============================================================================
export const mockUseAuth = vi.fn((): MockAuthContext => ({
  user: {
    id: 'test-user-1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'USER',
    subscriptionPlan: 'FREE',
    subscriptionStatus: 'ACTIVE',
  },
  session: {
    user: {
      id: 'test-user-1',
      email: 'test@example.com',
      name: 'Test User',
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  },
  isLoading: false,
  isError: false,
  login: vi.fn(),
  logout: vi.fn(),
  updateProfile: vi.fn(),
}));

// ============================================================================
// Mock de processMediaWithAuth (Server Action)
// ============================================================================
export const mockProcessMediaWithAuth = vi.fn(async (formData: FormData) => {
  // Simular sucesso por padrão
  return {
    data: {
      id: 'transcription-1',
      status: 'SUCCESS',
      transcription_text: 'Mocked transcription text',
      summary: 'Mocked summary',
    },
    error: null,
  };
});

// ============================================================================
// Mock de getUserTranscriptions (Server Action)
// ============================================================================
export const mockGetUserTranscriptions = vi.fn(async (page = 0, limit = 10) => {
  return {
    data: [
      {
        id: 'transcription-1',
        file_name: 'audio1.mp3',
        file_size: 5000000,
        status: 'SUCCESS',
        summary: 'First transcription summary',
        created_at: new Date('2024-01-10'),
      },
      {
        id: 'transcription-2',
        file_name: 'audio2.wav',
        file_size: 3000000,
        status: 'SUCCESS',
        summary: 'Second transcription summary',
        created_at: new Date('2024-01-09'),
      },
    ],
    total: 2,
    page,
    limit,
  };
});

// ============================================================================
// Mock de deleteTranscription (Server Action)
// ============================================================================
export const mockDeleteTranscription = vi.fn(async (id: string) => {
  return {
    data: { success: true },
    error: null,
  };
});

// ============================================================================
// Setup Helpers
// ============================================================================

/**
 * Configurar useAuth mock para retornar erro
 */
export function setupUseAuthErrorMock() {
  mockUseAuth.mockReturnValue({
    user: null as any,
    session: null as any,
    isLoading: false,
    isError: true,
    login: vi.fn(),
    logout: vi.fn(),
    updateProfile: vi.fn(),
  });
}

/**
 * Configurar useAuth mock para loading
 */
export function setupUseAuthLoadingMock() {
  mockUseAuth.mockReturnValue({
    user: null as any,
    session: null as any,
    isLoading: true,
    isError: false,
    login: vi.fn(),
    logout: vi.fn(),
    updateProfile: vi.fn(),
  });
}

/**
 * Configurar processMediaWithAuth para retornar erro
 */
export function setupProcessMediaWithAuthErrorMock(errorMessage: string) {
  mockProcessMediaWithAuth.mockResolvedValue({
    data: null as any,
    error: errorMessage,
  });
}

/**
 * Reset todos os mocks de actions
 */
export function resetActionsMocks() {
  mockProcessMediaWithAuth.mockReset();
  mockGetUserTranscriptions.mockReset();
  mockDeleteTranscription.mockReset();
  
  // Resetar para valores padrão
  mockProcessMediaWithAuth.mockResolvedValue({
    data: {
      id: 'transcription-1',
      status: 'SUCCESS',
      transcription_text: 'Mocked transcription text',
      summary: 'Mocked summary',
    },
    error: null,
  });
}

/**
 * Reset useAuth mock
 */
export function resetUseAuthMock() {
  mockUseAuth.mockReturnValue({
    user: {
      id: 'test-user-1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'USER',
      subscriptionPlan: 'FREE',
      subscriptionStatus: 'ACTIVE',
    },
    session: {
      user: {
        id: 'test-user-1',
        email: 'test@example.com',
        name: 'Test User',
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    },
    isLoading: false,
    isError: false,
    login: vi.fn(),
    logout: vi.fn(),
    updateProfile: vi.fn(),
  });
}

// ============================================================================
// Mock do window.matchMedia para Radix UI
// ============================================================================
export function setupMatchMediaMock() {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}
