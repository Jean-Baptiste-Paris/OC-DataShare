# Index composite pour listes filtrées par utilisateur (et triées)

> Note technique transversale, applicable au-delà de DataShare.
> Repérée et documentée pendant la conception de l'historique US05.

## Le pattern à reconnaître

Une requête de la forme :

```sql
SELECT * FROM <table>
WHERE <fk_user> = ?
ORDER BY <created_at> DESC
LIMIT N
```

C'est **le pattern le plus fréquent** des UI « mes éléments » : « mes commandes », « mes documents », « mes notifications », « mon historique ». Tout ce qui vit dans un *espace utilisateur* et liste son contenu chronologiquement.

## Sans index dédié — ce qui se passe

PostgreSQL (et MySQL) doivent :

1. **Full table scan** sur `<table>` — toutes les lignes lues, tout user confondu.
2. **Filter** : ne garder que celles où `fk_user = ?`.
3. **Sort** : trier en mémoire par `created_at DESC`.
4. **Limit** : prendre les N premières.

Coût : `O(N_lignes_total)`. Ça tient à 100 lignes, ça souffre à 100 000, ça meurt à 10 millions.

## Avec un index `(fk_user, created_at DESC)` — ce qui change

Postgres lit l'index :

1. **Lookup B-tree** sur `fk_user = ?` — O(log N) accès direct au sous-arbre du user.
2. **Lit séquentiellement** les entrées dans cet sous-arbre, déjà triées par `created_at DESC`.
3. **Limit N** atteint après N reads.

Coût : `O(log N + N_results)`. Insensible à la taille totale de la table — seulement aux lignes que tu lis vraiment.

## Si l'on a un soft-delete (cas non retenu en MVP DataShare)

Si on filtre aussi sur `deleted_at IS NULL`, **un index partiel** est encore plus efficace :

```sql
CREATE INDEX idx_files_user_created_active
  ON files (user_id, created_at DESC)
  WHERE deleted_at IS NULL;
```

L'index ne contient **que** les lignes actives → plus petit, plus rapide. Postgres et MySQL 8+ supportent les index partiels.

## Comment détecter ce besoin sur un projet existant

### En PostgreSQL

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM files WHERE user_id = '...' ORDER BY created_at DESC LIMIT 50;
```

Ce qu'on cherche dans le plan :
- ❌ `Seq Scan on files` → full scan, mauvais signe sur grosse table
- ❌ `Sort Method: external merge` → tri sur disque, lent
- ✅ `Index Scan using <index_name>` → lecture directe par index
- ✅ `Index Scan ... ORDER BY ... DESC` → tri implicite par l'index, pas de tri en mémoire

### En Django

```python
# settings.py — log les requêtes lentes en dev
LOGGING = {
    'loggers': {
        'django.db.backends': {'level': 'DEBUG', 'handlers': ['console']},
    },
}

# Ou avec django-debug-toolbar : panel SQL → repérer les requêtes répétées sans index.
```

Détection programmatique des index manquants :
- Lister les `ForeignKey` du modèle.
- Pour chaque vue qui fait `.filter(fk=...)` + `.order_by(...)`, vérifier qu'un `Meta.indexes = [models.Index(fields=['fk', '-created_at'])]` correspond.
- Outil tiers : `django-perf-rec`, `nplusone`, ou un linter custom AST-based.

## La règle pratique

> **Toute foreign key qui sert à filtrer dans une UI utilisateur, combinée à un `ORDER BY` chronologique, mérite un index composite `(fk, ordering_column DESC)`.**

C'est gratuit en complexité (une ligne de migration), c'est exponentiel en gain quand la table grossit.

## Référence dans DataShare

Voir entité `File` du modèle de domaine : index `(user_id, created_at DESC)` justifié par la requête de l'US05 (historique d'un user trié par date d'envoi). Cf. `docs/conception/modele-domaine.md`.
