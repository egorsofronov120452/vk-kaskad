import { config } from './vk-config.js';

const API_URL = 'https://api.vk.com/method/';

async function callAPI(method, params = {}) {
  const url = `${API_URL}${method}`;
  const body = new URLSearchParams({
    ...params,
    access_token: config.vk.token,
    v: config.vk.apiVersion,
  });

  try {
    const response = await fetch(url, {
      method: 'POST',
      body,
    });

    const data = await response.json();

    if (data.error) {
      console.error('[v0] VK API Error:', data.error);
      throw new Error(data.error.error_msg);
    }

    return data.response;
  } catch (error) {
    console.error('[v0] API call failed:', error);
    throw error;
  }
}

export async function sendMessage(peerId, text, keyboard = null) {
  const params = {
    peer_id: peerId,
    message: text,
    random_id: Math.floor(Math.random() * 1000000000),
  };

  if (keyboard) {
    params.keyboard = JSON.stringify(keyboard);
  }

  return await callAPI('messages.send', params);
}

export async function editMessage(peerId, conversationMessageId, text, keyboard = null) {
  const params = {
    peer_id: peerId,
    conversation_message_id: conversationMessageId,
    message: text,
  };

  if (keyboard) {
    params.keyboard = JSON.stringify(keyboard);
  }

  return await callAPI('messages.edit', params);
}

export async function getUserInfo(userId) {
  return await callAPI('users.get', {
    user_ids: userId,
  });
}

export async function getConversationMembers(peerId) {
  const result = await callAPI('messages.getConversationsById', {
    peer_ids: peerId,
  });
  console.log('[v0] getConversationMembers raw result:', JSON.stringify(result, null, 2));
  
  // API возвращает response.items, берем первый элемент
  const conversation = result?.response?.items?.[0] || result?.items?.[0];
  console.log('[v0] Conversation object:', JSON.stringify(conversation, null, 2));
  
  if (conversation?.chat_settings) {
    return conversation.chat_settings;
  }
  
  // Если нет chat_settings, попробуем peer
  if (conversation?.peer?.local_id) {
    return { title: 'Chat ' + conversation.peer.local_id };
  }
  
  return { title: 'Unknown Chat' };
}

export async function kickUser(peerId, memberId) {
  // Для обычных чатов: peer_id = 2000000000 + chat_id
  // Для чатов сообщества: peer_id может быть меньше 2000000000
  const chatId = peerId > 2000000000 
    ? peerId - 2000000000 
    : Math.abs(peerId);
  
  return await callAPI('messages.removeChatUser', {
    chat_id: chatId,
    member_id: memberId,
  });
}

export async function postToWall(text, attachments = []) {
  const params = {
    owner_id: -config.vk.groupId,
    message: text,
    from_group: 1,
  };

  if (attachments.length > 0) {
    params.attachments = attachments.join(',');
  }

  return await callAPI('wall.post', params);
}

export async function pinMessage(peerId, messageId) {
  return await callAPI('messages.pin', {
    peer_id: peerId,
    message_id: messageId,
  });
}

export async function unpinMessage(peerId) {
  return await callAPI('messages.unpin', {
    peer_id: peerId,
  });
}

export async function addToChatBlacklist(userId) {
  return await callAPI('groups.ban', {
    group_id: config.vk.groupId,
    owner_id: userId,
    end_date: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 дней
  });
}
