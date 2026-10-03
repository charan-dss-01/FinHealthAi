import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('finhealth_session')?.value;

    if (!sessionCookie) {
      return NextResponse.json({ authenticated: false, user: null, business: null });
    }

    let sessionData: { userId?: string; businessId?: string } = {};
    try {
      sessionData = JSON.parse(sessionCookie);
    } catch {
      return NextResponse.json({ authenticated: false, user: null, business: null });
    }

    if (!sessionData.userId) {
      return NextResponse.json({ authenticated: false, user: null, business: null });
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionData.userId },
      select: { id: true, name: true, email: true, phone: true, preferredLanguage: true },
    });

    if (!user) {
      return NextResponse.json({ authenticated: false, user: null, business: null });
    }

    const business = await prisma.business.findFirst({
      where: { ownerId: user.id },
      select: { id: true, name: true, category: true, location: true },
    });

    return NextResponse.json({
      authenticated: true,
      user,
      business,
    });
  } catch (error) {
    console.error('Auth Check Error:', error);
    return NextResponse.json({ authenticated: false, user: null, business: null });
  }
}
