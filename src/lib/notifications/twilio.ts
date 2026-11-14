import twilio from 'twilio';

export interface WhatsAppMessagePayload {
  to: string; // E.164 phone e.g. +919876543210
  body: string;
  contentSid?: string;
  contentVariables?: Record<string, string>;
  statusCallbackUrl?: string;
}

export interface WhatsAppSendResult {
  success: boolean;
  providerId?: string;
  status: 'ACCEPTED' | 'FAILED';
  error?: string;
}

/**
 * Validates and converts phone number to E.164 format.
 * Defaults to India (+91) if 10-digit number is provided.
 */
export function formatToE164(phone: string): string | null {
  if (!phone) return null;
  const digits = phone.replace(/[^0-9+]/g, '');

  if (digits.startsWith('+')) {
    if (digits.length >= 10 && digits.length <= 16) {
      return digits;
    }
    return null;
  }

  // 10 digits assumed Indian mobile number
  if (digits.length === 10) {
    return `+91${digits}`;
  }

  // 12 digits starting with 91
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+${digits}`;
  }

  if (digits.length >= 11 && digits.length <= 15) {
    return `+${digits}`;
  }

  return null;
}

export class TwilioWhatsAppProvider {
  private client: twilio.Twilio | null = null;
  private fromNumber: string | null = null;
  private isConfigured: boolean = false;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_WHATSAPP_FROM;

    if (accountSid && authToken && from) {
      try {
        this.client = twilio(accountSid, authToken);
        // Twilio expects 'whatsapp:+14155238886' or standard number
        this.fromNumber = from.startsWith('whatsapp:') ? from : `whatsapp:${from}`;
        this.isConfigured = true;
      } catch (err) {
        console.warn('[TwilioWhatsApp] Failed to initialize client:', err);
      }
    }
  }

  public getStatus(): { configured: boolean; sender: string | null } {
    return {
      configured: this.isConfigured,
      sender: this.fromNumber,
    };
  }

  /**
   * Sends a WhatsApp message via Twilio API.
   * If credentials are not configured, returns a safe simulated response
   * clearly marked as not delivered to prevent fake delivery claims.
   */
  async sendMessage(payload: WhatsAppMessagePayload): Promise<WhatsAppSendResult> {
    const e164To = formatToE164(payload.to);
    if (!e164To) {
      return {
        success: false,
        status: 'FAILED',
        error: `Invalid phone number format: "${payload.to}". Must be valid E.164.`,
      };
    }

    if (!this.isConfigured || !this.client || !this.fromNumber) {
      console.warn('[TwilioWhatsApp] Twilio credentials missing in environment.');
      return {
        success: false,
        status: 'FAILED',
        error: 'Twilio WhatsApp provider is not configured. Check TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_FROM.',
      };
    }

    try {
      const formattedTo = e164To.startsWith('whatsapp:') ? e164To : `whatsapp:${e164To}`;
      
      const messageOptions: any = {
        from: this.fromNumber,
        to: formattedTo,
      };

      // Support Twilio Content Template (Required for Sandbox & WhatsApp Business templates outside 24h window)
      const templateSid = payload.contentSid || process.env.TWILIO_CONTENT_SID || 'HXb5b62575e6e4ff6129ad7c8efe1f983e';

      if (templateSid) {
        messageOptions.contentSid = templateSid;
        if (payload.contentVariables) {
          messageOptions.contentVariables = JSON.stringify(payload.contentVariables);
        } else {
          // Default mapping for sandbox template
          messageOptions.contentVariables = JSON.stringify({
            '1': new Date().toLocaleDateString('en-IN'),
            '2': new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          });
        }
      } else {
        messageOptions.body = payload.body;
      }

      if (payload.statusCallbackUrl) {
        messageOptions.statusCallback = payload.statusCallbackUrl;
      }

      const response = await this.client.messages.create(messageOptions);

      return {
        success: true,
        providerId: response.sid,
        // Twilio initial response is 'queued' or 'accepted' - not yet delivered
        status: 'ACCEPTED',
      };
    } catch (err: any) {
      console.error('[TwilioWhatsApp] API error:', err);
      return {
        success: false,
        status: 'FAILED',
        error: err.message || 'Twilio API request failed',
      };
    }
  }
}

export const twilioProvider = new TwilioWhatsAppProvider();
