export const config = {
  vk: {
    token: process.env.VK_GROUP_TOKEN,
    groupId: process.env.VK_GROUP_ID,
    confirmationCode: process.env.VK_CONFIRMATION_CODE,
    apiVersion: '5.131',
  },
  
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },

  // ID чатов будут автоматически определены и сохранены в БД
  // Названия чатов для автоопределения (формат: "Название | Суффикс")
  chatNames: {
    training: 'Учебный Центр',    // Стажёр, Старший Состав, Руководство
    flood: 'Флудилка',            // Курьер, Старший Состав, Руководство
    dispatch: 'Диспетчерская',    // Все
    board: 'Доска Объявлений',    // Все
    management: 'Руководство',    // Руководство
    senior: 'Старший Состав',     // Старший Состав, Руководство
    activity: 'Журнал Активности', // Курьер, Старший Состав, Руководство
  },

  // Роли сотрудников
  roles: {
    intern: 'Стажёр',
    courier: 'Курьер',
    senior: 'Старший Состав',
    management: 'Руководство',
  },

  // ID администратора для отправки ID чатов
  adminUserId: process.env.VK_ADMIN_USER_ID || '700970214', // https://vk.com/province104

  // Настройки заказов
  order: {
    acceptTimeout: 15 * 60 * 1000, // 15 минут
    courierResponseTimeout: 3 * 60 * 1000, // 3 минуты
  },

  // Настройки финансов
  finance: {
    commissionPercent: 10, // Процент комиссии от прибыли организации
  },
};
