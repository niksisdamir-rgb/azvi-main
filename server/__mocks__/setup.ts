/**
 * Vitest global setup — wires in-memory mocks for DB and Ollama.
 * Referenced by vitest.config.ts `test.setupFiles`.
 */
import { vi } from 'vitest';

// Mock the database module so no PostgreSQL connection is required
vi.mock('../db', async () => {
  const mock = await import('./db.mock');
  return mock;
});

// Mock the Ollama service so no local Ollama binary is required
vi.mock('../lib/ollama', async () => {
  const mock = await import('./ollama.mock');
  return mock;
});
