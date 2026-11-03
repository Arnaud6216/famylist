<?php
header('Content-Type: application/json; charset=utf-8');

echo json_encode([
    'status' => 'ok',
    'message' => 'Famylist Docker environment is running successfully!',
    'php_version' => PHP_VERSION,
    'timestamp' => date('c'),
], JSON_PRETTY_PRINT);
