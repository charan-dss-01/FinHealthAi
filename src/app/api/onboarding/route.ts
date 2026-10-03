import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, category, size, location, monthlyRevenueRange, employeeCount, ownerName, ownerEmail } = body;

    if (!name || !category) {
      return NextResponse.json({ error: 'Business name and category are required.' }, { status: 400 });
    }

    // Find or create default user
    let user = await prisma.user.findFirst({
      where: { email: ownerEmail || 'owner@smb.in' },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: ownerEmail || 'owner@smb.in',
          name: ownerName || 'SMB Owner',
          role: 'OWNER',
        },
      });
    }

    const business = await prisma.business.create({
      data: {
        ownerId: user.id,
        name,
        category,
        size: size || 'Micro',
        location: location || 'India',
        monthlyRevenueRange: monthlyRevenueRange || '₹1 - 5 Lakhs',
        employeeCount: employeeCount ? parseInt(employeeCount) : 1,
        currency: 'INR',
      },
    });

    // Create default bank account link
    await prisma.bankAccount.create({
      data: {
        businessId: business.id,
        bankName: 'Primary Bank',
        accountNumber: 'XX' + Math.floor(1000 + Math.random() * 9000),
        accountType: 'CURRENT',
      },
    });

    // Initialize business metric snapshot
    await prisma.businessMetric.create({
      data: {
        businessId: business.id,
        periodType: 'MONTHLY',
        periodDate: new Date(),
        totalRevenue: 0,
        totalExpenses: 0,
        netCashFlow: 0,
        endingBalance: 0,
        cashRunwayDays: 30,
        healthScore: 100,
      },
    });

    return NextResponse.json({ success: true, business });
  } catch (error) {
    console.error('Error creating business:', error);
    return NextResponse.json({ error: 'Failed to onboard business' }, { status: 500 });
  }
}
