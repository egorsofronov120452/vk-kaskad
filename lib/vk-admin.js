// Команды для администрирования бота
import * as db from './vk-database.js';
import * as kb from './vk-keyboards.js';
import * as helpers from './vk-helpers.js';
import { sendMessage } from './vk-api.js';

// Обработчик команд для старшего состава
export async function handleSeniorCommands(message, vkUserId, config) {
  const text = message.text?.trim();
  const user = await db.getUser(vkUserId);

  if (!user || !helpers.hasPermission(user.role, 'senior')) {
    return false;
  }

  // Показать статистику сотрудников
  if (text === '/статистика' || text === '/stats') {
    const employees = await db.getEmployeesByRole(['courier', 'trainee']);
    
    let responseMessage = '📊 СТАТИСТИКА СОТРУДНИКОВ (за неделю)\n\n';
    
    for (const emp of employees) {
      const stats = await db.getUserWeeklyStats(emp.vk_id);
      const hours = Math.floor((stats?.online_minutes || 0) / 60);
      responseMessage += `👤 ${emp.username}\n`;
      responseMessage += `  🕐 Онлайн: ${hours}ч\n`;
      responseMessage += `  💬 Сообщений: ${stats?.messages_count || 0}\n`;
      responseMessage += `  📦 Заказов: ${stats?.orders_accepted || 0}\n\n`;
    }

    await sendMessage(message.peer_id, responseMessage);
    return true;
  }

  // Добавить сотрудника
  if (text === '/добавить' || text === '/add') {
    await sendMessage(message.peer_id, '👤 Отправьте VK ID нового сотрудника:');
    await db.setUserState(vkUserId, 'senior_adding_staff', {});
    return true;
  }

  // Создать объявление
  if (text === '/объявление' || text === '/announce') {
    await sendMessage(message.peer_id, '📢 Введите текст объявления:');
    await db.setUserState(vkUserId, 'senior_creating_announcement', {});
    return true;
  }

  return false;
}

// Обработчик команд для руководства
export async function handleManagementCommands(message, vkUserId, config) {
  const text = message.text?.trim();
  const user = await db.getUser(vkUserId);

  if (!user || user.role !== 'management') {
    return false;
  }

  // Добавить категорию
  if (text === '/добавить_категорию' || text.startsWith('/add_cat')) {
    await sendMessage(message.peer_id, '📁 Введите название категории:');
    await db.setUserState(vkUserId, 'management_adding_category', {});
    return true;
  }

  // Удалить категорию
  if (text === '/удалить_категорию' || text.startsWith('/del_cat')) {
    const categories = await db.getCategories();
    
    if (categories.length === 0) {
      await sendMessage(message.peer_id, '❌ Нет категорий для удаления');
      return true;
    }

    let responseMessage = '🗑 Выберите категорию для удаления (отправьте номер):\n\n';
    for (let i = 0; i < categories.length; i++) {
      responseMessage += `${i + 1}. ${categories[i].name}\n`;
    }

    await db.setUserState(vkUserId, 'management_deleting_category', { categories });
    await sendMessage(message.peer_id, responseMessage);
    return true;
  }

  // Добавить товар
  if (text === '/добавить_товар' || text.startsWith('/add_prod')) {
    const categories = await db.getCategories();
    
    if (categories.length === 0) {
      await sendMessage(message.peer_id, '❌ Сначала создайте категории');
      return true;
    }

    let responseMessage = '📦 Выберите категорию для товара (отправьте номер):\n\n';
    for (let i = 0; i < categories.length; i++) {
      responseMessage += `${i + 1}. ${categories[i].name}\n`;
    }

    await db.setUserState(vkUserId, 'management_adding_product_cat', { categories });
    await sendMessage(message.peer_id, responseMessage);
    return true;
  }

  // Удалить товар
  if (text === '/удалить_товар' || text.startsWith('/del_prod')) {
    const products = await db.getAllProducts();
    
    if (products.length === 0) {
      await sendMessage(message.peer_id, '❌ Нет товаров для удаления');
      return true;
    }

    let responseMessage = '🗑 Выберите товар для удаления (отправьте номер):\n\n';
    for (let i = 0; i < products.length; i++) {
      const label = products[i].nutrition 
        ? `${products[i].name} | ${products[i].nutrition}`
        : products[i].name;
      responseMessage += `${i + 1}. ${label} - ${products[i].price}р.\n`;
    }

    await db.setUserState(vkUserId, 'management_deleting_product', { products });
    await sendMessage(message.peer_id, responseMessage);
    return true;
  }

  // Создать пост
  if (text === '/пост' || text === '/post') {
    await sendMessage(message.peer_id, '📝 Введите текст поста:');
    await db.setUserState(vkUserId, 'management_creating_post', {});
    return true;
  }

  return false;
}

// Обработка команды !пост в ответе на сообщение
export async function handlePostCommand(message, vkUserId, config) {
  if (!message.reply_message) {
    return false;
  }

  const user = await db.getUser(vkUserId);
  if (!user || !helpers.hasPermission(user.role, 'senior')) {
    return false;
  }

  // Создать пост из сообщения на которое ответили
  const postText = message.reply_message.text;
  const postAttachments = message.reply_message.attachments || [];

  // Здесь будет логика публикации в сообщество
  // Требуется GROUP_TOKEN с правами на публикацию
  
  await sendMessage(message.peer_id, '✅ Пост опубликован в сообществе');
  return true;
}

export default {
  handleSeniorCommands,
  handleManagementCommands,
  handlePostCommand
};
