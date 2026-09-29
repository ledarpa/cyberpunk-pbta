# Auth + fichas (ops)

## 1. Neon Postgres (una vez)

1. Aceptar términos: https://vercel.com/darpa2/~/integrations/accept-terms/neon?source=cli
2. Desde la raíz del repo:

```bash
npx vercel install neon --name pbta-db --plan free_v3 -m region=iad1 -m auth=false -e production -e preview -e development
npx vercel env pull .env.local
```

3. Aplicar schema:

```bash
# Con POSTGRES_URL o DATABASE_URL en .env.local
npx dotenv -e .env.local -- psql "$POSTGRES_URL" -f sql/schema.sql
# o desde el SQL editor de Neon pegando sql/schema.sql
```

Si Vercel solo crea `DATABASE_URL` / `POSTGRES_URL` / `DATABASE_URL_UNPOOLED`, el código usa `@vercel/postgres` que lee `POSTGRES_URL`. Si solo hay `DATABASE_URL`, agregá:

```bash
printf '%s' "$DATABASE_URL" | npx vercel env add POSTGRES_URL production
# (y preview / development)
```

## 2. JWT

`JWT_SECRET` ya se puede setear con:

```bash
openssl rand -hex 32 | npx vercel env add JWT_SECRET production
```

## 3. Deploy

```bash
npx vercel deploy --prod --yes
```

## 4. Dev local

El `python3 -m http.server` **solo** sirve el manual: **no** soporta `POST /api/*`
(error típico: `Unsupported method ('POST')`).

Para auth + fichas en local:

```bash
./scripts/dev.sh
# o: npx vercel env pull .env.local && npx vercel dev --listen 9876
```

Abrí **http://127.0.0.1:9876**. En producción: **https://cyberpunk-pbta.vercel.app**.

## 5. Resetear / cambiar password de un jugador (admin)

Neon no tiene “forgot password” de la app: las cuentas viven en la tabla `users`.
Como admin del proyecto podés cambiar la clave **directo**:

```bash
npx vercel env pull .env.local
node scripts/reset-player-password.js <username> <nueva_password>
```

Ejemplo: `node scripts/reset-player-password.js neo secreto99`

También desde el SQL Editor de Neon (generá el hash con el script o Node):

```sql
UPDATE users
SET password_hash = '<bcrypt_hash>'
WHERE username = 'neo';
```
