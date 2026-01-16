import { cookies } from 'next/headers';
import prisma from './prisma';

const SESSION_COOKIE_NAME = 'anon_session_id';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export async function getSessionId(): Promise<string | null> {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
    return sessionCookie?.value || null;
}

export async function getOrCreateSession(): Promise<string> {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

    if (sessionCookie?.value) {
        // Validate existence in DB, just in case
        const exists = await prisma.session.findUnique({
            where: { id: sessionCookie.value },
        });
        if (exists) {
            return exists.id;
        }
    }

    // Create new session
    const newSession = await prisma.session.create({
        data: {},
    });

    cookieStore.set(SESSION_COOKIE_NAME, newSession.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: COOKIE_MAX_AGE,
        path: '/',
        sameSite: 'lax',
    });

    return newSession.id;
}

export async function ensureSession(): Promise<string> {
    // This function is for API routes to force checking/creating
    return await getOrCreateSession();
}
