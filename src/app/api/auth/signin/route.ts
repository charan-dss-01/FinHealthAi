import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, isDemo = false } = body;

    let user;
    let business;

    if (isDemo || email === 'demo@ravi.com') {
      // Find or load seed demo business
      business = await prisma.business.findFirst({
        where: { name: 'Ravi General Store' },
        include: { owner: true },
      });

      if (!business) {
        business = await prisma.business.findFirst({
          orderBy: { createdAt: 'desc' },
          include: { owner: true },
        });
      }

      if (business) {
        user = business.owner;
      }
    } else {
      user = await prisma.user.findUnique({
        where: { email: (email || '').toLowerCase() },
      });

      if (user) {
        business = await prisma.business.findFirst({
          where: { ownerId: user.id },
        });
      }
    }

    if (!user || !business) {
      return NextResponse.json({ error: 'Invalid credentials or business account not found.' }, { status: 401 });
    }

    const response = NextResponse.json({
      success: true,
      user,
      business,
    });

    response.cookies.set('finhealth_session', JSON.stringify({ userId: user.id, businessId: business.id }), {
      httpOnly: true,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Signin Error:', error);
    return NextResponse.json({ error: 'Failed to sign in' }, { status: 500 });
  }
}
