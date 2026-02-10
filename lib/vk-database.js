import { createClient } from '@supabase/supabase-js';
import { config } from './vk-config.js';

export const supabase = createClient(
  config.supabase.url,
  config.supabase.key
);

// Инициализация - таблицы создаются через SQL скрипт
export async function initDatabase() {
  console.log('✅ База данных Supabase подключена');
}

// === ПОЛЬЗОВАТЕЛИ ===

export async function getUser(vkId) {
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('vk_id', vkId)
    .single();
  return data;
}

export async function createUser(vkId, username, role = 'client') {
  const { data } = await supabase
    .from('users')
    .upsert({ vk_id: vkId, username, role }, { onConflict: 'vk_id' })
    .select()
    .single();
  return data;
}

export async function checkBlacklist(vkId) {
  const user = await getUser(vkId);
  if (!user || !user.blacklisted_until) return false;
  return new Date(user.blacklisted_until) > new Date();
}

export async function addToBlacklist(vkId, days = 30) {
  const until = new Date();
  until.setDate(until.getDate() + days);
  await supabase
    .from('users')
    .update({ blacklisted_until: until.toISOString() })
    .eq('vk_id', vkId);
}

// === СОТРУДНИКИ ===

export async function getEmployee(vkId) {
  const { data } = await supabase
    .from('employees')
    .select('*')
    .eq('vk_id', vkId)
    .single();
  return data;
}

export async function createEmployee(vkId, username, role) {
  const { data } = await supabase
    .from('employees')
    .upsert({ vk_id: vkId, username, role }, { onConflict: 'vk_id' })
    .select()
    .single();
  return data;
}

export async function getAllEmployees() {
  const { data } = await supabase
    .from('employees')
    .select('*')
    .order('username');
  return data || [];
}

export async function getEmployeesByRole(roles) {
  const { data } = await supabase
    .from('employees')
    .select('*')
    .in('role', roles)
    .order('username');
  return data || [];
}

export async function getUserWeeklyStats(vkId) {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  const { data } = await supabase
    .from('user_stats')
    .select('*')
    .eq('vk_id', vkId)
    .gte('created_at', weekAgo.toISOString())
    .single();
  
  return data || { online_minutes: 0, messages_count: 0, orders_accepted: 0 };
}

// === ЧАТЫ ===

export async function saveChat(chatType, peerId, name) {
  const { data } = await supabase
    .from('chats')
    .upsert({ chat_type: chatType, peer_id: peerId, name }, { onConflict: 'peer_id' })
    .select()
    .single();
  return data;
}

export async function getChatByPeerId(peerId) {
  const { data } = await supabase
    .from('chats')
    .select('*')
    .eq('peer_id', peerId)
    .single();
  return data;
}

export async function getChatByType(chatType) {
  const { data } = await supabase
    .from('chats')
    .select('*')
    .eq('chat_type', chatType)
    .single();
  return data;
}

export async function getAllChats() {
  const { data } = await supabase
    .from('chats')
    .select('*');
  return data || [];
}

// === КАТЕГОРИИ ===

export async function getCategories() {
  const { data } = await supabase
    .from('categories')
    .select('*')
    .order('name');
  return data || [];
}

export async function getCategory(id) {
  const { data } = await supabase
    .from('categories')
    .select('*')
    .eq('id', id)
    .single();
  return data;
}

export async function createCategory(name, imageUrl = null, description = null) {
  const { data } = await supabase
    .from('categories')
    .insert({ name, image_url: imageUrl, description })
    .select()
    .single();
  return data;
}

export async function deleteCategory(id) {
  await supabase
    .from('categories')
    .delete()
    .eq('id', id);
}

// === ТОВАРЫ ===

export async function getProductsByCategory(categoryId) {
  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('category_id', categoryId)
    .order('name');
  return data || [];
}

export async function getProduct(id) {
  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();
  return data;
}

export async function createProduct(categoryId, name, price, costPrice) {
  const { data } = await supabase
    .from('products')
    .insert({ category_id: categoryId, name, price, cost_price: costPrice })
    .select()
    .single();
  return data;
}

export async function deleteProduct(id) {
  await supabase
    .from('products')
    .delete()
    .eq('id', id);
}

export async function getAllProducts() {
  const { data } = await supabase
    .from('products')
    .select('*, category:categories(name)')
    .order('name');
  return data || [];
}

// === КОРЗИНА ===

export async function getCartItems(vkId) {
  const { data } = await supabase
    .from('cart')
    .select('*, product:products(*)')
    .eq('user_vk_id', vkId);
  return data || [];
}

export async function addToCart(vkId, productId, quantity = 1) {
  // Проверяем существует ли уже
  const { data: existing } = await supabase
    .from('cart')
    .select('*')
    .eq('user_vk_id', vkId)
    .eq('product_id', productId)
    .single();

  if (existing) {
    await supabase
      .from('cart')
      .update({ quantity: existing.quantity + quantity })
      .eq('id', existing.id);
  } else {
    await supabase
      .from('cart')
      .insert({ user_vk_id: vkId, product_id: productId, quantity });
  }
}

export async function removeFromCart(cartItemId) {
  await supabase
    .from('cart')
    .delete()
    .eq('id', cartItemId);
}

export async function clearCart(vkId) {
  await supabase
    .from('cart')
    .delete()
    .eq('user_vk_id', vkId);
}

// === СОСТОЯНИЕ ПОЛЬЗОВАТЕЛЯ ===

export async function getUserState(vkId) {
  const { data } = await supabase
    .from('user_states')
    .select('*')
    .eq('vk_id', vkId)
    .single();
  return data || { state: null, data: {} };
}

export async function setUserState(vkId, state, data = {}) {
  await supabase
    .from('user_states')
    .upsert({ vk_id: vkId, state, data }, { onConflict: 'vk_id' });
}

export async function clearUserState(vkId) {
  await supabase
    .from('user_states')
    .delete()
    .eq('vk_id', vkId);
}

// === ЗАКАЗЫ ===

export async function createOrder(clientVkId, clientUsername, deliveryLocation, cartItems) {
  const totalPrice = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const totalCost = cartItems.reduce((sum, item) => sum + item.product.cost_price * item.quantity, 0);

  const { data: order } = await supabase
    .from('orders')
    .insert({
      client_vk_id: clientVkId,
      client_username: clientUsername,
      delivery_location: deliveryLocation,
      total_price: totalPrice,
      total_cost: totalCost,
      status: 'pending',
    })
    .select()
    .single();

  // Добавляем товары
  for (const item of cartItems) {
    await supabase
      .from('order_items')
      .insert({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.product.name,
        product_price: item.product.price,
        product_cost_price: item.product.cost_price,
        quantity: item.quantity,
      });
  }

  return order;
}

export async function getOrder(orderId) {
  const { data } = await supabase
    .from('orders')
    .select('*, items:order_items(*)') 
    .eq('id', orderId)
    .single();
  return data;
}

export async function updateOrderStatus(orderId, status, courierVkId = null, courierUsername = null, estimatedTime = null) {
  const updates = { status };
  
  if (courierVkId) updates.courier_vk_id = courierVkId;
  if (courierUsername) updates.courier_username = courierUsername;
  if (estimatedTime) updates.estimated_time = estimatedTime;
  if (status === 'accepted') updates.accepted_at = new Date().toISOString();
  if (status === 'completed') updates.completed_at = new Date().toISOString();

  await supabase
    .from('orders')
    .update(updates)
    .eq('id', orderId);
}

export async function cancelOrder(orderId) {
  await supabase
    .from('orders')
    .update({ status: 'cancelled' })
    .eq('id', orderId);
}

export async function getOrderItems(orderId) {
  const { data } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', orderId);
  return data || [];
}

export async function addOrderItem(orderId, productId, quantity, price, costPrice) {
  await supabase
    .from('order_items')
    .insert({
      order_id: orderId,
      product_id: productId,
      quantity,
      product_price: price,
      product_cost_price: costPrice
    });
}

// === ОНЛАЙН АКТИВНОСТЬ ===

export async function getOnlineUsers() {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  
  const { data } = await supabase
    .from('online_activity')
    .select('*')
    .eq('status', 'online')
    .gte('last_activity', fiveMinutesAgo);
  return data || [];
}

export async function setUserStatus(vkId, status) {
  await supabase
    .from('online_activity')
    .upsert({
      vk_id: vkId,
      status,
      last_activity: new Date().toISOString()
    }, { onConflict: 'vk_id' });
}

export async function updateOnlineActivity(vkId) {
  const { data: existing } = await supabase
    .from('online_activity')
    .select('*')
    .eq('vk_id', vkId)
    .single();

  if (existing) {
    const now = new Date();
    const lastActivity = new Date(existing.last_activity);
    const minutesElapsed = Math.floor((now - lastActivity) / 60000);

    await supabase
      .from('online_activity')
      .update({
        status: 'online',
        last_activity: now.toISOString(),
        online_minutes: (existing.online_minutes || 0) + minutesElapsed,
      })
      .eq('vk_id', vkId);
  } else {
    const employee = await getEmployee(vkId);
    await supabase
      .from('online_activity')
      .insert({
        vk_id: vkId,
        username: employee?.username || '',
        status: 'online',
        last_activity: new Date().toISOString(),
        online_minutes: 0,
      });
  }
}

// === СТАТИСТИКА ===

export async function getUserStats(vkId) {
  const today = new Date().toISOString().split('T')[0];
  
  const { data: todayStats } = await supabase
    .from('daily_stats')
    .select('*')
    .eq('vk_id', vkId)
    .eq('date', today)
    .single();

  const { data: weekStats } = await supabase
    .from('daily_stats')
    .select('*')
    .eq('vk_id', vkId)
    .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    .order('online_minutes', { ascending: false });

  const { data: onlineActivity } = await supabase
    .from('online_activity')
    .select('*')
    .eq('vk_id', vkId)
    .single();

  return {
    today: todayStats,
    week: weekStats || [],
    online: onlineActivity,
  };
}

export async function getAllEmployeesStats() {
  const { data } = await supabase
    .from('employees')
    .select(`
      *,
      online:online_activity(*),
      orders:orders(count)
    `);
  return data || [];
}

export async function incrementMessageCount(vkId) {
  const today = new Date().toISOString().split('T')[0];
  
  const { data: existing } = await supabase
    .from('daily_stats')
    .select('*')
    .eq('vk_id', vkId)
    .eq('date', today)
    .single();

  if (existing) {
    await supabase
      .from('daily_stats')
      .update({ messages_count: existing.messages_count + 1 })
      .eq('id', existing.id);
  } else {
    const employee = await getEmployee(vkId);
    await supabase
      .from('daily_stats')
      .insert({
        vk_id: vkId,
        username: employee?.username || '',
        date: today,
        messages_count: 1,
      });
  }
}

// === ФИНАНСОВЫЕ ОТЧЕТЫ ===

export async function getDailyOrders(date) {
  const { data } = await supabase
    .from('orders')
    .select('*, items:order_items(*)')
    .eq('status', 'completed')
    .gte('completed_at', `${date}T00:00:00`)
    .lte('completed_at', `${date}T23:59:59`);
  return data || [];
}

export async function getWeeklyOrders(weekStart) {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const { data } = await supabase
    .from('orders')
    .select('*, items:order_items(*)')
    .eq('status', 'completed')
    .gte('completed_at', weekStart.toISOString())
    .lte('completed_at', weekEnd.toISOString());
  return data || [];
}

export async function saveFinancialReport(reportType, reportDate, totalIncome, totalCost, commission, netProfit, data) {
  await supabase
    .from('financial_reports')
    .insert({
      report_type: reportType,
      report_date: reportDate,
      total_income: totalIncome,
      total_cost: totalCost,
      commission,
      net_profit: netProfit,
      data,
    });
}
