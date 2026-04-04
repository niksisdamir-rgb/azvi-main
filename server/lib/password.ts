import { scryptSync, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Hashes a password using scrypt.
 * Returns a string in the format salt:hash.
 */
export const hashPassword = (password: string): string => {
    const salt = randomBytes(16).toString("hex");
    const hash = scryptSync(password, salt, 64).toString("hex");
    return `${salt}:${hash}`;
};

/**
 * Verifies a password against a stored hash.
 */
export const verifyPassword = (password: string, storedHash: string): boolean => {
    try {
        const [salt, hash] = storedHash.split(":");
        if (!salt || !hash) return false;
        const hashToVerify = scryptSync(password, salt, 64).toString("hex");
        return timingSafeEqual(
            Buffer.from(hash, "hex"),
            Buffer.from(hashToVerify, "hex")
        );
    } catch (error) {
        console.error("[Password] Verification error:", error);
        return false;
    }
};
