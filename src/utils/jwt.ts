import jwt from 'jsonwebtoken';
import { config } from '@/config/config';
import { JWTPayload } from '@/types';

export interface TokenPair {
    accessToken: string;
    refreshToken: string;
}

export interface DecodedToken extends JWTPayload {
    type: 'access' | 'refresh';
}

/**
 * Generate access and refresh token pair
 */
export const generateTokenPair = (payload: Omit<JWTPayload, 'iat' | 'exp'>): TokenPair => {
    const accessTokenPayload: JWTPayload & { type: string } = {
        ...payload,
        type: 'access',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + parseExpiry(config.jwt.expiresIn)
    };

    const refreshTokenPayload: JWTPayload & { type: string } = {
        ...payload,
        type: 'refresh',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + parseExpiry(config.jwt.refreshExpiresIn)
    };

    const accessToken = jwt.sign(accessTokenPayload, config.jwt.secret, {
        algorithm: 'HS256'
    });

    const refreshToken = jwt.sign(refreshTokenPayload, config.jwt.secret, {
        algorithm: 'HS256'
    });

    return {
        accessToken,
        refreshToken
    };
};

/**
 * Verify and decode JWT token
 */
export const verifyToken = (token: string): DecodedToken => {
    try {
        const decoded = jwt.verify(token, config.jwt.secret) as DecodedToken;
        return decoded;
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            throw new Error('Token has expired');
        } else if (error instanceof jwt.JsonWebTokenError) {
            throw new Error('Invalid token');
        } else {
            throw new Error('Token verification failed');
        }
    }
};

/**
 * Decode JWT token without verification (for debugging)
 */
export const decodeToken = (token: string): DecodedToken | null => {
    try {
        const decoded = jwt.decode(token) as DecodedToken;
        return decoded;
    } catch (error) {
        return null;
    }
};

/**
 * Check if token is expired
 */
export const isTokenExpired = (token: string): boolean => {
    try {
        const decoded = decodeToken(token);
        if (!decoded || !decoded.exp) return true;

        const currentTime = Math.floor(Date.now() / 1000);
        return decoded.exp < currentTime;
    } catch (error) {
        return true;
    }
};

/**
 * Get token expiry time
 */
export const getTokenExpiry = (token: string): Date | null => {
    try {
        const decoded = decodeToken(token);
        if (!decoded || !decoded.exp) return null;

        return new Date(decoded.exp * 1000);
    } catch (error) {
        return null;
    }
};

/**
 * Extract token from Authorization header
 */
export const extractTokenFromHeader = (authHeader: string | undefined): string | null => {
    if (!authHeader) return null;

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return null;

    return parts[1];
};

/**
 * Parse expiry string to seconds
 */
function parseExpiry(expiry: string): number {
    const units: Record<string, number> = {
        s: 1,
        m: 60,
        h: 3600,
        d: 86400,
        w: 604800,
        y: 31557600
    };

    const match = expiry.match(/^(\d+)([smhdwy])$/);
    if (!match) {
        throw new Error(`Invalid expiry format: ${expiry}`);
    }

    const [, value, unit] = match;
    const multiplier = units[unit];

    if (!multiplier) {
        throw new Error(`Invalid expiry unit: ${unit}`);
    }

    return parseInt(value, 10) * multiplier;
}

/**
 * Generate a secure random token
 */
export const generateSecureToken = (length: number = 32): string => {
    const crypto = require('crypto');
    return crypto.randomBytes(length).toString('hex');
};

/**
 * Create token blacklist key for Redis
 */
export const createTokenBlacklistKey = (jti: string): string => {
    return `blacklist:token:${jti}`;
};

/**
 * Check if token is blacklisted (for logout functionality)
 */
export const isTokenBlacklisted = async (jti: string): Promise<boolean> => {
    try {
        const { redisUtils } = await import('@/config/redis');
        const key = createTokenBlacklistKey(jti);
        const exists = await redisUtils.exists(key);
        return exists > 0;
    } catch (error) {
        // If Redis is not available, assume token is not blacklisted
        return false;
    }
};

/**
 * Blacklist token (for logout functionality)
 */
export const blacklistToken = async (jti: string, expiry: number): Promise<void> => {
    try {
        const { redisUtils } = await import('@/config/redis');
        const key = createTokenBlacklistKey(jti);
        const ttl = Math.max(expiry - Math.floor(Date.now() / 1000), 0);

        if (ttl > 0) {
            await redisUtils.setex(key, ttl, 'blacklisted');
        }
    } catch (error) {
        // If Redis is not available, ignore blacklisting
        console.warn('Failed to blacklist token:', error);
    }
};

export default {
    generateTokenPair,
    verifyToken,
    decodeToken,
    isTokenExpired,
    getTokenExpiry,
    extractTokenFromHeader,
    generateSecureToken,
    isTokenBlacklisted,
    blacklistToken
};
