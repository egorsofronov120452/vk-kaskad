// Вспомогательные функции для бота

// Форматирование корзины для отображения
export function formatCart(cart) {
  if (cart.length === 0) {
    return { message: '🛒 Корзина пуста', total: 0 };
  }

  let message = '🛒 Корзина:\n';
  message += '━━━━━━━━━━━━━━━━\n';

  let total = 0;
  for (const item of cart) {
    const label = item.nutrition 
      ? `${item.name} | ${item.nutrition}`
      : item.name;
    const itemTotal = item.price * item.quantity;
    message += `• ${label} | ${item.price}р. (х${item.quantity}) = ${itemTotal}р.\n`;
    total += itemTotal;
  }

  message += '━━━━━━━━━━━━━━━━\n';
  message += `💰 Итого: ${total}р.`;

  return { message, total };
}

// Форматирование заказа для диспетчерской
export function formatOrderForDispatch(order, items) {
  let message = '🔔 НОВЫЙ ЗАКАЗ!\n\n';
  message += `👤 Никнейм: ${order.client_username}\n`;
  message += `📍 Место: ${order.delivery_location}\n\n`;
  message += '📦 Заказ:\n';

  for (const item of items) {
    const label = item.product_nutrition 
      ? `${item.product_name} | ${item.product_nutrition}`
      : item.product_name;
    const itemTotal = item.product_price * item.quantity;
    message += `• ${label} | ${item.product_price}р. (х${item.quantity}) = ${itemTotal}р.\n`;
  }

  message += `\n💰 Итого: ${order.total_price}р.`;
  return message;
}

// Создание чек-листа покупок для курьера
export function createCourierChecklist(items) {
  const checklist = [];
  const generalItems = new Map();
  const setItems = new Map();
  
  for (const item of items) {
    // Здесь можно добавить логику для определения составных товаров (сетов)
    // Пока просто добавляем все товары как общие
    
    const key = item.product_name;
    if (generalItems.has(key)) {
      generalItems.set(key, generalItems.get(key) + item.quantity);
    } else {
      generalItems.set(key, item.quantity);
    }
  }

  // Формируем чек-лист
  let message = '📝 Список покупок:\n\n';
  message += '🛒 Общее:\n';
  
  let id = 0;
  const checklistData = [];
  
  for (const [name, quantity] of generalItems) {
    message += `⬜ ${name} х${quantity}\n`;
    checklistData.push({ id: id++, label: `${name} х${quantity}`, checked: false });
  }

  return { message, checklist: checklistData };
}

// Обновление чек-листа
export function updateChecklistMessage(checklist) {
  let message = '📝 Список покупок:\n\n';
  message += '🛒 Общее:\n';
  
  for (const item of checklist) {
    const icon = item.checked ? '✅' : '⬜';
    message += `${icon} ${item.label}\n`;
  }

  return message;
}

// Расчет финансов для отчета
// Логика: товар 100р, себестоимость 50р -> прибыль 50р
// Из 50р прибыли: 40р зарплата курьеру, 10р организации
// Из 10р организации вычитается комиссия (например 5%) при переводе
export function calculateFinances(orders, items, config) {
  let totalIncome = 0;
  let totalCost = 0;
  const courierPayments = {};

  for (const order of orders) {
    const orderItems = items.filter(item => item.order_id === order.id);
    
    for (const item of orderItems) {
      const itemPrice = item.product_price * item.quantity;
      const itemCost = item.product_cost_price * item.quantity;
      const itemProfit = itemPrice - itemCost;
      
      // Из прибыли: 80% курьеру, 20% организации (настраивается в config)
      const courierShare = Math.floor(itemProfit * 0.8);
      const orgShare = itemProfit - courierShare;
      
      totalIncome += itemPrice;
      totalCost += itemCost;
      
      if (order.courier_username) {
        if (!courierPayments[order.courier_username]) {
          courierPayments[order.courier_username] = {
            costPrice: 0,
            salary: 0
          };
        }
        courierPayments[order.courier_username].costPrice += itemCost;
        courierPayments[order.courier_username].salary += courierShare;
      }
    }
  }

  const totalProfit = totalIncome - totalCost;
  
  // Рассчитываем долю организации (20% от всей прибыли)
  let organizationShare = 0;
  for (const payment of Object.values(courierPayments)) {
    organizationShare += totalProfit - payment.salary;
  }
  if (organizationShare === 0) {
    organizationShare = Math.floor(totalProfit * 0.2);
  }
  
  // Комиссия вычитается из доли организации (например 5%)
  const commissionPercent = config.finance?.commissionPercent || 5;
  const commission = Math.floor(organizationShare * (commissionPercent / 100));
  const netProfit = organizationShare - commission;

  return {
    totalIncome,
    totalCost,
    profit: totalProfit,
    organizationShare,
    commission,
    netProfit,
    courierPayments
  };
}

// Форматирование ежедневного отчета
export function formatDailyReport(finances) {
  let message = '📊 ЕЖЕДНЕВНЫЙ ОТЧЕТ\n\n';
  message += `💰 За день поступило: ${finances.totalIncome}р.\n\n`;
  message += `💳 Необходимо выплатить себестоимость курьерам:\n`;
  message += `Всего: ${finances.totalCost}р.\n\n`;
  
  if (Object.keys(finances.courierPayments).length > 0) {
    message += '👥 По курьерам (себестоимость):\n';
    for (const [courier, amounts] of Object.entries(finances.courierPayments)) {
      message += `• ${courier}: ${amounts.costPrice}р.\n`;
    }
    message += '\n';
  }
  
  message += `📈 Комиссия: ${finances.commission}р.\n`;
  message += `💵 Доход: ${finances.netProfit}р.`;

  return message;
}

// Форматирование недельного отчета
export function formatWeeklyReport(finances) {
  let message = '📊 НЕДЕЛЬНЫЙ ОТЧЕТ\n\n';
  message += `💰 Доход за неделю: ${finances.profit}р.\n\n`;
  
  if (Object.keys(finances.courierPayments).length > 0) {
    message += `💳 Зарплата курьерам:\n`;
    for (const [courier, amounts] of Object.entries(finances.courierPayments)) {
      message += `• ${courier}: ${amounts.salary}р.\n`;
    }
    message += '\n';
  }
  
  const totalSalaries = Object.values(finances.courierPayments).reduce((sum, a) => sum + a.salary, 0);
  const netProfit = finances.profit - totalSalaries;
  
  message += `💵 Чистый доход: ${netProfit}р.`;

  return message;
}

// Форматирование статуса заказа
export function formatOrderStatus(order) {
  let statusText = '';
  let emoji = '';
  
  switch (order.status) {
    case 'pending':
      emoji = '⏳';
      statusText = 'Ожидает принятия';
      break;
    case 'accepted':
      emoji = '✅';
      statusText = 'Принят курьером';
      break;
    case 'preparing':
      emoji = '👨‍🍳';
      statusText = 'Готовится';
      break;
    case 'delivering':
      emoji = '🚗';
      statusText = 'Курьер в пути';
      break;
    case 'completed':
      emoji = '✅';
      statusText = 'Завершен';
      break;
    case 'cancelled':
      emoji = '❌';
      statusText = 'Отменен';
      break;
    default:
      emoji = '❓';
      statusText = 'Неизвестно';
  }

  let message = `📦 Статус заказа #${order.id}\n\n`;
  message += `${emoji} ${statusText}\n\n`;
  
  if (order.courier_username) {
    message += `🚴 Курьер: ${order.courier_username}\n`;
    if (order.estimated_time) {
      message += `⏰ Примерное время: ${order.estimated_time}`;
    }
  }

  return message;
}

// Форматирование списка онлайн пользователей
export function formatOnlineUsers(onlineUsers, dailyStats) {
  if (onlineUsers.length === 0) {
    return '😴 Сейчас никого нет онлайн';
  }

  let message = '👥 На сервере:\n';
  
  for (const user of onlineUsers) {
    const stats = dailyStats.find(s => s.vk_id === user.vk_id);
    const hours = Math.floor((stats?.online_minutes || 0) / 60);
    const statusIcon = user.status === 'online' ? '🟢' : '🟡';
    message += `${statusIcon} ${user.username} (${hours}ч)\n`;
  }

  return message;
}

// Форматирование статистики пользователя
export function formatUserStats(dailyStats, weeklyStats, username) {
  const todayMinutes = dailyStats?.online_minutes || 0;
  const todayHours = Math.floor(todayMinutes / 60);
  const todayMins = todayMinutes % 60;

  const weeklyMinutes = weeklyStats?.total_online_minutes || 0;
  const weeklyHours = Math.floor(weeklyMinutes / 60);

  let message = `📊 Статистика ${username}:\n\n`;
  message += `💬 Кол-во сообщений: ${weeklyStats?.total_messages || 0}\n`;
  message += `🕐 Онлайн за сегодня: ${todayHours}ч. ${todayMins}м.\n`;
  message += `🕐 Онлайн за неделю: ${weeklyHours}ч.\n`;
  message += `📦 Принято заказов: ${weeklyStats?.total_orders || 0}`;

  return message;
}

// Валидация данных
export function validateUsername(username) {
  if (!username || username.trim().length === 0) {
    return { valid: false, error: 'Никнейм не может быть пустым' };
  }
  if (username.length > 100) {
    return { valid: false, error: 'Никнейм слишком длинный' };
  }
  return { valid: true };
}

export function validateLocation(location) {
  if (!location || location.trim().length === 0) {
    return { valid: false, error: 'Адрес не может быть пустым' };
  }
  if (location.length > 200) {
    return { valid: false, error: 'Адрес слишком длинный' };
  }
  return { valid: true };
}

export function validateProductData(name, price, costPrice) {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Название не может быть пустым' };
  }
  
  const priceNum = parseInt(price);
  const costPriceNum = parseInt(costPrice);
  
  if (isNaN(priceNum) || priceNum <= 0) {
    return { valid: false, error: 'Цена должна быть положительным числом' };
  }
  
  if (isNaN(costPriceNum) || costPriceNum < 0) {
    return { valid: false, error: 'Себестоимость должна быть неотрицательным числом' };
  }
  
  if (costPriceNum > priceNum) {
    return { valid: false, error: 'Себестоимость не может быть больше цены' };
  }
  
  return { valid: true, price: priceNum, costPrice: costPriceNum };
}

// Получение даты начала недели
export function getWeekStart(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Понедельник как начало недели
  return new Date(d.setDate(diff));
}

// Форматирование даты
export function formatDate(date) {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

// Форматирование времени
export function formatTime(date) {
  return new Date(date).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Форматирование даты и времени
export function formatDateTime(date) {
  return `${formatDate(date)} ${formatTime(date)}`;
}

// Парсинг времени доставки
export function parseEstimatedTime(text) {
  // Попытка извлечь число минут из текста
  const match = text.match(/(\d+)/);
  if (match) {
    return `${match[1]} минут`;
  }
  return text;
}

// Генерация случайного ID
export function generateRandomId() {
  return Math.floor(Math.random() * 1000000000);
}

// Проверка прав доступа
export function hasPermission(userRole, requiredRole) {
  const roles = ['client', 'trainee', 'courier', 'senior', 'management'];
  const userLevel = roles.indexOf(userRole);
  const requiredLevel = roles.indexOf(requiredRole);
  
  return userLevel >= requiredLevel;
}

// Получение названия роли на русском
export function getRoleName(role) {
  const roleNames = {
    'client': 'Клиент',
    'trainee': 'Стажёр',
    'courier': 'Курьер',
    'senior': 'Старший состав',
    'management': 'Руководство'
  };
  
  return roleNames[role] || 'Неизвестно';
}

// Получение списка чатов для роли
export function getChatsForRole(role, chats) {
  const chatAccess = {
    'client': [],
    'trainee': [chats.training, chats.board, chats.dispatch],
    'courier': [chats.flood, chats.dispatch, chats.board, chats.activity],
    'senior': [chats.flood, chats.dispatch, chats.board, chats.activity, chats.senior],
    'management': Object.values(chats).filter(id => id > 0)
  };
  
  return chatAccess[role] || [];
}

// Проверка является ли пользователь в определенном чате
export function isChatMember(peerId, allowedChats) {
  return allowedChats.includes(peerId);
}

// Получение названия типа чата на русском
export function getChatTypeName(chatType) {
  const chatTypeNames = {
    'management': 'Руководство',
    'senior_staff': 'Старший состав',
    'flood': 'Флудилка',
    'dispatch': 'Диспетчерская',
    'announcements': 'Доска объявлений',
    'training': 'Учебный центр',
    'activity_log': 'Журнал активности'
  };
  
  return chatTypeNames[chatType] || 'Неизвестный тип';
}
