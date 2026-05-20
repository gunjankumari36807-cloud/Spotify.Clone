<?php
header('Content-Type: application/json');

$file = __DIR__ . '/playlists.json';

// Ensure the data file exists
if (!file_exists($file)) {
    file_put_contents($file, json_encode([]));
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Return playlists JSON
    $data = file_get_contents($file);
    echo $data;
    exit;
}

if ($method === 'POST') {
    // Expect JSON body
    $input = file_get_contents('php://input');
    $payload = json_decode($input, true);

    if (!$payload || !isset($payload['title'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid payload']);
        exit;
    }

    // Load current playlists
    $json = file_get_contents($file);
    $playlists = json_decode($json, true);
    if (!is_array($playlists)) $playlists = [];

    $new = [
        'title' => $payload['title'],
        'artist' => isset($payload['artist']) ? $payload['artist'] : '',
        'cover' => isset($payload['cover']) ? $payload['cover'] : '',
        'audio' => isset($payload['audio']) ? $payload['audio'] : ''
    ];

    $playlists[] = $new;

    // Save back to file (atomic write)
    $tmp = tempnam(sys_get_temp_dir(), 'pl');
    file_put_contents($tmp, json_encode($playlists, JSON_PRETTY_PRINT));
    rename($tmp, $file);

    echo json_encode(['success' => true, 'playlists' => $playlists]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method Not Allowed']);
