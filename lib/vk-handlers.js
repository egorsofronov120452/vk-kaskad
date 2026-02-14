import { config } from './vk-config.js';
import * as db from './vk-database.js';
import * as kb from './vk-keyboards.js';
import * as helpers from './vk-helpers.js';
import * as admin from './vk-admin.js';
import { sendMessage, getConversationMembers, getUserInfo } from './vk-api.js';

// Хранилище для таймеров заказов
const orderTimers = new Map();

// Главная функция обработки сообщений
export async function handleVKMessage(message) {
  const peerId = message.peer_id;
  const userId = message.from_id;
  const text = message.text?.trim() || '';
  const payload = message.payload ? JSON.parse(message.payload) : {};
  
  console.log('[v0] Message from:', userId, 'in chat:', peerId, 'text:', text);
  
  // Проверка черного списка
  const blacklisted = await db.checkBlacklist(userId);
  if (blacklisted) {
    await sendMessage(userId, '❌ Вы находитесь в черном списке до ' + new Date(blacklisted.blocked_until).toLocaleDateString());
    return;
  }
  
  // Определение типа чата (личные сообщения или беседа)
  const isPrivate = peerId === userId;
  
  if (isPrivate) {
    await handlePrivateMessage(userId, text, payload, message);
  } else {
    await handleChatMessage(peerId, userId, text, payload, message);
  }
}

// Обработка личных сообщений (клиенты)
async function handlePrivateMessage(userId, text, payload, message) {
  const command = payload.command || text.toLowerCase();
  
  // Получить или создать пользователя
  let user = await db.getUser(userId);
  if (!user) {
    user = await db.createUser(userId, '', 'client');
    await sendMessage(userId, '👋 Добро пожаловать! Выберите действие:', kb.mainMenuKeyboard());
    return;
  }
  
  // Получить состояние пользователя
  const state = await db.getUserState(userId);
  
  // Команда "Начать"
  if (command === 'начать' || command === '/start' || command === 'start' || command === 'main_menu') {
    await db.clearUserState(userId);
    await sendMessage(userId, '📋 Главное меню:', kb.mainMenuKeyboard());
    return;
  }
  
  // Обработка payload команд (кнопок)
  if (payload.category_id) {
    await showCategoryProducts(userId, payload.category_id);
    return;
  }
  
  if (payload.product_id) {
    await handleProductSelection(userId, payload.product_id);
    return;
  }
  
  if (payload.action) {
    await handlePayloadAction(userId, payload);
    return;
  }
  
  // Обработка состояний
  if (state && state.state) {
    await handleUserState(userId, text, payload, state);
    return;
  }
  
  // Обработка команд
  switch (command) {
    case 'catalog':
      await showCatalog(userId);
      break;
      
    case 'order':
      await startOrder(userId);
      break;
      
    case 'employment':
      await sendMessage(userId, '💼 Трудоустройство\n\nДля трудоустройства необходимо:\n1. Заполнить анкету: https://vk.cc/cUqFKe\n2. Связаться с руководством: https://vk.com/province104', kb.backButton());
      break;
      
    case 'faq':
      await sendMessage(userId, '❓ Частые вопросы\n\n• Как сделать заказ?\n• Сколько стоит доставка?\n• Время работы?\n\nОбращайтесь в поддержку для получения ответов.', kb.backButton());
      break;
      
    case 'my_orders':
      await showMyOrders(userId);
      break;
      
    case 'view_cart':
      await showCart(userId);
      break;
      
    case 'back':
      await sendMessage(userId, '📋 Главное меню:', kb.mainMenuKeyboard());
      break;
      
    default:
      await sendMessage(userId, '❓ Неизвестная команда. Выберите действие из меню:', kb.mainMenuKeyboard());
  }
}

// Обработка сообщений в беседах
async function handleChatMessage(peerId, userId, text, payload, message) {
  console.log('[v0] Chat message - peerId:', peerId, 'userId:', userId, 'text:', text);
  
  const chat = await db.getChatByPeerId(peerId);
  console.log('[v0] Chat found in DB:', chat ? chat.chat_type : 'NOT FOUND');
  
  // Если чат не зарегистрирован, попробовать определить по названию
  if (!chat) {
    console.log('[v0] Chat not registered, trying to register...');
    await tryRegisterChat(peerId);
    return;
  }
  
  const employee = await db.getEmployee(userId);
  if (!employee) {
    console.log('[v0] User not an employee:', userId);
    return;
  }
  
  // Обновить активность
  await db.incrementMessageCount(userId);
  await db.updateOnlineActivity(userId);
  
  // Обработка команд в разных чатах
  const chatType = chat.chat_type;
  
  // Журнал активности
  if (chatType === 'activity_log') {
    if (text === '!онлайн') {
      await handleOnlineCommand(peerId, userId);
    } else if (text === '!афк') {
      await db.setUserStatus(userId, 'afk');
      await sendMessage(peerId, `✅ ${employee.username} отметился как АФК`);
    } else if (text === '!вышел') {
      await db.setUserStatus(userId, 'offline');
      await sendMessage(peerId, `👋 ${employee.username} вышел`);
    }
    return;
  }
  
  // Команда !стата во всех чатах
  if (text.startsWith('!стата')) {
    await handleStatsCommand(peerId, userId);
    return;
  }
  
  // Команда !беседы - отправить список бесед в ЛС
  if (text === '!беседы') {
    await handleChatsListCommand(userId);
    return;
  }
  
  // Старший состав
  if (chatType === 'senior_staff') {
    if (text.startsWith('!')) {
      await admin.handleSeniorCommands(text, userId, config);
    }
    return;
  }
  
  // Руководство
  if (chatType === 'management') {
    if (text.startsWith('!')) {
      await admin.handleManagementCommands(text, userId, config);
    }
    return;
  }
  
  // Команда !пост (в ответе на сообщение)
  if (text.startsWith('!пост') && message.reply_message && employee.role === 'management') {
    await admin.handlePostCommand(message, userId, config);
    return;
  }
  
  // Диспетчерская - обработка принятия заказа
  if (chatType === 'dispatch' && payload.action === 'accept_order') {
    await handleAcceptOrder(payload.order_id, userId);
    return;
  }
}

// Показать каталог
async function showCatalog(userId) {
  const categories = await db.getCategories();
  if (!categories || categories.length === 0) {
    await sendMessage(userId, '📋 Каталог пуст', kb.backButton());
    return;
  }
  
  await sendMessage(userId, '📋 Каталог товаров\n\nВыберите категорию:', kb.categoriesKeyboard(categories));
}

// Начать оформление заказа
async function startOrder(userId) {
  const categories = await db.getCategories();
  if (!categories || categories.length === 0) {
    await sendMessage(userId, '❌ Товары временно недоступны', kb.mainMenuKeyboard());
    return;
  }
  
  await sendMessage(userId, '🛒 Выберите категорию товара:', kb.categoriesKeyboard(categories, 'order'));
  await db.setUserState(userId, 'selecting_category', {});
}

// Показать корзину
async function showCart(userId) {
  const cart = await db.getCartItems(userId);
  if (!cart || cart.length === 0) {
    await sendMessage(userId, '🛒 Корзина пуста\n\nДобавьте товары через "Заказать"', kb.mainMenuKeyboard());
    return;
  }
  
  const formatted = helpers.formatCart(cart);
  await sendMessage(userId, `🛒 Корзина:\n\n${formatted.text}\n\nИтого: ${formatted.total}р.`, kb.cartKeyboard());
}

// Показать мои заказы
async function showMyOrders(userId) {
  const { data: orders } = await db.supabase
    .from('orders')
    .select('*')
    .eq('client_vk_id', userId)
    .in('status', ['pending', 'accepted', 'preparing', 'delivering'])
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (!orders || orders.length === 0) {
    await sendMessage(userId, '📦 У вас нет активных заказов', kb.mainMenuKeyboard());
    return;
  }
  
  let message = '📦 Ваши заказы:\n\n';
  for (const order of orders) {
    message += `Заказ #${order.id}\n`;
    message += `Статус: ${helpers.formatOrderStatus(order)}\n`;
    message += `Сумма: ${order.total_price}р.\n\n`;
  }
  
  await sendMessage(userId, message, kb.mainMenuKeyboard());
}

// Обработка состояний пользователя
async function handleUserState(userId, text, payload, state) {
  const stateName = state.state;
  const stateData = state.data || {};
  
  switch (stateName) {
    case 'entering_delivery_time':
      if (text && stateData.orderId) {
        await handleDeliveryTimeEntered(userId, stateData.orderId, text);
      }
      break;
      
    case 'selecting_category':
      const categoryId = payload.category_id || parseInt(text);
      if (categoryId) {
        await showCategoryProducts(userId, categoryId);
        await db.setUserState(userId, 'selecting_product', { categoryId });
      }
      break;
      
    case 'entering_username':
      if (!helpers.validateUsername(text)) {
        await sendMessage(userId, '❌ Некорректный никнейм. Попробуйте еще раз:');
        return;
      }
      await db.setUserState(userId, 'entering_location', { ...stateData, username: text });
      await sendMessage(userId, '📍 Введите адрес доставки:');
      break;
      
    case 'entering_location':
      if (!helpers.validateLocation(text)) {
        await sendMessage(userId, '❌ Некорректный адрес. Попробуйте еще раз:');
        return;
      }
      await confirmOrder(userId, stateData.username, text);
      break;
      
    case 'confirming_order':
      if (text.toLowerCase() === 'да' || text.toLowerCase() === 'подтвердить') {
        await placeOrder(userId, stateData.username, stateData.location);
      } else {
        await db.clearUserState(userId);
        await sendMessage(userId, '❌ Заказ отменен', kb.mainMenuKeyboard());
      }
      break;
      
    case 'confirming_order_relevance':
      if (text.toLowerCase() === 'да' || text.toLowerCase() === 'подтвердить') {
        await handleOrderTimeout(stateData.orderId);
      } else {
        await db.clearUserState(userId);
        await sendMessage(userId, '❌ Заказ отменен', kb.mainMenuKeyboard());
      }
      break;
      
    default:
      await db.clearUserState(userId);
      await sendMessage(userId, '❓ Неизвестное состояние. Начните сначала:', kb.mainMenuKeyboard());
  }
}

// Показать товары категории
async function showCategoryProducts(userId, categoryId, page = 0) {
  const products = await db.getProductsByCategory(categoryId);
  if (!products || products.length === 0) {
    await sendMessage(userId, '❌ В этой категории пока нет товаров', kb.backButton());
    return;
  }
  
  const category = await db.getCategory(categoryId);
  await sendMessage(userId, `📦 ${category.name}\n\nВыберите товар:`, kb.productsKeyboard(products, page, categoryId));
}

// Подтверждение заказа
async function confirmOrder(userId, username, location) {
  const cart = await db.getCartItems(userId);
  if (!cart || cart.length === 0) {
    await sendMessage(userId, '❌ Корзина пуста', kb.mainMenuKeyboard());
    await db.clearUserState(userId);
    return;
  }
  
  const formatted = helpers.formatCart(cart);
  const message = `📋 Подтверждение заказа\n\n` +
    `Никнейм: ${username}\n` +
    `Адрес: ${location}\n\n` +
    formatted.text + `\n\n` +
    `Итого: ${formatted.total}р.\n\n` +
    `Всё верно?`;
  
  await sendMessage(userId, message, kb.confirmOrderKeyboard());
  await db.setUserState(userId, 'confirming_order', { username, location });
}

// Оформление заказа
async function placeOrder(userId, username, location) {
  const cart = await db.getCartItems(userId);
  if (!cart || cart.length === 0) {
    await sendMessage(userId, '❌ Корзина пуста', kb.mainMenuKeyboard());
    await db.clearUserState(userId);
    return;
  }
  
  // Создать заказ
  const order = await db.createOrder(userId, username, location, cart);
  
  // Очистить корзину и состояние
  await db.clearCart(userId);
  await db.clearUserState(userId);
  
  // Уведомить клиента
  await sendMessage(userId, `✅ Заказ #${order.id} принят!\n\nОжидайте принятия заказа курьером...`, kb.mainMenuKeyboard());
  
  // Отправить в диспетчерскую
  await sendOrderToDispatch(order);
}

// Отправка заказа в диспетчерскую
async function sendOrderToDispatch(order) {
  const dispatchChat = await db.getChatByType('dispatch');
  if (!dispatchChat) {
    console.log('[v0] Dispatch chat not found');
    return;
  }
  
  const items = await db.getOrderItems(order.id);
  const message = helpers.formatOrderForDispatch(order, items);
  
  await sendMessage(dispatchChat.peer_id, message, kb.acceptOrderKeyboard(order.id));
  
  // Установить таймер на 15 минут
  const timer = setTimeout(async () => {
    await handleOrderTimeout(order.id);
  }, 15 * 60 * 1000);
  
  orderTimers.set(order.id, timer);
}

// Таймаут заказа
async function handleOrderTimeout(orderId) {
  const order = await db.getOrder(orderId);
  if (!order || order.status !== 'pending') {
    return;
  }
  
  // Спросить клиента актуален ли заказ
  await sendMessage(order.client_vk_id, 
    `⏰ Прошло 15 минут. Заказ #${orderId} все еще актуален?`,
    kb.confirmOrderKeyboard()
  );
  
  await db.setUserState(order.client_vk_id, 'confirming_order_relevance', { orderId });
}

// Попробовать зарегистрировать чат
async function tryRegisterChat(peerId) {
  try {
    console.log('[v0] Getting conversation info for peerId:', peerId);
    const info = await getConversationMembers(peerId);
    console.log('[v0] Conversation info received:', JSON.stringify(info));
    const title = info?.title || '';
    
    console.log('[v0] Trying to register chat:', peerId, 'with title:', title);
    
    // Определить тип чата по названию
    let chatType = null;
    if (title.includes('Руководство')) chatType = 'management';
    else if (title.includes('Флудилка')) chatType = 'flood';
    else if (title.includes('Диспетчерская')) chatType = 'dispatch';
    else if (title.includes('Доска объявлений')) chatType = 'announcements';
    else if (title.includes('Старший состав')) chatType = 'senior_staff';
    else if (title.includes('Учебный центр')) chatType = 'training';
    else if (title.includes('Журнал активности')) chatType = 'activity_log';
    
    if (chatType) {
      await db.saveChat(chatType, peerId, title);
      console.log('[v0] Chat registered:', chatType, peerId);
      
      // Уведомить province104
      await sendMessage(config.vk.adminUserId, 
        `✅ Чат "${title}" (ID: ${peerId}) зарегистрирован как ${chatType}`
      );
      
      // Проверить все ли чаты зарегистрированы
      const allChats = await db.getAllChats();
      if (allChats && allChats.length >= 7) {
        await sendMessage(config.vk.adminUserId, 
          `✅ Все 7 чатов зарегистрированы! Бот готов к работе.`
        );
      }
    }
  } catch (error) {
    console.error('[v0] Error registering chat:', error);
  }
}

// Команда !онлайн
async function handleOnlineCommand(peerId, userId) {
  const onlineUsers = await db.getOnlineUsers();
  const stats = await db.getUserStats(userId);
  
  const message = helpers.formatOnlineUsers(onlineUsers, stats);
  await sendMessage(peerId, message);
}

// Команда !стата
async function handleStatsCommand(peerId, userId) {
  const employee = await db.getEmployee(userId);
  if (!employee) return;
  
  const stats = await db.getUserStats(userId);
  const message = helpers.formatUserStats(stats, stats, employee.username);
  await sendMessage(peerId, message);
}

// Команда !беседы - отправить список бесед в ЛС
async function handleChatsListCommand(userId) {
  const employee = await db.getEmployee(userId);
  if (!employee) {
    console.log('[v0] User is not an employee:', userId);
    return;
  }
  
  const chats = await db.getAllChats();
  if (!chats || chats.length === 0) {
    await sendMessage(userId, '❌ Беседы еще не зарегистрированы');
    return;
  }
  
  let message = '💬 Список бесед, в которых состоит бот:\n\n';
  
  for (const chat of chats) {
    const chatTypeName = helpers.getChatTypeName(chat.chat_type);
    message += `📌 ${chatTypeName}\n`;
    message += `   Название: ${chat.chat_title || 'Без названия'}\n`;
    message += `   Peer ID: ${chat.peer_id}\n\n`;
  }
  
  await sendMessage(userId, message);
}

// Принятие заказа курьером
async function handleAcceptOrder(orderId, courierVkId) {
  const order = await db.getOrder(orderId);
  if (!order || order.status !== 'pending') {
    await sendMessage(courierVkId, '❌ Заказ уже принят или отменен');
    return;
  }
  
  // Очистить таймер
  if (orderTimers.has(orderId)) {
    clearTimeout(orderTimers.get(orderId));
    orderTimers.delete(orderId);
  }
  
  const courier = await db.getEmployee(courierVkId);
  if (!courier) {
    await sendMessage(courierVkId, '❌ Ошибка: курьер не найден');
    return;
  }
  
  // Перейти в ЛС с курьером
  await sendMessage(courierVkId, 
    `📦 Заказ #${orderId} принят!\n\nВведите примерное время доставки (например: "15 минут"):`
  );
  
  await db.setUserState(courierVkId, 'entering_delivery_time', { orderId });
}

// Начать оформление заказа
async function startCheckout(userId) {
  const cart = await db.getCartItems(userId);
  if (!cart || cart.length === 0) {
    await sendMessage(userId, '❌ Корзина пуста', kb.mainMenuKeyboard());
    return;
  }
  
  await sendMessage(userId, '📝 Введите ваш никнейм:');
  await db.setUserState(userId, 'entering_username', {});
}

// Обработка введенного времени доставки
async function handleDeliveryTimeEntered(courierVkId, orderId, deliveryTime) {
  const order = await db.getOrder(orderId);
  if (!order) {
    await sendMessage(courierVkId, '❌ Заказ не найден');
    return;
  }
  
  const courier = await db.getEmployee(courierVkId);
  
  // Обновить заказ
  await db.updateOrderStatus(orderId, 'accepted', courierVkId, courier?.username, deliveryTime);
  
  // Очистить состояние курьера
  await db.clearUserState(courierVkId);
  
  // Уведомить клиента
  await sendMessage(order.client_vk_id, 
    `✅ Ваш курьер: ${courier.username}\nПримерное время ожидания: ${deliveryTime}`
  );
  
  // Отправить курьеру список покупок
  const items = await db.getOrderItems(orderId);
  let shoppingList = '';
  for (const item of items) {
    shoppingList += `${item.product_name} x${item.quantity}\n`;
  }
  await sendMessage(courierVkId, 
    `📝 Список покупок:\n\n${shoppingList}\n\nНажмите когда будет готово:`,
    kb.courierOrderKeyboard(orderId)
  );
}

// Обработка выбора товара
async function handleProductSelection(userId, productId) {
  const product = await db.getProduct(productId);
  if (!product) {
    await sendMessage(userId, '❌ Товар не найден', kb.mainMenuKeyboard());
    return;
  }
  
  await db.addToCart(userId, productId, 1);
  
  await sendMessage(userId, 
    `✅ Добавлено в корзину:\n${product.name} - ${product.price}р.\n\nХотите продолжить покупки?`,
    kb.cartActionsKeyboard()
  );
}

// Обработка payload действий
async function handlePayloadAction(userId, payload) {
  const action = payload.action;
  
  switch (action) {
    case 'add_to_cart':
      await handleProductSelection(userId, payload.product_id);
      break;
      
    case 'remove_from_cart':
      await db.removeFromCart(userId, payload.product_id);
      await showCart(userId);
      break;
      
    case 'clear_cart':
      await db.clearCart(userId);
      await sendMessage(userId, '🗑️ Корзина очищена', kb.mainMenuKeyboard());
      break;
      
    case 'checkout':
      await startCheckout(userId);
      break;
      
    case 'confirm_order':
      const state = await db.getUserState(userId);
      if (state && state.data) {
        await placeOrder(userId, state.data.username, state.data.location);
      }
      break;
      
    case 'cancel_order':
      await db.clearUserState(userId);
      await sendMessage(userId, '❌ Заказ отменен', kb.mainMenuKeyboard());
      break;
      
    default:
      console.log('[v0] Unknown payload action:', action);
  }
}
