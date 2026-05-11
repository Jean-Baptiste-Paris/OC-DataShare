<?php

/**
 * Script de seed dédié au test de perf k6 : crée un user perf@datashare.fr
 * (s'il n'existe pas), génère un blob random de N Mo sur le storage,
 * insère l'entrée File correspondante en BDD, et imprime le token (UUID v7)
 * sur stdout pour consommation par le scénario k6.
 *
 * Usage :
 *   APP_ENV=test php tests/perf/seed_perf_blob.php [size_mb]
 *
 * Default size_mb = 1.
 *
 * Exemple intégré au runner k6 :
 *   TOKEN=$(APP_ENV=test php tests/perf/seed_perf_blob.php 1)
 *   k6 run -e TOKEN="$TOKEN" tests/perf/download.k6.js
 */

require __DIR__ . '/../bootstrap.php';

use App\Entity\File;
use App\Entity\User;
use App\Kernel;

$kernel = new Kernel($_SERVER['APP_ENV'] ?? 'dev', (bool) ($_SERVER['APP_DEBUG'] ?? true));
$kernel->boot();
$container = $kernel->getContainer();
$em = $container->get('doctrine')->getManager();

$sizeMb = isset($argv[1]) ? max(1, (int) $argv[1]) : 1;
$sizeBytes = $sizeMb * 1024 * 1024;
$storageRoot = $container->getParameter('kernel.project_dir') . '/' . str_replace(
    '%kernel.project_dir%/',
    '',
    'var/storage_test',
);

// 1. User perf : créer si inexistant.
$user = $em->getRepository(User::class)->findOneBy(['email' => 'perf@datashare.fr']);
if (!$user) {
    $user = new User();
    $user->setEmail('perf@datashare.fr');
    $user->setPassword(password_hash('plainPassword', PASSWORD_ARGON2ID));
    $em->persist($user);
    $em->flush();
    fwrite(STDERR, "Created perf user: perf@datashare.fr\n");
}

// 2. Blob random sur le storage (clé sharded comme en prod).
$storageKey = sprintf(
    'perf/%s/%s.bin',
    date('Y/m'),
    \Symfony\Component\Uid\Uuid::v7()->toRfc4122(),
);
$absolutePath = $storageRoot . '/' . $storageKey;
if (!is_dir(dirname($absolutePath))) {
    mkdir(dirname($absolutePath), 0755, true);
}

$dest = fopen($absolutePath, 'wb');
if ($dest === false) {
    fwrite(STDERR, "Cannot open destination $absolutePath\n");
    exit(1);
}
// Stream-write par chunks pour ne pas charger tout en RAM.
$chunkSize = 256 * 1024; // 256 Ko
$bytesWritten = 0;
while ($bytesWritten < $sizeBytes) {
    $remaining = $sizeBytes - $bytesWritten;
    $chunk = random_bytes(min($chunkSize, $remaining));
    fwrite($dest, $chunk);
    $bytesWritten += strlen($chunk);
}
fclose($dest);
fwrite(STDERR, "Wrote $sizeMb Mo blob at $storageKey\n");

// 3. Entrée File en BDD.
$file = new File(
    user: $user,
    name: sprintf('perf_%dmb.bin', $sizeMb),
    sizeBytes: $sizeBytes,
    mimeType: 'application/octet-stream',
    storageKey: $storageKey,
);
$em->persist($file);
$em->flush();

// 4. Output : le UUID (qui sert de share-token public).
echo $file->getId()->toRfc4122() . PHP_EOL;
