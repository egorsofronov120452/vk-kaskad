import { handleVKMessage } from '@/lib/vk-handlers';
import { config } from '@/lib/vk-config';

export const runtime = 'edge';

export async function POST(request) {
  try {
    const body = await request.json();

    console.log('[v0] ===== VK WEBHOOK =====');
    console.log('[v0] Event type:', body.type);
    console.log('[v0] Full body:', JSON.stringify(body, null, 2));

    // Confirmation для VK Callback API
    if (body.type === 'confirmation') {
      console.log('[v0] Sending confirmation code:', config.vk.confirmationCode);
      return new Response(config.vk.confirmationCode, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    // Обработка сообщений
    if (body.type === 'message_new') {
      const message = body.object.message;
      console.log('[v0] Message received:', {
        from: message.from_id,
        peer: message.peer_id,
        text: message.text
      });
      await handleVKMessage(message);
    }

    // Обработка добавления в беседу
    if (body.type === 'message_allow') {
      console.log('[v0] Message allow from user:', body.object.user_id);
    }

    console.log('[v0] Responding with ok');
    // Возвращаем ok для всех событий
    return new Response('ok', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });

  } catch (error) {
    console.error('[v0] VK webhook error:', error);
    return new Response('ok', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}
