# Vercel Domain Assignment

Automatic domain provisioning for client websites in Vercel.

---

## Overview

When creating a client with the CLI, the domain `{slug}.neumorstudio.com` is automatically assigned to the corresponding Vercel project based on the client's vertical:

| Vertical | Vercel Project | Business Types |
|----------|---------------|----------------|
| `restaurant` | `web-restaurants` | restaurant, clinic, fitness |
| `peluqueria` | `web-peluquerias` | salon |
| `reformas` | `web-reformas` | repairs, realestate |

---

## Environment Variables

Add to your `.env` file:

```bash
# Required for Vercel domain assignment
VERCEL_TOKEN=your_vercel_api_token

# Optional: for team deployments
VERCEL_TEAM_ID=team_xxxxx
```

### Getting VERCEL_TOKEN

1. Go to [Vercel Account Settings > Tokens](https://vercel.com/account/tokens)
2. Create a new token with scope: `Full Account`
3. Copy the token to your `.env`

### Getting VERCEL_TEAM_ID (if using teams)

```bash
vercel teams ls
# Copy the team ID (starts with team_)
```

---

## Usage

### Basic (interactive)

```bash
pnpm --filter @neumorstudio/cli start
```

The CLI will:
1. Ask for business type
2. Infer the vertical (or ask if VERCEL_TOKEN is set)
3. Create client/website in Supabase
4. Assign domain to Vercel project

### With flags

```bash
# Specify vertical explicitly
pnpm --filter @neumorstudio/cli start -- --vertical=restaurant

# With URL check after creation
pnpm --filter @neumorstudio/cli start -- --vertical=peluqueria --check-url
```

---

## Vercel API Flow

```
┌─────────────────────────────────────────────────────────────┐
│  POST /v10/projects/{project}/domains                       │
│  Body: { "name": "slug.neumorstudio.com" }                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │   verified: true?       │
              └─────────────────────────┘
                   │              │
                  yes             no
                   │              │
                   ▼              ▼
              ┌─────────┐   ┌─────────────────────┐
              │  Done   │   │ Try auto-verify     │
              └─────────┘   │ POST /v9/.../verify │
                            └─────────────────────┘
                                      │
                                      ▼
                            ┌─────────────────────┐
                            │  Still unverified?  │
                            │  Show DNS records   │
                            └─────────────────────┘
```

---

## Expected Output

### Success (verified)

```
✓ Dominio asignado y verificado en web-restaurants

╭───────────────────────────────────────────╮
│ Client ID      │ abc123...               │
│ Website ID     │ def456...               │
│ Domain         │ mi-restaurante.neuro... │
│ Vertical       │ Restaurantes            │
│ Vercel Project │ web-restaurants         │
│ Vercel Status  │ ✓ Assigned & Verified   │
╰───────────────────────────────────────────╯
```

### Success (needs DNS verification)

```
⚠ Dominio asignado pero pendiente de verificación

╭─────────────────────────────────────────────────────╮
│ VERIFICACIÓN DNS REQUERIDA                          │
│                                                     │
│ Añade el siguiente registro DNS:                    │
│                                                     │
│ Tipo:  TXT                                          │
│ Name:  _vercel.mi-restaurante.neumorstudio.com      │
│ Value: vc-domain-verify=abc123...                   │
│                                                     │
│ Después ejecuta:                                    │
│ pnpm cli:create-client --check-url                  │
╰─────────────────────────────────────────────────────╯
```

### Failure

```
✗ Error asignando dominio: Domain already assigned to another project

╭─────────────────────────────────────────────────────╮
│ DOMINIO NO ASIGNADO A VERCEL                        │
│                                                     │
│ Error: Domain already assigned to another project   │
│                                                     │
│ Reintentar manualmente:                             │
│ vercel domains add mi-rest... --scope web-resta...  │
╰─────────────────────────────────────────────────────╯
```

---

## Troubleshooting

### "VERCEL_TOKEN not configured"

Add `VERCEL_TOKEN` to your `.env` file.

### "Invalid VERCEL_TOKEN or insufficient permissions"

1. Verify the token is correct
2. Ensure the token has `Full Account` scope
3. If using teams, ensure VERCEL_TEAM_ID is set

### "Domain already assigned to another project"

The domain is already in use in Vercel:
1. Check which project has it: `vercel domains ls`
2. Remove from old project: `vercel domains rm {domain} --scope {old-project}`
3. Re-run CLI or manually add: `vercel domains add {domain} --scope {new-project}`

### DNS verification fails

1. Wait for DNS propagation (up to 48h, usually minutes)
2. Verify DNS record was added correctly
3. Check with: `dig TXT _vercel.{domain}`
4. Re-verify: `vercel domains verify {domain}`

### Domain works in Vercel but site doesn't load

1. Ensure the Vercel project has a deployment
2. Check that the deployment handles the domain (middleware/routing)
3. Verify DNS is pointing to Vercel: `dig A {domain}`

---

## Manual Commands

```bash
# List domains for a project
vercel domains ls --scope web-restaurants

# Add domain manually
vercel domains add mi-restaurante.neumorstudio.com --scope web-restaurants

# Verify domain
vercel domains verify mi-restaurante.neumorstudio.com

# Remove domain
vercel domains rm mi-restaurante.neumorstudio.com --scope web-restaurants

# Check domain status via API
curl -H "Authorization: Bearer $VERCEL_TOKEN" \
  "https://api.vercel.com/v6/domains/mi-restaurante.neumorstudio.com"
```

---

## Security Notes

- Never commit `VERCEL_TOKEN` to version control
- Use environment-specific tokens (dev/prod)
- Rotate tokens periodically
- The CLI only assigns domains, never deletes
