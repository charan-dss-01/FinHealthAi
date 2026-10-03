import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial Indian SMB profile into SQLite Database...');

  // Clean existing tables
  await prisma.aIMessage.deleteMany();
  await prisma.aIConversation.deleteMany();
  await prisma.financialSignal.deleteMany();
  await prisma.businessMetric.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.bankAccount.deleteMany();
  await prisma.business.deleteMany();
  await prisma.user.deleteMany();

  // Create primary owner User
  const user = await prisma.user.create({
    data: {
      id: '1e194833-2895-46b0-bfb0-68198f390001',
      name: 'Ravi Kumar',
      email: 'ravi.generalstore@gmail.com',
      phone: '9845098450',
      role: 'OWNER',
      preferredLanguage: 'en',
    },
  });

  // Create Business Profile: Ravi General Store
  const business = await prisma.business.create({
    data: {
      id: '3ee06e5b-b6a8-4ec1-954d-700bacf5e001',
      ownerId: user.id,
      name: 'Ravi General Store',
      category: 'Kirana / General Store',
      location: 'Jayanagar 4th Block, Bangalore',
      employeeCount: 2,
      currency: 'INR',
    },
  });

  // Create Primary SBI Bank Account
  const bankAccount = await prisma.bankAccount.create({
    data: {
      id: '66576f71-51e4-4689-a749-0189f2740488',
      businessId: business.id,
      bankName: 'State Bank of India',
      accountNumber: 'XX4829',
      accountType: 'CURRENT',
      balance: 142500,
    },
  });

  // Insert 56 Realistic SMB Transactions
  const now = new Date();
  const transactionsData = [
    {
      businessId: business.id,
      accountId: bankAccount.id,
      amount: 45000,
      type: 'DEBIT',
      merchant: 'HUL Distributor Bangalore',
      description: 'NEFT-HUL DISTRIBUTOR BANGALORE-FMCG STOCK INVOICE 8492',
      category: 'Inventory & Supplies',
      isBusiness: true,
      confidence: 0.98,
      channel: 'NEFT',
      transactionDate: new Date(now.getTime() - 1 * 86400000),
    },
    {
      businessId: business.id,
      accountId: bankAccount.id,
      amount: 18000,
      type: 'DEBIT',
      merchant: 'Store Staff Payroll',
      description: 'IMPS-STORE ASSISTANT SALARY AUGUST 2026',
      category: 'Salaries & Payroll',
      isBusiness: true,
      confidence: 0.99,
      channel: 'IMPS',
      transactionDate: new Date(now.getTime() - 2 * 86400000),
    },
    {
      businessId: business.id,
      accountId: bankAccount.id,
      amount: 25000,
      type: 'DEBIT',
      merchant: 'Jayanagar Commercial Rent',
      description: 'NEFT-JAYANAGAR STORE RENT AUGUST 2026',
      category: 'Rent & Facilities',
      isBusiness: true,
      confidence: 0.99,
      channel: 'NEFT',
      transactionDate: new Date(now.getTime() - 3 * 86400000),
    },
    {
      businessId: business.id,
      accountId: bankAccount.id,
      amount: 4800,
      type: 'DEBIT',
      merchant: 'BESCOM Electricity Bangalore',
      description: 'UPI/3819241829/BESCOM ELECTRICITY BILL/PAY',
      category: 'Utilities',
      isBusiness: true,
      confidence: 0.95,
      channel: 'UPI',
      transactionDate: new Date(now.getTime() - 4 * 86400000),
    },
    {
      businessId: business.id,
      accountId: bankAccount.id,
      amount: 480,
      type: 'DEBIT',
      merchant: 'Swiggy Food Order',
      description: 'UPI/3218491823/SWIGGY FOOD ORDER/BANGALORE',
      category: 'Personal Expense (Co-mingled)',
      isBusiness: false,
      confidence: 0.85,
      channel: 'UPI',
      transactionDate: new Date(now.getTime() - 5 * 86400000),
    },
    {
      businessId: business.id,
      accountId: bankAccount.id,
      amount: 649,
      type: 'DEBIT',
      merchant: 'Netflix Subscription',
      description: 'POS/NETFLIX MONTHLY SUBSCRIPTION/MUMBAI',
      category: 'Personal Expense (Co-mingled)',
      isBusiness: false,
      confidence: 0.90,
      channel: 'POS',
      transactionDate: new Date(now.getTime() - 6 * 86400000),
    },
    {
      businessId: business.id,
      accountId: bankAccount.id,
      amount: 14850,
      type: 'CREDIT',
      merchant: 'BharatPe Merchant Settlement',
      description: 'BHARATPE MERCHANT UPI SETTLEMENT CREDIT',
      category: 'Customer Revenue',
      isBusiness: true,
      confidence: 0.99,
      channel: 'UPI',
      transactionDate: new Date(now.getTime() - 1 * 86400000),
    },
    {
      businessId: business.id,
      accountId: bankAccount.id,
      amount: 18450,
      type: 'CREDIT',
      merchant: 'Paytm QR Customer Settlement',
      description: 'PAYTM QR MERCHANT SETTLEMENT CREDIT',
      category: 'Customer Revenue',
      isBusiness: true,
      confidence: 0.99,
      channel: 'UPI',
      transactionDate: new Date(now.getTime() - 2 * 86400000),
    },
  ];

  let currentBalance = 142500;
  for (let i = 7; i <= 50; i++) {
    const isCredit = Math.random() > 0.35;
    const amount = isCredit ? Math.floor(8000 + Math.random() * 7000) : Math.floor(3000 + Math.random() * 12000);
    const dailyRev = isCredit ? amount : -amount;
    currentBalance += dailyRev;

    transactionsData.push({
      businessId: business.id,
      accountId: bankAccount.id,
      amount,
      type: isCredit ? 'CREDIT' : 'DEBIT',
      merchant: isCredit ? 'Store Customer UPI QR' : 'Metro Cash & Carry Supplies',
      description: isCredit ? `Daily Store Settlement Day ${i}` : `Inventory Wholesale Order ${i}`,
      category: isCredit ? 'Customer Revenue' : 'Inventory & Supplies',
      isBusiness: true,
      confidence: 0.99,
      channel: 'UPI',
      transactionDate: new Date(now.getTime() - i * 86400000),
    });
  }

  await prisma.transaction.createMany({
    data: transactionsData,
  });

  await prisma.financialSignal.createMany({
    data: [
      {
        businessId: business.id,
        type: 'CASH_FLOW_RISK',
        severity: 'HIGH',
        title: 'Cash pressure expected in 24 days',
        description: 'At your current spending rate and supplier purchases, your cash runway buffer may fall below your safe minimum limit of INR 50,000.',
        score: 92.5,
      },
      {
        businessId: business.id,
        type: 'EXPENSE_SPIKE',
        severity: 'MEDIUM',
        title: 'Supplier inventory spending increased 27%',
        description: 'Inventory payments reached INR 1,26,500 this month while monthly revenue increased by only 8.4%.',
        score: 74.0,
      },
      {
        businessId: business.id,
        type: 'REVENUE_INCREASE',
        severity: 'POSITIVE',
        title: 'Revenue momentum trending upward',
        description: 'Weekly revenue has increased for 4 consecutive weeks, averaging INR 1,18,000 per week.',
        score: 65.0,
      },
      {
        businessId: business.id,
        type: 'HIGH_PERSONAL_SPENDING',
        severity: 'MEDIUM',
        title: 'Personal expenses detected in business account',
        description: 'INR 20,540 in probable personal transactions were detected this month.',
        score: 58.0,
      },
    ],
  });

  await prisma.businessMetric.create({
    data: {
      businessId: business.id,
      periodType: 'MONTHLY',
      periodDate: new Date(),
      totalRevenue: 482000,
      totalExpenses: 321500,
      netCashFlow: 160500,
      endingBalance: 142500,
      cashRunwayDays: 28,
      healthScore: 78,
    },
  });

  console.log('Seeding complete! Ravi General Store data loaded successfully.');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
