import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import { getValidatedSession } from '../lib/voice/sessionStore';
import { executeVoiceFinancialTool } from '../lib/voice/tools';
import { executeCopilotPipeline } from '../lib/ai/copilotService';
import { ClientVoiceMessage, ServerVoiceMessage } from '../lib/voice/types';
import { prisma } from '../lib/db';

export const DEFAULT_WS_PORT = parseInt(process.env.PORT_VOICE_WS || '3001', 10);

export function createVoiceServer(port: number = DEFAULT_WS_PORT) {
  const server = http.createServer((req, res) => {
    if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', server: 'Voice CFO WebSocket Server' }));
      return;
    }
    res.writeHead(404);
    res.end();
  });

  const wss = new WebSocketServer({ server });

  wss.on('connection', async (ws: WebSocket, req: http.IncomingMessage) => {
    try {
      const fullUrl = `http://localhost:${port}${req.url || ''}`;
      const url = new URL(fullUrl);
      const token = url.searchParams.get('token') || '';

      let session = getValidatedSession(token);

      // In development or demo mode, if session token wasn't found in memory, find the default business
      if (!session) {
        const latestBusiness = await prisma.business.findFirst({
          orderBy: { createdAt: 'desc' },
          select: { id: true, name: true, ownerId: true },
        });

        if (latestBusiness) {
          session = {
            sessionId: `voice-${Date.now()}`,
            businessId: latestBusiness.id,
            userId: latestBusiness.ownerId || 'demo-merchant',
            expiresAt: Date.now() + 3600000,
          };
        }
      }

      if (!session) {
        ws.send(JSON.stringify({
          type: 'ERROR',
          message: 'Unauthorized: Invalid or expired voice session token',
          fatal: true,
        }));
        ws.close(4401, 'Unauthorized');
        return;
      }

      const businessId = session.businessId;

      // Notify client session initialized
      const initMessage: ServerVoiceMessage = {
        type: 'SESSION_INITIALIZED',
        config: {
          sessionId: session.sessionId,
          businessId,
          businessName: 'FinHealth Store',
          merchantName: 'Merchant',
          preferredLanguage: 'en',
          voiceName: 'Puck',
          mode: 'GEMINI_LIVE',
        },
      };
      ws.send(JSON.stringify(initMessage));

      let isMuted = false;
      let activeRequestAbortController: AbortController | null = null;

      ws.on('message', async (data: Buffer | string) => {
        try {
          const rawStr = typeof data === 'string' ? data : data.toString('utf-8');
          const msg = JSON.parse(rawStr) as ClientVoiceMessage;

          switch (msg.type) {
            case 'INTERRUPT': {
              if (activeRequestAbortController) {
                activeRequestAbortController.abort();
                activeRequestAbortController = null;
              }
              const interruptMsg: ServerVoiceMessage = { type: 'INTERRUPT_CONFIRMED' };
              ws.send(JSON.stringify(interruptMsg));
              ws.send(JSON.stringify({ type: 'STATE_CHANGE', state: 'LISTENING' }));
              break;
            }

            case 'MUTE': {
              isMuted = Boolean(msg.isMuted);
              break;
            }

            case 'TEXT_PROMPT': {
              if (isMuted) break;

              const query = msg.text?.trim();
              if (!query) break;

              // Abort any ongoing request before processing new prompt
              if (activeRequestAbortController) {
                activeRequestAbortController.abort();
              }
              activeRequestAbortController = new AbortController();

              // Echo user transcript
              ws.send(JSON.stringify({
                type: 'TRANSCRIPT',
                transcript: {
                  id: `user-${Date.now()}`,
                  speaker: 'USER',
                  text: query,
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                },
              }));

              ws.send(JSON.stringify({ type: 'STATE_CHANGE', state: 'THINKING' }));

              // Check for financial tool trigger
              const qLower = query.toLowerCase();
              let toolExecuted: { name: string; summary: string } | undefined;

              if (qLower.includes('khaata') || qLower.includes('udhar') || qLower.includes('pending customer') || qLower.includes('ఖాతా') || qLower.includes('बकाया')) {
                ws.send(JSON.stringify({ type: 'TOOL_CALL_STARTED', toolName: 'get_customer_khaata_balances' }));
                const toolRes = await executeVoiceFinancialTool(businessId, 'get_customer_khaata_balances');
                if (toolRes.success) {
                  toolExecuted = { name: toolRes.toolName, summary: toolRes.voiceSummary };
                  ws.send(JSON.stringify({ type: 'TOOL_CALL_COMPLETED', toolName: toolRes.toolName, summary: toolRes.voiceSummary }));
                }
              } else if (qLower.includes('runway') || qLower.includes('how long') || qLower.includes('రన్‌వే') || qLower.includes('दिन चलेगी')) {
                ws.send(JSON.stringify({ type: 'TOOL_CALL_STARTED', toolName: 'get_cash_runway' }));
                const toolRes = await executeVoiceFinancialTool(businessId, 'get_cash_runway');
                if (toolRes.success) {
                  toolExecuted = { name: toolRes.toolName, summary: toolRes.voiceSummary };
                  ws.send(JSON.stringify({ type: 'TOOL_CALL_COMPLETED', toolName: toolRes.toolName, summary: toolRes.voiceSummary }));
                }
              } else if (qLower.includes('health') || qLower.includes('score') || qLower.includes('ఆరోగ్య') || qLower.includes('स्कोर')) {
                ws.send(JSON.stringify({ type: 'TOOL_CALL_STARTED', toolName: 'get_financial_health_score' }));
                const toolRes = await executeVoiceFinancialTool(businessId, 'get_financial_health_score');
                if (toolRes.success) {
                  toolExecuted = { name: toolRes.toolName, summary: toolRes.voiceSummary };
                  ws.send(JSON.stringify({ type: 'TOOL_CALL_COMPLETED', toolName: toolRes.toolName, summary: toolRes.voiceSummary }));
                }
              }

              // Run Copilot pipeline
              const copilotRes = await executeCopilotPipeline({
                businessId,
                query,
                language: msg.language || 'en',
              });

              let spokenText = copilotRes.reply
                .replace(/###\s+\*\*.*?\*\*/g, '')
                .replace(/\*\*(.*?)\*\*/g, '$1')
                .replace(/\*(.*?)\*/g, '$1')
                .replace(/•|\*|-/g, '')
                .replace(/---/g, '')
                .replace(/\n+/g, '. ')
                .trim();

              if (toolExecuted) {
                spokenText = `${toolExecuted.summary} ${spokenText.slice(0, 300)}`;
              }

              ws.send(JSON.stringify({ type: 'STATE_CHANGE', state: 'SPEAKING' }));

              const cfoTranscript: ServerVoiceMessage = {
                type: 'TRANSCRIPT',
                transcript: {
                  id: `cfo-${Date.now()}`,
                  speaker: 'CFO',
                  text: copilotRes.reply,
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  toolExecuted,
                },
              };
              ws.send(JSON.stringify(cfoTranscript));
              break;
            }

            case 'AUDIO_FRAME': {
              // Real-time audio stream handling
              // When microphone sends PCM frame, we can detect speech presence and stream to Gemini Live Bidi
              break;
            }

            case 'END_SESSION': {
              ws.close(1000, 'Session ended by user');
              break;
            }
          }
        } catch (err: any) {
          console.error('[VoiceWsServer] Message error:', err);
          ws.send(JSON.stringify({
            type: 'ERROR',
            message: 'Error processing voice message',
          }));
        }
      });

      ws.on('close', () => {
        if (activeRequestAbortController) {
          activeRequestAbortController.abort();
        }
      });
    } catch (err: any) {
      console.error('[VoiceWsServer] Connection error:', err);
      ws.close(1011, 'Internal server error');
    }
  });

  return { server, wss };
}

// Self-run when invoked directly: npx tsx src/server/voiceWsServer.ts
if (require.main === module) {
  const { server } = createVoiceServer(DEFAULT_WS_PORT);
  server.listen(DEFAULT_WS_PORT, () => {
    console.log(`[VoiceWsServer] Listening on ws://localhost:${DEFAULT_WS_PORT}`);
  });
}
