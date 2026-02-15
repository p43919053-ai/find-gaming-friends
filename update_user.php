<?php
session_start();
header('Content-Type: application/json');

// Перевірка авторизації
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Не авторизовано']);
    exit;
}

// Отримуємо дані. JS може слати JSON або form-data.
// Перевіримо обидва варіанти.
$newName = '';
if (isset($_POST['new_name'])) {
    $newName = trim($_POST['new_name']);
} else {
    // Якщо прийшов JSON
    $input = json_decode(file_get_contents('php://input'), true);
    if (isset($input['new_name'])) {
        $newName = trim($input['new_name']);
    }
}

if ($newName === '') {
    echo json_encode(['success' => false, 'message' => 'Дані не отримано або пусте ім\'я']);
    exit;
}

$userId = $_SESSION['user_id'];

try {
    // Підключення до БД
    $pdo = new PDO("mysql:host=127.0.0.1;dbname=mywebsite;charset=utf8", "root", "");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // ВАЖЛИВО: Використовуємо зворотні лапки для `user`
    $stmt = $pdo->prepare("UPDATE users SET `user` = ? WHERE id = ?");
    $stmt->execute([$newName, $userId]);

    echo json_encode(['success' => true]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Помилка БД: ' . $e->getMessage()]);
}
?>