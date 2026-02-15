<?php
session_start();
header('Content-Type: application/json');

$host = '127.0.0.1';
$db   = 'mywebsite'; 
$user = 'root';      
$pass = '';          

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
    
    $userId = $_SESSION['user_id'] ?? null;
    $input = json_decode(file_get_contents('php://input'), true);

    if ($userId && isset($input['day'], $input['month'], $input['year'])) {
        // Формуємо дату у форматі YYYY-MM-DD для SQL
        $dateString = "{$input['year']}-{$input['month']}-{$input['day']}";
        
        $stmt = $pdo->prepare("UPDATE users SET birthday = ? WHERE id = ?");
        $stmt->execute([$dateString, $userId]);
        
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Дані не повні']);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>