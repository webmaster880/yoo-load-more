<?php

declare(strict_types=1);

$root = dirname(__DIR__);
$expected = (string) ($argv[1] ?? '');
if (!preg_match('/^[0-9]+\.[0-9]+\.[0-9]+$/', $expected)) {
    fwrite(STDERR, "Usage: php bin/check-version.php X.Y.Z\n");
    exit(1);
}

$plugin = (string) file_get_contents($root . '/yoo-load-more.php');
$block = json_decode((string) file_get_contents($root . '/blocks/load-more/block.json'), true, 512, JSON_THROW_ON_ERROR);
$readme = (string) file_get_contents($root . '/readme.txt');

$checks = [
    'plugin header' => preg_match('/^\s*\*\s*Version:\s*' . preg_quote($expected, '/') . '\s*$/m', $plugin) === 1,
    'plugin constant' => strpos($plugin, "define('YOO_LOAD_MORE_VERSION', '{$expected}');") !== false,
    'block.json' => ($block['version'] ?? '') === $expected,
    'readme Stable tag' => preg_match('/^Stable tag:\s*' . preg_quote($expected, '/') . '\s*$/mi', $readme) === 1,
];

$failed = array_keys(array_filter($checks, static function (bool $valid): bool {
    return !$valid;
}));

if ($failed) {
    fwrite(STDERR, 'Version mismatch: ' . implode(', ', $failed) . ".\n");
    exit(1);
}

fwrite(STDOUT, "Version metadata is synchronized at {$expected}.\n");

