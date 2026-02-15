<?php
session_start();
header('Content-Type: application/json');

// 1. Перевірка авторизації
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Не авторизовано']);
    exit;
}

// 2. Отримання даних (JSON)
$inputJSON = file_get_contents('php://input');
$input = json_decode($inputJSON, true);

// Якщо прийшов пустий масив або null, робимо пустий масив
$badges = $input['badges'] ?? [];

// 3. Валідація
if (!is_array($badges)) {
    echo json_encode(['success' => false, 'message' => 'Дані мають бути масивом']);
    exit;
}

if (count($badges) > 5) {
    echo json_encode(['success' => false, 'message' => 'Максимум 5 бейджів']);
    exit;
}

try {
    // 4. Перетворення масиву в рядок (vip,admin,verified)
    // Якщо масив пустий, буде просто пустий рядок ""
    $badgesString = implode(',', $badges);
    
    // Якщо нічого не вибрано, записуємо NULL (щоб економити місце), або пустий рядок
    if (empty($badgesString)) {
        $badgesString = null;
    }

    // 5. Запис у БД
    $pdo = new PDO("mysql:host=127.0.0.1;dbname=mywebsite;charset=utf8", "root", "");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $stmt = $pdo->prepare("UPDATE users SET badges = ? WHERE id = ?");
    $stmt->execute([$badgesString, $_SESSION['user_id']]);

    echo json_encode(['success' => true, 'saved_string' => $badgesString]);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Помилка БД: ' . $e->getMessage()]);
}
?>