import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name,
      email,
      phone,
      password,
      businessName,
      category = 'Kirana / General Store',
      location = 'India',
      preferredLanguage = 'en',
    } = body;

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email/phone are required.' }, { status: 400 });
    }

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          name,
          email: email.toLowerCase(),
          phone: phone || '',
          passwordHash: password || 'default_hash',
          preferredLanguage,
          role: 'OWNER',
        },
      });
    }

    // Create Business for user
    const business = await prisma.business.create({
      data: {
        ownerId: user.id,
        name: businessName || `${name}'s Store`,
        category,
        location,
        employeeCount: 1,
        currency: 'INR',
      },
    });

    // Create Primary Bank Account
    const bankAccount = await prisma.bankAccount.create({
      data: {
        businessId: business.id,
        bankName: 'Primary Bank Current A/c',
        accountNumber: 'XX' + Math.floor(1000 + Math.random() * 9000),
        accountType: 'CURRENT',
        balance: 100000,
      },
    });

    // Create Initial Business Metric
    await prisma.businessMetric.create({
      data: {
        businessId: business.id,
        periodType: 'MONTHLY',
        periodDate: new Date(),
        totalRevenue: 250000,
        totalExpenses: 180000,
        netCashFlow: 70000,
        endingBalance: 100000,
        cashRunwayDays: 35,
        healthScore: 82,
      },
    });

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
    console.error('Signup Error:', error);
    return NextResponse.json({ error: 'Failed to create user account' }, { status: 500 });
  }
}
