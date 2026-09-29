# Cuentas de este repo vs resto

Este proyecto (**cyberpunk-pbta**) usa siempre la cuenta **personal**:

| Servicio | Cuenta |
|----------|--------|
| GitHub   | `ledarpa` · `ledarpa@gmail.com` · remote `git@github.com-ledarpa:ledarpa/cyberpunk-pbta.git` |
| Vercel   | usuario CLI `ledarpa` · team **Darpa** (`darpa2`) · proyecto `cyberpunk-pbta` |
| Neon     | recurso **pbta-db** vía Marketplace Vercel del team Darpa |

El resto de proyectos debe usar por defecto **Crowder**:

| Servicio | Default |
|----------|---------|
| Git      | global `dario-crowder` / `dario@getcrowder.com` |
| GitHub CLI | cuenta activa `dario-crowder` |
| Vercel / Neon | cuenta/team Crowder (`dario@getcrowder.com`) |

## Cómo se sostiene

1. **Git de este repo (local, no global):**
   ```bash
   git config --local user.name ledarpa
   git config --local user.email ledarpa@gmail.com
   ```
2. **Remote SSH** con host alias `github.com-ledarpa` (clave `~/.ssh/id_ed25519_ledarpa`).
3. **Vercel:** `.vercel/project.json` apunta al project/org de Darpa. No borrar ni re-linkear a Crowder.
4. **Neon:** solo via env de este proyecto (`POSTGRES_*` / `DATABASE_URL` en `.env.local`, gitignored).

## Al trabajar acá

```bash
./scripts/use-ledarpa-accounts.sh
```

Eso deja `gh` en `ledarpa` y verifica que `vercel whoami` sea `ledarpa`.

## Al volver a proyectos Crowder

```bash
gh auth switch --user dario-crowder
# Si hiciste vercel login como ledarpa:
# npx vercel login   # con dario@getcrowder.com
```

Opcional: en repos Crowder podés poner un `scripts/use-crowder-accounts.sh` espejo.
