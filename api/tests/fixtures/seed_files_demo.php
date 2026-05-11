<?php

/**
 * Script de seed re-exécutable pour la passe UI locale : crée un user (s'il
 * n'existe pas) et insère des fichiers de démonstration. À relancer après
 * chaque `npx cypress run` qui aura wipé `datashare_test` via les endpoints de reset.
 *
 * Usage :
 *   APP_ENV=test php tests/fixtures/seed_files_demo.php [email] [password]
 *
 * Defaults : email=demo@datashare.fr, password=plainPassword.
 *
 * Note : les blobs ne sont PAS écrits sur le storage — la liste s'affiche
 * correctement, mais le download des fichiers seedés retournera 404 du blob.
 * C'est intentionnel pour la passe UI.
 */

require __DIR__ . '/../bootstrap.php';

use App\Entity\File;
use App\Entity\User;
use App\Kernel;

$kernel = new Kernel($_SERVER['APP_ENV'] ?? 'dev', (bool) ($_SERVER['APP_DEBUG'] ?? true));
$kernel->boot();
$container = $kernel->getContainer();
$em = $container->get('doctrine')->getManager();

$email = $argv[1] ?? 'demo@datashare.fr';
$password = $argv[2] ?? 'plainPassword';

$user = $em->getRepository(User::class)->findOneBy(['email' => $email]);
if (!$user) {
    // Hash via PHP natif (Argon2id) — compatible avec le PasswordHasher Symfony
    // qui vérifie via password_verify(). Pas besoin du service hasher (non public).
    $user = new User();
    $user->setEmail($email);
    $user->setPassword(password_hash($password, PASSWORD_ARGON2ID));
    $em->persist($user);
    $em->flush();
    echo "Created user: $email (password: $password)\n";
} else {
    echo "Reusing existing user: $email\n";
}

echo "Seeding files for user: {$user->getEmail()}\n";

/** @var array<int, array{name: string, sizeBytes: int, mimeType: string, daysAgo: int, deleted: bool}> $fixtures */
$fixtures = [
    ['name' => 'IMG_9210_vacances_ardeche.jpg', 'sizeBytes' => 2_650_000,  'mimeType' => 'image/jpeg',                                                       'daysAgo' => 0,  'deleted' => false],
    ['name' => 'compo2.mp3',                    'sizeBytes' => 8_200_000,  'mimeType' => 'audio/mpeg',                                                       'daysAgo' => 1,  'deleted' => false],
    ['name' => 'rapport_q1_2026.pdf',           'sizeBytes' => 1_120_000,  'mimeType' => 'application/pdf',                                                  'daysAgo' => 3,  'deleted' => false],
    ['name' => 'notes_reunion.txt',             'sizeBytes' => 4_812,      'mimeType' => 'text/plain',                                                       'daysAgo' => 5,  'deleted' => false],
    ['name' => 'export_clients.csv',            'sizeBytes' => 218_440,    'mimeType' => 'text/csv',                                                         'daysAgo' => 7,  'deleted' => false],
    ['name' => 'demo_produit.mov',              'sizeBytes' => 84_500_000, 'mimeType' => 'video/quicktime',                                                  'daysAgo' => 12, 'deleted' => true],
    ['name' => 'archive_anciens_projets.zip',   'sizeBytes' => 152_000_000,'mimeType' => 'application/zip',                                                  'daysAgo' => 20, 'deleted' => true],
];

$created = 0;
foreach ($fixtures as $fx) {
    $file = new File(
        user: $user,
        name: $fx['name'],
        sizeBytes: $fx['sizeBytes'],
        mimeType: $fx['mimeType'],
        storageKey: sprintf('demo/%s.bin', bin2hex(random_bytes(8))),
    );

    // Backdate via reflection (createdAt + updatedAt sont posés dans le ctor).
    $createdAt = new DateTimeImmutable(sprintf('-%d days', $fx['daysAgo']));
    foreach (['createdAt', 'updatedAt'] as $field) {
        (new ReflectionProperty($file, $field))->setValue($file, $createdAt);
    }

    if ($fx['deleted']) {
        $file->markDeleted();
    }

    $em->persist($file);
    $created++;
    $marker = $fx['deleted'] ? '[deleted]' : '[available]';
    echo "  $marker {$fx['name']} ({$fx['mimeType']})\n";
}

$em->flush();
echo "Done. $created files inserted.\n";
