import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateSession } from '@/lib/db/session';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const sessionId = await getOrCreateSession();
        return NextResponse.json({ sessionId });
    } catch (error) {
        console.error('Session init error:', error);
        return NextResponse.json({ error: 'Failed to initialize session' }, { status: 500 });
    }
}
