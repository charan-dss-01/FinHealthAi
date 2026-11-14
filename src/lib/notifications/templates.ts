export interface NotificationContext {
  customerName: string;
  businessName: string;
  amount?: number;
  outstandingBalance: number;
  dueDate?: string; // Formatted date string
  description?: string;
  businessPhone?: string;
}

export type NotificationLanguage = 'en' | 'hi' | 'te';

/**
 * WhatsApp message generators
 */
export function getWhatsAppNewCreditMessage(ctx: NotificationContext, lang: NotificationLanguage = 'en'): string {
  const amt = (ctx.amount || 0).toLocaleString('en-IN');
  const bal = ctx.outstandingBalance.toLocaleString('en-IN');
  const due = ctx.dueDate || 'Upon receipt';

  if (lang === 'hi') {
    return `नमस्ते ${ctx.customerName},

${ctx.businessName} में आपका खाता अपडेट कर दिया गया है।

नया उधार: ₹${amt}
कुल बकाया राशि: ₹${bal}
भुगतान की देय तिथि: ${due}

धन्यवाद!`;
  }

  if (lang === 'te') {
    return `నమస్కారం ${ctx.customerName},

${ctx.businessName} వద్ద మీ ఖాతా అప్‌డేట్ చేయబడింది.

కొత్త అప్పు: ₹${amt}
ప్రస్తుత బాకీ మొత్తం: ₹${bal}
చెల్లింపు గడువు తేదీ: ${due}

ధన్యవాదాలు!`;
  }

  return `Hi ${ctx.customerName},

Your Khaata account at ${ctx.businessName} has been updated.

New credit: ₹${amt}
Current outstanding balance: ₹${bal}
Payment due date: ${due}

Thank you!`;
}

export function getWhatsAppPaymentReceivedMessage(ctx: NotificationContext, lang: NotificationLanguage = 'en'): string {
  const amt = (ctx.amount || 0).toLocaleString('en-IN');
  const bal = ctx.outstandingBalance.toLocaleString('en-IN');

  if (lang === 'hi') {
    return `नमस्ते ${ctx.customerName},

हमें आपका ₹${amt} का भुगतान प्राप्त हो गया है।

शेष बकाया राशि: ₹${bal}।

भुगतान के लिए धन्यवाद!`;
  }

  if (lang === 'te') {
    return `నమస్కారం ${ctx.customerName},

మీ నుండి ₹${amt} చెల్లింపు స్వీకరించబడింది.

మిగిలిన బాకీ మొత్తం: ₹${bal}।

చెల్లింపు చేసినందుకు ధన్యవాదాలు!`;
  }

  return `Hi ${ctx.customerName},

We have received and recorded your payment of ₹${amt}.

Remaining outstanding balance: ₹${bal}.

Thank you for your payment!`;
}

export function getWhatsAppDueSoonMessage(ctx: NotificationContext, lang: NotificationLanguage = 'en'): string {
  const bal = ctx.outstandingBalance.toLocaleString('en-IN');
  const due = ctx.dueDate || 'Tomorrow';

  if (lang === 'hi') {
    return `नमस्ते ${ctx.customerName},

${ctx.businessName} की ओर से विनम्र अनुस्मारक।

आपकी बकाया राशि ₹${bal} है।
भुगतान की देय तिथि: ${due}।

कृपया अपनी सुविधानुसार भुगतान करें।
धन्यवाद!`;
  }

  if (lang === 'te') {
    return `నమస్కారం ${ctx.customerName},

${ctx.businessName} నుండి సున్నితమైన రిమైండర్.

మీ బాకీ మొత్తం ₹${bal}.
చెల్లింపు గడువు తేదీ: ${due}.

దయచేసి వీలైనంత త్వరగా చెల్లించగలరు.
ధన్యవాదాలు!`;
  }

  return `Hi ${ctx.customerName},

Friendly reminder from ${ctx.businessName}.

Your outstanding Khaata balance is ₹${bal}.

Payment due date: ${due}.

Please make your payment when convenient.

Thank you!`;
}

export function getWhatsAppDueTodayMessage(ctx: NotificationContext, lang: NotificationLanguage = 'en'): string {
  const bal = ctx.outstandingBalance.toLocaleString('en-IN');

  if (lang === 'hi') {
    return `नमस्ते ${ctx.customerName},

आपकी ₹${bal} की बकाया राशि का भुगतान आज देय है।

कृपया अपनी सुविधानुसार भुगतान पूरा करें।
यदि आप पहले ही भुगतान कर चुके हैं, तो कृपया इस संदेश को अनदेखा करें।

धन्यवाद!`;
  }

  if (lang === 'te') {
    return `నమస్కారం ${ctx.customerName},

మీ బాకీ మొత్తం ₹${bal} ఈరోజు చెల్లించాల్సి ఉంది.

దయచేసి వీలైనంత త్వరగా చెల్లింపు పూర్తి చేయండి.
ఇప్పటికే చెల్లించి ఉంటే, దయచేసి ఈ మెసేజ్‌ను విస్మరించండి.

ధన్యవాదాలు!`;
  }

  return `Hi ${ctx.customerName},

Your outstanding Khaata balance of ₹${bal} is due today.

Please complete your payment when convenient.

If already paid, kindly ignore this message.

Thank you!`;
}

export function getWhatsAppOverdueMessage(ctx: NotificationContext, lang: NotificationLanguage = 'en'): string {
  const bal = ctx.outstandingBalance.toLocaleString('en-IN');
  const due = ctx.dueDate || 'Past Due';

  if (lang === 'hi') {
    return `नमस्ते ${ctx.customerName},

यह एक विनम्र अनुस्मारक है कि ${ctx.businessName} के साथ आपकी ₹${bal} की राशि बकाया है।

देय तिथि: ${due}।

यदि आप पहले ही भुगतान कर चुके हैं तो कृपया हमसे संपर्क करें।
धन्यवाद!`;
  }

  if (lang === 'te') {
    return `నమస్కారం ${ctx.customerName},

${ctx.businessName} వద్ద మీ ₹${bal} బాకీ ఇంకా చెల్లించాల్సి ఉందని సున్నితమైన రిమైండర్.

గడువు తేదీ: ${due}.

మీరు ఇప్పటికే చెల్లించి ఉంటే దయచేసి మమ్మల్ని సంప్రదించండి.
ధన్యవాదాలు!`;
  }

  return `Hi ${ctx.customerName},

This is a friendly reminder that ₹${bal} remains outstanding with ${ctx.businessName}.

Due date: ${due}.

Please contact us if you have already made the payment.

Thank you!`;
}

/**
 * Responsive HTML Email template generators
 */
export function getEmailBaseTemplate(title: string, contentHtml: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
    .card { max-width: 540px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background: #4f46e5; color: #ffffff; padding: 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.025em; }
    .content { padding: 28px 24px; font-size: 14px; line-height: 1.6; }
    .stat-box { background: #f1f5f9; border-radius: 12px; padding: 16px; margin: 20px 0; border-left: 4px solid #4f46e5; }
    .stat-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
    .stat-row:last-child { margin-bottom: 0; }
    .stat-label { color: #64748b; }
    .stat-val { font-weight: 700; color: #0f172a; }
    .footer { padding: 16px 24px; background: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center; font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>${title}</h1>
    </div>
    <div class="content">
      ${contentHtml}
    </div>
    <div class="footer">
      Sent via FinHealth AI Customer Khaata ledger on behalf of your merchant.
    </div>
  </div>
</body>
</html>`;
}

export function getEmailNewCredit(ctx: NotificationContext): { subject: string; html: string; text: string } {
  const amt = (ctx.amount || 0).toLocaleString('en-IN');
  const bal = ctx.outstandingBalance.toLocaleString('en-IN');
  const due = ctx.dueDate || 'Upon receipt';

  const subject = `Khaata Account Updated — ${ctx.businessName}`;

  const bodyHtml = `
    <p>Dear <strong>${ctx.customerName}</strong>,</p>
    <p>Your customer credit account at <strong>${ctx.businessName}</strong> has been updated with a new entry.</p>
    
    <div class="stat-box">
      <div class="stat-row">
        <span class="stat-label">New Credit Added:</span>
        <span class="stat-val">₹${amt}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Total Outstanding Balance:</span>
        <span class="stat-val" style="color: #b45309;">₹${bal}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Payment Due Date:</span>
        <span class="stat-val">${due}</span>
      </div>
      ${ctx.description ? `
      <div class="stat-row">
        <span class="stat-label">Particulars:</span>
        <span class="stat-val">${ctx.description}</span>
      </div>` : ''}
    </div>

    <p>Thank you for your business!</p>
  `;

  const text = `Dear ${ctx.customerName},

Your Khaata account at ${ctx.businessName} has been updated.

New credit: ₹${amt}
Total outstanding balance: ₹${bal}
Due date: ${due}
${ctx.description ? `Particulars: ${ctx.description}\n` : ''}
Thank you!`;

  return { subject, html: getEmailBaseTemplate(subject, bodyHtml), text };
}

export function getEmailPaymentConfirmation(ctx: NotificationContext): { subject: string; html: string; text: string } {
  const amt = (ctx.amount || 0).toLocaleString('en-IN');
  const bal = ctx.outstandingBalance.toLocaleString('en-IN');
  const dateStr = new Date().toLocaleDateString('en-IN');

  const subject = `Payment Received — ${ctx.businessName}`;

  const bodyHtml = `
    <p>Dear <strong>${ctx.customerName}</strong>,</p>
    <p>We have successfully received and recorded your payment. Thank you!</p>
    
    <div class="stat-box" style="border-left-color: #10b981;">
      <div class="stat-row">
        <span class="stat-label">Payment Amount:</span>
        <span class="stat-val" style="color: #047857;">₹${amt}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Payment Date:</span>
        <span class="stat-val">${dateStr}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Remaining Outstanding Balance:</span>
        <span class="stat-val">₹${bal}</span>
      </div>
    </div>

    <p>We appreciate your timely settlement.</p>
  `;

  const text = `Dear ${ctx.customerName},

We have received and recorded your payment of ₹${amt} on ${dateStr}.
Remaining outstanding balance: ₹${bal}.

Thank you for your payment!
${ctx.businessName}`;

  return { subject, html: getEmailBaseTemplate(subject, bodyHtml), text };
}

export function getEmailPaymentReminder(ctx: NotificationContext, isOverdue: boolean = false): { subject: string; html: string; text: string } {
  const bal = ctx.outstandingBalance.toLocaleString('en-IN');
  const due = ctx.dueDate || 'Immediately';

  const subject = isOverdue
    ? `Important: Payment Overdue — ${ctx.businessName}`
    : `Payment Reminder — ${ctx.businessName}`;

  const bodyHtml = `
    <p>Dear <strong>${ctx.customerName}</strong>,</p>
    <p>${isOverdue ? 'This is an urgent reminder regarding your past-due account.' : `This is a friendly reminder from <strong>${ctx.businessName}</strong>.`}</p>
    
    <div class="stat-box" style="border-left-color: ${isOverdue ? '#ef4444' : '#f59e0b'};">
      <div class="stat-row">
        <span class="stat-label">Outstanding Amount:</span>
        <span class="stat-val" style="color: ${isOverdue ? '#b91c1c' : '#b45309'}; font-size: 16px;">₹${bal}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Due Date:</span>
        <span class="stat-val">${due}</span>
      </div>
      ${ctx.businessPhone ? `
      <div class="stat-row">
        <span class="stat-label">Store Contact:</span>
        <span class="stat-val">${ctx.businessPhone}</span>
      </div>` : ''}
    </div>

    <p>Please make your payment when convenient. If you have already made the payment, kindly disregard this notice.</p>
    <p>Thank you,<br/>${ctx.businessName}</p>
  `;

  const text = `Dear ${ctx.customerName},

Friendly reminder from ${ctx.businessName}.
Your outstanding Khaata balance is ₹${bal}.
Payment due date: ${due}.
${ctx.businessPhone ? `Store contact: ${ctx.businessPhone}\n` : ''}
Please make your payment when convenient. If already paid, kindly ignore this message.

Thank you!`;

  return { subject, html: getEmailBaseTemplate(subject, bodyHtml), text };
}
