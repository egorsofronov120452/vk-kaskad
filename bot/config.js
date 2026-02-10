import dotenv from 'dotenv';
dotenv.config();

export const config = {
  // VK настройки
  vk: {
    token: process.env.VK_BOT_TOKEN,
    groupId: process.env.VK_GROUP_ID,
    confirmationToken: process.env.VK_CONFIRMATION_TOKEN,
  },
  
  // База данных
  database: {
    connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  },
  
  // ID чатов (нужно будет заполнить после создания бесед)
  chats: {
    training: parseInt(process.env.CHAT_TRAINING_ID || '0'), // Учебный Центр
    flood: parseInt(process.env.CHAT_FLOOD_ID || '0'), // Флудилка
    dispatch: parseInt(process.env.CHAT_DISPATCH_ID || '0'), // Диспетчерская
    board: parseInt(process.env.CHAT_BOARD_ID || '0'), // Доска объявлений
    management: parseInt(process.env.CHAT_MANAGEMENT_ID || '0'), // Руководство
    senior: parseInt(process.env.CHAT_SENIOR_ID || '0'), // Старший Состав
    activity: parseInt(process.env.CHAT_ACTIVITY_ID || '0'), // Журнал Активности
  },
  
  // Настройки финансов
  finance: {
    commissionPercent: 10, // процент комиссии от дохода организации
    organizationPercent: 10, // процент организации от прибыли
    courierSalaryPercent: 40, // процент курьера от прибыли
  },
  
  // Таймауты
  timeouts: {
    orderAcceptance: 15 * 60 * 1000, // 15 минут в миллисекундах
    courierResponse: 3 * 60 * 1000, // 3 минуты для принятия заказа курьером
  },
};
