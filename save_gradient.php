<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Not authorized']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$userId = $_SESSION['user_id'];
$colorLeft = $input['color_left'] ?? '#222222';
$colorRight = $input['color_right'] ?? '#000000';

try {
    $pdo = new PDO("mysql:host=127.0.0.1;dbname=mywebsite;charset=utf8", "root", "");
    $stmt = $pdo->prepare("UPDATE users SET grad_color_left = ?, grad_color_right = ? WHERE id = ?");
    $stmt->execute([$colorLeft, $colorRight, $userId]);
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}