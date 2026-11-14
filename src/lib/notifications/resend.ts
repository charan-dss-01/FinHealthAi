import { Resend } from 'resend';

export interface EmailMessagePayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailSendResult {
  success: boolean;
  providerId?: string;
  status: 'ACCEPTED' | 'FAILED';
  error?: string;
}

export function isValidEmail(email: string): boolean {
  if (!email) return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
}

export class ResendEmailProvider {
  private resend: Resend | null = null;
  private fromEmail: string = 'onboarding@resend.dev';
  private isConfigured: boolean = false;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM;

    if (apiKey) {
      try {
        this.resend = new Resend(apiKey);
        // If EMAIL_FROM contains placeholder "yourverifieddomain.com", fall back to onboarding@resend.dev for test mode
        if (from && !from.includes('yourverifieddomain.com')) {
          this.fromEmail = from;
        } else {
          this.fromEmail = 'FinHealth AI <onboarding@resend.dev>';
        }
        this.isConfigured = true;
      } catch (err) {
        console.warn('[ResendEmail] Failed to initialize Resend client:', err);
      }
    }
  }

  public getStatus(): { configured: boolean; sender: string } {
    return {
      configured: this.isConfigured,
      sender: this.fromEmail,
    };
  }

  async sendEmail(payload: EmailMessagePayload): Promise<EmailSendResult> {
    if (!isValidEmail(payload.to)) {
      return {
        success: false,
        status: 'FAILED',
        error: `Invalid email address format: "${payload.to}".`,
      };
    }

    if (!this.isConfigured || !this.resend) {
      console.warn('[ResendEmail] Resend API key missing in environment.');
      return {
        success: false,
        status: 'FAILED',
        error: 'Resend Email provider is not configured. Check RESEND_API_KEY and EMAIL_FROM.',
      };
    }

    try {
      const response = await this.resend.emails.send({
        from: this.fromEmail,
        to: payload.to.trim(),
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      });

      if (response.error) {
        return {
          success: false,
          status: 'FAILED',
          error: response.error.message || 'Resend API returned an error',
        };
      }

      return {
        success: true,
        providerId: response.data?.id,
        status: 'ACCEPTED',
      };
    } catch (err: any) {
      console.error('[ResendEmail] API error:', err);
      return {
        success: false,
        status: 'FAILED',
        error: err.message || 'Resend API request failed',
      };
    }
  }
}

export const resendProvider = new ResendEmailProvider();
