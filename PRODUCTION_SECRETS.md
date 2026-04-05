# AzVirt DMS — Production Secrets Reference

> **Rule:** Never commit secrets. Never copy `.env` files to production.
> Set all values below as environment variables on your host/CI platform.

---

## Admin Setup After First Deployment

After setting up your database, you must create an initial admin user:

```bash
# Set credentials securely in the environment
export ADMIN_USERNAME="admin"
export ADMIN_PASSWORD="your_secure_password"

# Run the creation script
npm run create-admin
```

> **Note:** For security, the system enforces a mandatory password change on the first login for admins created this way. This ensures the credentials used during setup do not persist beyond initial access.

---

## How to Apply

### Netlify

Dashboard → Site → Environment variables → Add variable

### Linux / VPS

```bash
export JWT_SECRET="..."    # or write to /etc/environment
```

### GitHub Actions

Settings → Secrets and variables → Actions → New repository secret

---

## Required Variables (server will refuse to start without these)

| Variable | Purpose | How to Get |
| :--- | :--- | :--- |
| `JWT_SECRET` | Signs session cookies — empty = forgeable tokens | `openssl rand -hex 32` |
| `DATABASE_URL` | PostgreSQL connection | Your hosting provider (Neon, Railway, Supabase, etc.) |
| `NODE_ENV` | Must be `production` on prod | Hardcode to `production` |

---

## Application Identity

| Variable | Purpose | Example |
| :--- | :--- | :--- |
| `VITE_APP_ID` | App identifier | `azvirt-dms` |
| `OWNER_OPEN_ID` | OpenID of the first owner/admin user | Set after first login |

---

## Authentication (OAuth / Auth0)

> If using Auth0, all four are required. If using local username/password only, these can be empty.

| Variable | Purpose | Where to Get |
| :--- | :--- | :--- |
| `AUTH0_DOMAIN` | Auth0 tenant domain | Auth0 Dashboard → Application settings |
| `AUTH0_CLIENT_ID` | Auth0 app client ID | Auth0 Dashboard → Application settings |
| `AUTH0_AUDIENCE` | Auth0 API identifier | Auth0 Dashboard → APIs |
| `AUTH0_ISSUER` | Token issuer URL | `https://<AUTH0_DOMAIN>/` |
| `OAUTH_SERVER_URL` | OAuth server base URL | Your OAuth provider or `AUTH0_DOMAIN` |

---

## Safety Flags (Must be `false` in production)

| Variable | Safe Value | Purpose |
| :--- | :--- | :--- |
| `DMS_USE_MOCKS` | `false` | If `true`, runs on fake in-memory data (data lost on restart) |
| `SERVER_ENABLE_DEV_BYPASS` | `false` | If `true`, hardcoded admin creds bypass auth — fatal in prod |

> The startup validator will `throw` and refuse to boot if either is `true` in production.

---

## Email (SendGrid)

| Variable | Purpose | Where to Get |
| :--- | :--- | :--- |
| `SENDGRID_API_KEY` | Authenticates with SendGrid | SendGrid → Settings → API Keys |
| `SENDGRID_FROM_EMAIL` | Sender address (must be verified) | SendGrid → Sender Authentication |
| `SENDGRID_FROM_NAME` | Display name in emails | e.g. `AzVirt DMS` |

---

## SMS (Twilio — optional)

| Variable | Purpose | Where to Get |
| :--- | :--- | :--- |
| `TWILIO_ACCOUNT_SID` | Twilio account identifier | Twilio Console |
| `TWILIO_AUTH_TOKEN` | Twilio auth token | Twilio Console |
| `TWILIO_PHONE_NUMBER` | Outbound SMS number | Twilio Console → Phone Numbers |

---

## Redis

| Variable | Purpose | Example |
| :--- | :--- | :--- |
| `REDIS_URL` | Redis connection string | `redis://:<password>@host:6379` |

> Redis is used for caching. The app degrades gracefully if unavailable,
> but production performance will suffer without it.

---

## Forge / AI (Optional)

| Variable | Purpose |
| :--- | :--- |
| `BUILT_IN_FORGE_API_URL` | Internal Forge API base URL |
| `BUILT_IN_FORGE_API_KEY` | Forge API authentication key |

---

## Pre-Deployment Checklist

- [ ] `JWT_SECRET` set to 64-char random hex (`openssl rand -hex 32`)
- [ ] `DATABASE_URL` points to production PostgreSQL (no `user:password` placeholder)
- [ ] `NODE_ENV=production`
- [ ] `DMS_USE_MOCKS=false`
- [ ] `SERVER_ENABLE_DEV_BYPASS=false`
- [ ] `SENDGRID_API_KEY` configured and sender email verified
- [ ] Redis URL pointing to production Redis instance
- [ ] Auth0 / OAuth credentials set if SSO is enabled
- [ ] Server logs reviewed after first boot — startup validator will list any missed vars
