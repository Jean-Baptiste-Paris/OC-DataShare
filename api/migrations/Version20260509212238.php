<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260509212238 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create files table (US01 — upload de fichiers)';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE files (id UUID NOT NULL, name VARCHAR(255) NOT NULL, size_bytes BIGINT NOT NULL, mime_type VARCHAR(255) NOT NULL, storage_key VARCHAR(500) NOT NULL, created_at TIMESTAMP(0) WITH TIME ZONE NOT NULL, updated_at TIMESTAMP(0) WITH TIME ZONE NOT NULL, deleted_at TIMESTAMP(0) WITH TIME ZONE DEFAULT NULL, user_id UUID DEFAULT NULL, PRIMARY KEY (id), CONSTRAINT files_size_check CHECK (size_bytes > 0 AND size_bytes <= 1073741824))');
        $this->addSql('CREATE INDEX idx_files_user_created_at ON files (user_id, created_at DESC)');
        $this->addSql('ALTER TABLE files ADD CONSTRAINT FK_6354059A76ED395 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL NOT DEFERRABLE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE files DROP CONSTRAINT FK_6354059A76ED395');
        $this->addSql('DROP TABLE files');
    }
}
