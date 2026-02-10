// Клавиатуры для VK бота (используем VK API Keyboard format)

// Главное меню
export function mainMenuKeyboard() {
  return {
    inline: true,
    buttons: [
      [
        { action: { type: 'text', label: '📋 Каталог', payload: '{"command":"catalog"}' }, color: 'primary' },
        { action: { type: 'text', label: '🛒 Заказать', payload: '{"command":"order"}' }, color: 'positive' }
      ],
      [
        { action: { type: 'text', label: '💼 Трудоустройство', payload: '{"command":"employment"}' }, color: 'secondary' },
        { action: { type: 'text', label: '❓ Частые вопросы', payload: '{"command":"faq"}' }, color: 'secondary' }
      ],
      [
        { action: { type: 'text', label: '📦 Мои заказы', payload: '{"command":"my_orders"}' }, color: 'secondary' }
      ]
    ]
  };
}

// Кнопка "Назад"
export function backButton(command = 'main_menu') {
  return {
    inline: true,
    buttons: [[
      { action: { type: 'text', label: '◀️ Назад', payload: `{"command":"${command}"}` }, color: 'negative' }
    ]]
  };
}

// Клавиатура категорий
export function categoriesKeyboard(categories, backCommand = 'main_menu') {
  const buttons = [];
  let row = [];
  
  for (let i = 0; i < categories.length; i++) {
    row.push({
      action: { 
        type: 'text', 
        label: categories[i].name, 
        payload: `{"command":"category","categoryId":${categories[i].id}}` 
      },
      color: 'primary'
    });
    
    if ((i + 1) % 2 === 0 || i === categories.length - 1) {
      buttons.push([...row]);
      row = [];
    }
  }
  
  buttons.push([
    { action: { type: 'text', label: '◀️ Назад', payload: `{"command":"${backCommand}"}` }, color: 'negative' }
  ]);
  
  return { inline: true, buttons };
}

// Клавиатура товаров с пагинацией
export function productsKeyboard(products, page = 0, categoryId, itemsPerPage = 5) {
  const buttons = [];
  const start = page * itemsPerPage;
  const end = Math.min(start + itemsPerPage, products.length);
  
  for (let i = start; i < end; i++) {
    const product = products[i];
    const label = product.nutrition 
      ? `${product.name} | ${product.nutrition} - ${product.price}р.`
      : `${product.name} - ${product.price}р.`;
    
    buttons.push([{
      action: { 
        type: 'text', 
        label: label.substring(0, 40), 
        payload: `{"command":"add_to_cart","productId":${product.id}}` 
      },
      color: 'positive'
    }]);
  }
  
  // Пагинация
  const paginationRow = [];
  if (page > 0) {
    paginationRow.push({
      action: { 
        type: 'text', 
        label: '⬅️', 
        payload: `{"command":"page","categoryId":${categoryId},"page":${page - 1}}` 
      },
      color: 'secondary'
    });
  }
  
  if (end < products.length) {
    paginationRow.push({
      action: { 
        type: 'text', 
        label: '➡️', 
        payload: `{"command":"page","categoryId":${categoryId},"page":${page + 1}}` 
      },
      color: 'secondary'
    });
  }
  
  if (paginationRow.length > 0) {
    buttons.push(paginationRow);
  }
  
  buttons.push([
    { action: { type: 'text', label: '◀️ К категориям', payload: '{"command":"order"}' }, color: 'negative' }
  ]);
  
  return { inline: true, buttons };
}

// Клавиатура корзины
export function cartKeyboard() {
  return {
    inline: true,
    buttons: [
      [
        { action: { type: 'text', label: '➕ Добавить товар', payload: '{"command":"order"}' }, color: 'positive' }
      ],
      [
        { action: { type: 'text', label: '🗑 Удалить товар', payload: '{"command":"remove_item"}' }, color: 'secondary' },
        { action: { type: 'text', label: '🧹 Очистить корзину', payload: '{"command":"clear_cart"}' }, color: 'negative' }
      ],
      [
        { action: { type: 'text', label: '✅ Оформить заказ', payload: '{"command":"checkout"}' }, color: 'positive' }
      ],
      [
        { action: { type: 'text', label: '◀️ Главное меню', payload: '{"command":"main_menu"}' }, color: 'negative' }
      ]
    ]
  };
}

// Клавиатура для удаления товара
export function removeItemKeyboard(cart) {
  const buttons = cart.map((item, index) => [{
    action: { 
      type: 'text', 
      label: `❌ ${item.name}`, 
      payload: `{"command":"confirm_remove","index":${index}}` 
    },
    color: 'negative'
  }]);
  
  buttons.push([
    { action: { type: 'text', label: '◀️ Назад', payload: '{"command":"cart"}' }, color: 'secondary' }
  ]);
  
  return { inline: true, buttons };
}

// Клавиатура подтверждения заказа
export function confirmOrderKeyboard() {
  return {
    inline: true,
    buttons: [
      [
        { action: { type: 'text', label: '✅ Всё верно', payload: '{"command":"confirm_order"}' }, color: 'positive' },
        { action: { type: 'text', label: '✏️ Изменить', payload: '{"command":"cart"}' }, color: 'secondary' }
      ],
      [
        { action: { type: 'text', label: '❌ Отменить', payload: '{"command":"main_menu"}' }, color: 'negative' }
      ]
    ]
  };
}

// Клавиатура для курьера (принять заказ)
export function acceptOrderKeyboard(orderId) {
  return {
    inline: true,
    buttons: [[
      { action: { type: 'text', label: '✅ Принять заказ', payload: `{"command":"accept_order","orderId":${orderId}}` }, color: 'positive' }
    ]]
  };
}

// Клавиатура управления заказом для курьера
export function courierOrderKeyboard(orderId) {
  return {
    inline: true,
    buttons: [
      [
        { action: { type: 'text', label: '✅ Готов, еду к клиенту', payload: `{"command":"order_ready","orderId":${orderId}}` }, color: 'positive' }
      ],
      [
        { action: { type: 'text', label: '📍 На месте', payload: `{"command":"arrived","orderId":${orderId}}` }, color: 'primary' }
      ],
      [
        { action: { type: 'text', label: '✔️ Заказ завершён', payload: `{"command":"complete_order","orderId":${orderId}}` }, color: 'positive' }
      ]
    ]
  };
}

// Клавиатура статуса заказа для клиента
export function clientOrderStatusKeyboard(orderId) {
  return {
    inline: true,
    buttons: [
      [
        { action: { type: 'text', label: '📊 Статус заказа', payload: `{"command":"order_status","orderId":${orderId}}` }, color: 'primary' }
      ],
      [
        { action: { type: 'text', label: '💬 Связаться с курьером', payload: `{"command":"contact_courier","orderId":${orderId}}` }, color: 'secondary' }
      ],
      [
        { action: { type: 'text', label: '◀️ Главное меню', payload: '{"command":"main_menu"}' }, color: 'negative' }
      ]
    ]
  };
}

// Подтверждение связи с курьером
export function confirmContactCourierKeyboard(orderId) {
  return {
    inline: true,
    buttons: [
      [
        { action: { type: 'text', label: '✅ Да, уверен', payload: `{"command":"confirm_contact","orderId":${orderId}}` }, color: 'positive' },
        { action: { type: 'text', label: '❌ Отмена', payload: `{"command":"order_status","orderId":${orderId}}` }, color: 'negative' }
      ]
    ]
  };
}

// Действия с корзиной
export function cartActionsKeyboard() {
  return {
    inline: true,
    buttons: [
      [
        { action: { type: 'text', label: '➕ Добавить товар', payload: '{"command":"order"}' }, color: 'primary' },
        { action: { type: 'text', label: '🗑️ Очистить', payload: '{"action":"clear_cart"}' }, color: 'negative' }
      ],
      [
        { action: { type: 'text', label: '✅ Оформить заказ', payload: '{"action":"checkout"}' }, color: 'positive' }
      ],
      [
        { action: { type: 'text', label: '🏠 Главное меню', payload: '{"command":"start"}' }, color: 'secondary' }
      ]
    ]
  };
}

// Да/Нет клавиатура
export function yesNoKeyboard() {
  return {
    inline: true,
    buttons: [
      [
        { action: { type: 'text', label: '✅ Да', payload: '{"answer":"yes"}' }, color: 'positive' },
        { action: { type: 'text', label: '❌ Нет', payload: '{"answer":"no"}' }, color: 'negative' }
      ]
    ]
  };
}
