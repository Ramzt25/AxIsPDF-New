// Test setup file for React Testing Library and Jest DOM
import '@testing-library/jest-dom';

// Polyfills for jsdom
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = require('util').TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = require('util').TextDecoder;
}

// Mock window.teamBeam for testing
const mockTeamBeam = {
  store: {
    get: jest.fn().mockResolvedValue([]),
    set: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue(undefined),
    clear: jest.fn().mockResolvedValue(undefined),
  },
  onMenuAction: jest.fn(),
  removeMenuListeners: jest.fn(),
  openProject: jest.fn().mockResolvedValue(undefined),
  importPdfs: jest.fn().mockResolvedValue(undefined),
  exportProject: jest.fn().mockResolvedValue(undefined),
  showSaveDialog: jest.fn().mockResolvedValue('/path/to/file'),
  showOpenDialog: jest.fn().mockResolvedValue(['/path/to/file']),
  platform: 'test',
  version: '1.0.0-test',
};

// Mock window object for tests
Object.defineProperty(window, 'teamBeam', {
  value: mockTeamBeam,
  writable: true,
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock WebSocket for collaboration tests
class MockWebSocket {
  constructor(url: string) {
    this.url = url;
    this.readyState = 1; // OPEN
    setTimeout(() => {
      if (this.onopen) this.onopen({} as Event);
    }, 0);
  }

  url: string;
  readyState: number;
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  send(data: string) {
    // Mock sending data
  }

  close() {
    this.readyState = 3; // CLOSED
    if (this.onclose) this.onclose({} as CloseEvent);
  }
}

Object.defineProperty(global, 'WebSocket', {
  value: MockWebSocket,
});

// Mock fetch for API calls
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
  })
) as jest.Mock;

// Suppress console warnings in tests
const originalConsoleWarn = console.warn;
console.warn = (...args: any[]) => {
  if (args[0]?.includes?.('React Router Future Flag Warning')) {
    return;
  }
  originalConsoleWarn(...args);
};

export { mockTeamBeam };

// Also add AxIs API for rebranded tests
Object.defineProperty(window, 'axIs', {
  value: mockTeamBeam,
  writable: true,
});