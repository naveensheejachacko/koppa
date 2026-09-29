# Koppa backend — Phase 1 (admin panel first)

Frontend integrates the **admin panel first**. Public user app (browse, visit, XP) can wait. This doc is the contract for that work.

**Base URL (production):** `https://api.thekoppa.in`  
**Local:** `http://localhost:3000`  
**Prefix:** `/api/v1`  
**Interactive spec:** `/docs` (Swagger) · `/redoc`

---

## 1. Product idea (what Phase 1 proves)

Koppa is a **public cafe discovery** product. Guests browse without login. Registered users later visit cafes, get GPS-verified, earn XP, appear on a weekly leaderboard.

**Phase 1 does not include** vendor accounts, vendor dashboards, or rewards redemption.

**Admin panel exists so Koppa staff can seed the catalog.** Without admin-created cafes (name, address, lat/lng, categories, photos), the public app has nothing to show.

```
Admin creates cafe + media + categories
        ↓
Public catalog (GET /cafes) can list it
        ↓
Later: users visit → backend verifies GPS → XP → leaderboard
```

Vendor rewards are Phase 2. Same `visits` table will be reused then.

---

## 2. Auth (admin panel)

Every `/api/v1/admin/*` route requires:

1. `Authorization: Bearer <access_token>`
2. User `role === "ADMIN"`

| Code | Meaning |
|------|---------|
| 401 | Missing/invalid/expired token |
| 403 | Logged in but not admin |
| 400 | Validation (`{ "error": "...", "details": ... }`) |
| 404 | Not found |
| 409 | Conflict (duplicate, suggestion already reviewed) |

### Login

`POST /api/v1/auth/login`

```json
{ "email": "admin@koppa.local", "password": "ChangeMeAdmin1!" }
```

Response `200`:

```json
{
  "data": {
    "id": "...",
    "email": "admin@koppa.local",
    "name": "Koppa Admin",
    "username": "koppaadmin",
    "profile_image_url": null,
    "role": "ADMIN",
    "total_xp": 0
  },
  "tokens": {
    "access_token": "...",
    "refresh_token": "...",
    "token_type": "Bearer",
    "expires_in": "15m"
  }
}
```

If `data.role !== "ADMIN"`, do not enter the admin app.

Store both tokens. Access token expires (~15m). Refresh:

`POST /api/v1/auth/refresh`  
`{ "refresh_token": "..." }` → new `tokens`.

Logout: `POST /api/v1/auth/logout` with `{ "refresh_token": "..." }` → `204`.

`GET /api/v1/auth/me` — session restore (Bearer required).

Seeded admin exists only if `ADMIN_BOOTSTRAP_*` ran on seed. Change that password after first login.

---

## 3. Admin screen map → APIs

Suggested UI order for first integration:

| Screen | APIs |
|--------|------|
| Login | `POST /auth/login` |
| Dashboard | `GET /admin/dashboard` |
| Categories | `GET/POST /admin/categories`, `PATCH/DELETE /admin/categories/:id` |
| Cafes list | `GET /admin/cafes?page=&limit=&include_deleted=` |
| Cafe create/edit | `POST /admin/cafes`, `GET/PATCH /admin/cafes/:id` |
| Cafe media | `POST /admin/cafes/:id/media` |
| Soft delete / restore | `DELETE /admin/cafes/:id`, `PATCH /admin/cafes/:id/restore` |
| Suggestions inbox | `GET /admin/cafe-suggestions?status=PENDING` |
| Approve / reject | `PATCH /admin/cafe-suggestions/:id` |
| Reviews moderation | `GET /admin/reviews`, `DELETE /admin/reviews/:id` |
| Users (read) | `GET /admin/users` |
| Visits (read) | `GET /admin/visits` |
| XP rules | `GET /admin/xp-rules`, `PATCH /admin/xp-rules` |

Pagination query: `page` (default 1), `limit` (default 20, max 100).  
List responses: `{ "data": [...], "meta": { "page", "limit", "total", "total_pages" } }`.  
Single resource: `{ "data": { ... } }`.  
Writes that are not 201/204 often include `{ "message": "...", "data": ... }`.  
`204` = empty body (delete).

Prisma list rows (users, visits, reviews, suggestions) may still be **camelCase**. Cafe payloads from serialize are **snake_case** (`price_range`, `owner_type`, `cloudinary_url`). Handle both until a later API cleanup.

---

## 4. Dashboard

`GET /api/v1/admin/dashboard`

```json
{
  "data": {
    "total_users": 0,
    "total_cafes": 0,
    "active_cafes": 0,
    "verified_visits": 0,
    "reviews": 0,
    "cafe_suggestions": 0,
    "total_xp_awarded": 0
  }
}
```

---

## 5. Categories

Cafes are many-to-many with categories. Create categories **before** attaching `category_ids` on a cafe.

**Create** `POST /api/v1/admin/categories`

```json
{ "name": "Work", "slug": "work", "sort_order": 0 }
```

`slug` is unique. Public cafe filters use slug (`GET /cafes?category=work`).

**List** `GET /api/v1/admin/categories` → `{ "data": [{ "id", "slug", "name", "sortOrder", ... }] }`

**Patch / delete** `PATCH|DELETE /api/v1/admin/categories/:id`

---

## 6. Cafes (core admin flow)

Public discovery **only** shows cafes with `deletedAt = null`, `isActive = true`, `status = ACTIVE`. Soft-deleted cafes stay in DB (visits/reviews/XP history).

### Create

`POST /api/v1/admin/cafes` → `201`

Required: `name`, `latitude`, `longitude`, `address`, `place`.

```json
{
  "name": "Cafe ABC",
  "description": "Quiet work cafe",
  "latitude": 11.2588,
  "longitude": 75.7804,
  "address": "SM Street",
  "place": "Kozhikode",
  "price_range": "MODERATE",
  "features": ["wifi", "quiet", "power_outlets"],
  "category_ids": ["<uuid from categories>"],
  "status": "ACTIVE"
}
```

`price_range`: `BUDGET` | `MODERATE` | `PREMIUM`  
`status`: `ACTIVE` | `INACTIVE`  
`features`: string tags (match onboarding values when possible: `wifi`, `quiet`, `parking`, …)

Phase 1 server sets `source = ADMIN`, `owner_type = PLATFORM`. Frontend does not send those.

Response `data` includes `id`, `categories[]`, `media[]`, snake_case fields. Save `id` for media upload and edit.

**Lat/lng must be real.** Visit verification later compares user GPS to these coordinates (default radius 120m). Wrong pin = visits never verify.

### List / get / patch

`GET /api/v1/admin/cafes?page=1&limit=20&include_deleted=false`  
`include_deleted=true` to see soft-deleted.

`GET /api/v1/admin/cafes/:id`

`PATCH /api/v1/admin/cafes/:id` — same fields as create, all optional, plus `is_active` (boolean). Sending `category_ids` **replaces** all category links.

### Soft delete / restore

`DELETE /api/v1/admin/cafes/:id` → `204` (sets `deletedAt`, `isActive=false`, `status=INACTIVE`). Cafe disappears from public list.

`PATCH /api/v1/admin/cafes/:id/restore` → cafe live again.

### Media

Upload files to **Cloudinary** in the browser. Then:

`POST /api/v1/admin/cafes/:id/media`

```json
{
  "media_type": "IMAGE",
  "cloudinary_url": "https://res.cloudinary.com/.../image.jpg",
  "public_id": "koppa/cafes/abc",
  "thumbnail_url": "https://res.cloudinary.com/.../thumb.jpg"
}
```

`media_type`: `IMAGE` | `VIDEO`  
API does not accept raw binaries.

---

## 7. Cafe suggestions inbox

Users (later) `POST /cafe-suggestions`. Admin:

`GET /api/v1/admin/cafe-suggestions?page=1&limit=20&status=PENDING`

`status` optional: `PENDING` | `APPROVED` | `REJECTED`.

**Approve / reject** `PATCH /api/v1/admin/cafe-suggestions/:id`

```json
{ "status": "APPROVED", "admin_note": "Looks real" }
```

or `{ "status": "REJECTED", "admin_note": "Duplicate" }`.

**Approve rules:**

- Suggestion must still be `PENDING` (else 409).
- `latitude` and `longitude` required on the suggestion (else 400).
- Backend creates a cafe (`source = SUGGESTION`) and awards suggestion XP to the user (from `xp_rules`, default +20).

Do not create the cafe twice on the frontend.

---

## 8. Reviews, users, visits, XP rules

**Reviews:** `GET /admin/reviews` · `DELETE /admin/reviews/:id` hides/soft-deletes (moderation). `204`.

**Users:** `GET /admin/users` — read-only list (`id`, `email`, `name`, `username`, `role`, `totalXp`, `createdAt`).

**Visits:** `GET /admin/visits` — audit GPS attempts (`verificationStatus` `PENDING` | `VERIFIED` | `REJECTED`).

**XP rules:** `GET /admin/xp-rules`

`PATCH /admin/xp-rules`

```json
{ "action": "NEW_CAFE_VISIT", "xp": 20, "is_active": true }
```

`action`: `NEW_CAFE_VISIT` | `REVISIT` | `CAFE_SUGGESTION`  
Do not hardcode XP in the admin UI; read rules from this API.

---

## 9. Frontend integration notes

- CORS: `CORS_ORIGIN` on the API must include the admin app origin (e.g. `https://admin.thekoppa.in` or localhost). Comma-separated if several.
- Never send `verified`, `xp`, `distance`, or `rank` from the client. Backend owns those (relevant when visit UI is built).
- Admin JWT is the same mechanism as users. Gate the SPA on `role`.
- Health check (no auth): `GET /health` → `{ "status": "ok" }` (not under `/api/v1`).

**Out of scope for this admin slice:** user onboarding, visit GPS, leaderboard UI, public cafe explorer — except that cafes you create here immediately appear on `GET /api/v1/cafes` when active.
