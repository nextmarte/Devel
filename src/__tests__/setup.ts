import '@testing-library/jest-dom';
import { expect, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { mockPrismaClient, resetPrismaMocks } from './mocks/prisma';
import { mockGetServerSession, resetNextAuthMocks } from './mocks/nextauth';
import {
  mockUseAuth,
  mockProcessMediaWithAuth,
  mockGetUserTranscriptions,
  mockDeleteTranscription,
} from './mocks/react-hooks';

// ============================================================================
// Cleanup after each test
// ============================================================================
afterEach(() => {
  cleanup();
  resetPrismaMocks();
  resetNextAuthMocks();
});

// ============================================================================
// Mock Global: window.matchMedia
// ============================================================================
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

// ============================================================================
// Mock Global: IntersectionObserver
// ============================================================================
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

// ============================================================================
// Mock Global: localStorage & sessionStorage
// ============================================================================
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock as any;

const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.sessionStorage = sessionStorageMock as any;

// ============================================================================
// Mock Global: Prisma (disponível em todos os testes)
// ============================================================================
vi.mock('@/lib/prisma', () => ({
  prisma: mockPrismaClient,
  default: mockPrismaClient,
}));

// ============================================================================
// Mock Global: NextAuth getServerSession (disponível em todos os testes)
// ============================================================================
vi.mock('next-auth', () => ({
  getServerSession: mockGetServerSession,
}));

// ============================================================================
// Mock Global: React Hooks & Server Actions (disponível em todos os testes)
// ============================================================================
vi.mock('@/hooks/use-auth', () => ({
  useAuth: mockUseAuth,
}));

vi.mock('@/app/actions-protected', () => ({
  processMediaWithAuth: mockProcessMediaWithAuth,
  getUserTranscriptions: mockGetUserTranscriptions,
  deleteTranscription: mockDeleteTranscription,
}));

// ============================================================================
// Suppress console errors during tests (optional)
// ============================================================================
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render') ||
       args[0].includes('Not implemented: HTMLFormElement.prototype.submit') ||
       args[0].includes('Warning: useLayoutEffect does nothing on the server'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
