-- Скрипт для добавления чатов вручную
-- Замените XXXXXXXXX на реальные ID ваших бесед
-- ID беседы можно посмотреть в URL: vk.com/im?sel=cXXXXXXXXX
-- peer_id = 2000000000 + ID беседы

-- Удалить старые записи если есть
DELETE FROM chats;

-- Флудилка | Тест
INSERT INTO chats (chat_type, chat_id, chat_name, peer_id)
VALUES ('flood', 'ЗАМЕНИТЕ_НА_РЕАЛЬНЫЙ_ID', 'Флудилка | Тест', 2000000000 + ЗАМЕНИТЕ_НА_ID_БЕСЕДЫ);

-- Старший Состав | Тест  
INSERT INTO chats (chat_type, chat_id, chat_name, peer_id)
VALUES ('senior', 'ЗАМЕНИТЕ_НА_РЕАЛЬНЫЙ_ID', 'Старший Состав | Тест', 2000000000 + ЗАМЕНИТЕ_НА_ID_БЕСЕДЫ);

-- Диспетчерская | Тест
INSERT INTO chats (chat_type, chat_id, chat_name, peer_id)
VALUES ('dispatch', 'ЗАМЕНИТЕ_НА_РЕАЛЬНЫЙ_ID', 'Диспетчерская | Тест', 2000000000 + ЗАМЕНИТЕ_НА_ID_БЕСЕДЫ);

-- Доска Объявлений | Тест
INSERT INTO chats (chat_type, chat_id, chat_name, peer_id)
VALUES ('announcements', 'ЗАМЕНИТЕ_НА_РЕАЛЬНЫЙ_ID', 'Доска Объявлений | Тест', 2000000000 + ЗАМЕНИТЕ_НА_ID_БЕСЕДЫ);

-- Руководство | Тест
INSERT INTO chats (chat_type, chat_id, chat_name, peer_id)
VALUES ('management', 'ЗАМЕНИТЕ_НА_РЕАЛЬНЫЙ_ID', 'Руководство | Тест', 2000000000 + ЗАМЕНИТЕ_НА_ID_БЕСЕДЫ);

-- Учебный Центр | Тест
INSERT INTO chats (chat_type, chat_id, chat_name, peer_id)
VALUES ('training', 'ЗАМЕНИТЕ_НА_РЕАЛЬНЫЙ_ID', 'Учебный Центр | Тест', 2000000000 + ЗАМЕНИТЕ_НА_ID_БЕСЕДЫ);

-- Журнал Активности | Тест
INSERT INTO chats (chat_type, chat_id, chat_name, peer_id)
VALUES ('activity_log', 'ЗАМЕНИТЕ_НА_РЕАЛЬНЫЙ_ID', 'Журнал Активности | Тест', 2000000000 + ЗАМЕНИТЕ_НА_ID_БЕСЕДЫ);

-- Проверка добавленных чатов
SELECT * FROM chats ORDER BY chat_type;
