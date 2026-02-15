<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

$host = '127.0.0.1';
$db   = 'mywebsite'; 
$user = 'root';      
$pass = '';          

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
    
    // Получаем ID из сессии
    $userId = $_SESSION['user_id'] ?? null;
    
    // Получаем данные из Fetch-запроса
    $input = json_decode(file_get_contents('php://input'), true);
    $newEmail = $input['email'] ?? null;

    if (!$userId) {
        echo json_encode(['success' => false, 'message' => 'Ви не авторизовані']);
        exit;
    }

    if (!$newEmail) {
        echo json_encode(['success' => false, 'message' => 'Email не вказано']);
        exit;
    }

    // Обновляем колонку secondary_email
    $stmt = $pdo->prepare("UPDATE users SET secondary_email = ? WHERE id = ?");
    $result = $stmt->execute([$newEmail, $userId]);

    echo json_encode(['success' => true]);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Помилка БД: ' . $e->getMessage()]);
}
?>