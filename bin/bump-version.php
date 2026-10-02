<?php

declare(strict_types=1);

$root = dirname(__DIR__);
$level = strtolower(trim((string) ($argv[1] ?? 'patch')));

if (!in_array($level, ['patch', 'minor', 'major'], true)) {
    fwrite(STDERR, "Usage: php bin/bump-version.php [patch|minor|major]\n");
    exit(1);
}

$pluginFile = $root . '/yoo-load-more.php';
$plugin = file_get_contents($pluginFile);
if ($plugin === false) {
    fwrite(STDERR, "Unable to read {$pluginFile}.\n");
    exit(1);
}

if (!preg_match('/^\s*\*\s*Version:\s*([0-9]+)\.([0-9]+)\.([0-9]+)/m', $plugin, $matches)) {
    fwrite(STDERR, "Unable to locate the plugin header version.\n");
    exit(1);
}

$major = (int) $matches[1];
$minor = (int) $matches[2];
$patch = (int) $matches[3];

if ($level === 'major') {
    $major++;
    $minor = 0;
    $patch = 0;
} elseif ($level === 'minor') {
    $minor++;
    $patch = 0;
} else {
    $patch++;
}

$newVersion = sprintf('%d.%d.%d', $major, $minor, $patch);
$updates = [];

$updatedPlugin = preg_replace(
    '/^(\s*\*\s*Version:\s*)[0-9]+\.[0-9]+\.[0-9]+/m',
    '${1}' . $newVersion,
    $plugin,
    1,
    $headerCount
);
$updatedPlugin = preg_replace(
    "/define\('YOO_LOAD_MORE_VERSION',\s*'[0-9]+\.[0-9]+\.[0-9]+'\);/",
    "define('YOO_LOAD_MORE_VERSION', '{$newVersion}');",
    (string) $updatedPlugin,
    1,
    $constantCount
);

if ($headerCount !== 1 || $constantCount !== 1 || !is_string($updatedPlugin)) {
    fwrite(STDERR, "Unable to update both plugin version declarations.\n");
    exit(1);
}
$updates[$pluginFile] = $updatedPlugin;

$blockFile = $root . '/blocks/load-more/block.json';
$block = json_decode((string) file_get_contents($blockFile), true, 512, JSON_THROW_ON_ERROR);
$block['version'] = $newVersion;
$updates[$blockFile] = json_encode($block, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . "\n";

$readmeFile = $root . '/readme.txt';
$readme = file_get_contents($readmeFile);
$updatedReadme = preg_replace(
    '/^(Stable tag:\s*)[0-9]+\.[0-9]+\.[0-9]+/mi',
    '${1}' . $newVersion,
    (string) $readme,
    1,
    $stableTagCount
);
if ($readme === false || $stableTagCount !== 1 || !is_string($updatedReadme)) {
    fwrite(STDERR, "Unable to update the readme.txt Stable tag.\n");
    exit(1);
}
$updates[$readmeFile] = $updatedReadme;

foreach ($updates as $file => $content) {
    if (file_put_contents($file, $content) === false) {
        fwrite(STDERR, "Unable to write {$file}.\n");
        exit(1);
    }
}

fwrite(STDOUT, "Version updated to {$newVersion}.\n");

