import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import { sdk, SessionPayload } from '../lib/sdk';
import * as db from '../db';

// Mock DB
vi.mock('../db', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../db')>();
    return {
        ...actual,
        getUserByOpenId: vi.fn(),
        getUserByEmail: vi.fn(),
        createUser: vi.fn(),
        updateUser: vi.fn(),
        getUserById: vi.fn(),
    };
});

// Mock ENV
vi.mock('../lib/env', () => ({
    ENV: {
        auth0Domain: 'test-domain.auth0.com',
        auth0Issuer: 'https://test-domain.auth0.com/',
        auth0Audience: 'test-audience',
        cookieSecret: 'test-secret',
    },
}));

// Mock jose
vi.mock('jose', async (importOriginal) => {
    const actual = await importOriginal<typeof import('jose')>();
    return {
        ...actual,
        createRemoteJWKSet: vi.fn().mockReturnValue((header: any, token: any) => Promise.resolve({ kty: 'RSA' })),
        jwtVerify: vi.fn(),
    };
});

import { jwtVerify } from 'jose';

describe('Auth0 Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('verifyAuth0Token', () => {
        it('should return existing user if found by openId', async () => {
            const mockUser = { id: 1, openId: 'auth0|123', email: 'test@example.com' };

            // Mock DB response
            vi.mocked(db.getUserByOpenId).mockResolvedValue(mockUser as any);

            // Mock JWT verification
            vi.mocked(jwtVerify).mockResolvedValue({
                payload: { sub: 'auth0|123', email: 'test@example.com' },
                protectedHeader: { alg: 'RS256' }
            });

            const user = await sdk.verifyAuth0Token('valid-token');

            expect(user).toEqual(mockUser);
            expect(db.getUserByOpenId).toHaveBeenCalledWith('auth0|123');
        });

        it('should auto-provision new user if not found', async () => {
            // Mock DB responses
            vi.mocked(db.getUserByOpenId).mockResolvedValue(undefined);
            vi.mocked(db.getUserByEmail).mockResolvedValue(undefined);

            const newUser = { id: 2, openId: 'auth0|456', email: 'new@example.com' };
            vi.mocked(db.createUser).mockResolvedValue([newUser] as any);

            // Mock JWT verification
            vi.mocked(jwtVerify).mockResolvedValue({
                payload: { sub: 'auth0|456', email: 'new@example.com' },
                protectedHeader: { alg: 'RS256' }
            });

            const user = await sdk.verifyAuth0Token('valid-token-new-user');

            expect(user).toEqual(newUser);
            expect(db.createUser).toHaveBeenCalled();
        });

        it('should link existing user by email if not found by openId', async () => {
            const existingUser = { id: 3, email: 'existing@example.com', openId: 'old-id' };

            // Mock DB responses
            vi.mocked(db.getUserByOpenId).mockResolvedValue(undefined);
            vi.mocked(db.getUserByEmail).mockResolvedValue(existingUser as any);

            // Mock JWT verification
            vi.mocked(jwtVerify).mockResolvedValue({
                payload: { sub: 'auth0|789', email: 'existing@example.com' },
                protectedHeader: { alg: 'RS256' }
            });

            const user = await sdk.verifyAuth0Token('valid-token-linking');

            expect(user).toEqual(existingUser);
            expect(db.updateUser).toHaveBeenCalledWith(existingUser.id, expect.objectContaining({ 
                openId: 'auth0|789',
                loginMethod: 'auth0'
            }));
        });

        it('should return null if token verification fails', async () => {
            vi.mocked(jwtVerify).mockRejectedValue(new Error('Invalid token'));

            const user = await sdk.verifyAuth0Token('invalid-token');

            expect(user).toBeNull();
        });
    });
});
