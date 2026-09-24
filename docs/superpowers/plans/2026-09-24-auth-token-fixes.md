# Auth Token Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the forgot-password account leak, stop reporting success when no reset email was sent, make verification resend cooldown atomic, make registration and its verification token one transaction, and drop the unused `used_at` column.

**Architecture:** Token writes stay in the service-role SQL functions in `supabase/schema.sql`. Routes only decide the HTTP result. Forgot-password returns `{ ok: true }` for an unknown email and for a cooldown, and returns 500 only after a real credentials account was found and the link could not be saved or emailed. Verification resend keeps its 429 because that caller is already logged in. Registration moves the user insert and the first verification token into one function so a token failure rolls the user back.

**Tech Stack:** Nuxt server routes, Supabase service-role RPC, PostgreSQL functions in `supabase/schema.sql`, locale JSON in `app/locales` and `public/locales`.

## Global Constraints

- No new dependencies.
- No automated tests in this plan. Verify with the manual checks at the end of each task.
- User-visible strings go through `t()`. Add every new key to `app/locales/en.json`, `app/locales/el.json`, `public/locales/en.json`, and `public/locales/el.json`.
- Do not set `password_reset_tokens.used_at`. This plan drops that column.
- `EXECUTE` on these functions stays limited to `service_role`.
- Do not push to the remote.
- Do not commit unless the user asks. The commit steps below are for when they do.

## Failure response (decided)

When forgot-password finds a credentials user but cannot store the token or send the email, return **500** and do not leave the new token row in place. Unknown emails and cooldown hits stay **`{ ok: true }`**. A 500 during an outage can distinguish a real account from an unknown one. That is accepted so a person who asked for a reset is not told to check an inbox that will stay empty.

---

### Task 1: Password-reset issue, consume, and drop `used_at`

**Files:**
- Modify: `supabase/schema.sql` (table `password_reset_tokens` around lines 33-43, function `issue_password_reset_token` around lines 329-365, function `consume_password_reset` around lines 367-415)

**Interfaces:**
- Consumes: nothing new
- Produces:
  - `issue_password_reset_token(p_user_id uuid, p_token_hash text, p_expires_at timestamptz, p_cooldown_seconds int) returns boolean` — `false` means cooldown, the existing link stays
  - `consume_password_reset(p_token_hash text, p_password_hash text) returns boolean` — no `used_at` check
  - Column `password_reset_tokens.used_at` is gone

- [ ] **Step 1: Drop `used_at` from the table definition and from existing databases**

In the `create table` for `public.password_reset_tokens`, remove the `used_at timestamptz` line. Immediately after the password-reset indexes, add:

```sql
alter table public.password_reset_tokens drop column if exists used_at;
```

- [ ] **Step 2: Remove `used_at` from `consume_password_reset`**

Delete `and used_at is null` from both the `select user_id` and the later `perform 1 from public.password_reset_tokens`. Leave the user-row lock, the second token check, the password update, and the delete of every reset row for that user.

- [ ] **Step 3: Keep `issue_password_reset_token` as it is**

Do not change its signature or its cooldown behavior. It already locks the user, returns `false` inside the cooldown, and deletes other hashes only after the new row is inserted.

---

### Task 2: Forgot-password returns 500 only when a real send failed

**Files:**
- Modify: `server/api/auth/forgot-password.post.ts`
- Modify: `app/locales/en.json`, `app/locales/el.json`, `public/locales/en.json`, `public/locales/el.json`
- Modify: `CLAUDE.md` (Auth tokens paragraph), `DEV_SETUP.md` (verification and password reset bullet)

**Interfaces:**
- Consumes: `issue_password_reset_token` from Task 1, `sendPasswordResetEmail(to, link)` from `server/utils/email.ts`
- Produces: HTTP behavior below. Locale key `auth.forgotPassword.sendFailed`. Key `auth.forgotPassword.cooldown` removed.

| Situation | Status | Body |
| --- | --- | --- |
| Invalid email | 400 | unchanged |
| IP rate limit | 429 | unchanged (`checkRateLimit`) |
| Unknown email, or provider is not `credentials` | 200 | `{ ok: true }` |
| Credentials user, token issued inside the last 5 minutes | 200 | `{ ok: true }` — do not send another email |
| Credentials user, RPC error | 500 | message `auth.forgotPassword.sendFailed` |
| Credentials user, email send throws | 500 | same message, and the new token row is deleted |
| Credentials user, email accepted by Resend | 200 | `{ ok: true }` |

- [ ] **Step 1: Replace the issue-and-send block in `forgot-password.post.ts`**

Keep the rate limit, email validation, and user lookup. Inside `if (user)`, after building `rawToken`, `tokenHash`, and `expiresAt`:

```ts
const { data: issued, error } = await supabase.rpc('issue_password_reset_token', {
  p_user_id: user.id,
  p_token_hash: tokenHash,
  p_expires_at: expiresAt,
  p_cooldown_seconds: 300,
})

if (error) {
  console.error('[forgot-password]', error.message)
  throw createError({ statusCode: 500, message: 'auth.forgotPassword.sendFailed' })
}

if (issued) {
  const baseUrl = getRequestURL(event).origin
  const resetLink = `${baseUrl}/reset-password?token=${rawToken}`
  try {
    await sendPasswordResetEmail(email, resetLink)
  } catch (e) {
    console.error('[forgot-password]', e)
    const { error: deleteError } = await supabase
      .from('password_reset_tokens')
      .delete()
      .eq('token_hash', tokenHash)
    if (deleteError) {
      console.error('[forgot-password] Failed to roll back token:', deleteError.message)
    }
    throw createError({ statusCode: 500, message: 'auth.forgotPassword.sendFailed' })
  }
}

return { ok: true }
```

`issued === false` falls through to `{ ok: true }`. Do not throw 429 here. `AuthModal.vue` already translates a dotted `data.message` with no spaces, so `auth.forgotPassword.sendFailed` shows as copy. No Vue change.

- [ ] **Step 2: Locales**

Remove `auth.forgotPassword.cooldown` from all four locale files.

Add `sendFailed` next to `rateLimited`:

- en: `"We could not send the reset email. Please try again."`
- el: `"Δεν ήταν δυνατή η αποστολή του email επαναφοράς. Παρακαλώ δοκίμασε ξανά."`

- [ ] **Step 3: Docs**

In `CLAUDE.md` and `DEV_SETUP.md`, state that a cooldown returns success and leaves the current link, and that a failed save or send returns 500 and removes the new token row.

- [ ] **Step 4: Manual check**

With the SQL functions applied: request a reset for an unknown email and for a real user (both 200). Request the real user again within 5 minutes (200, no second email). Break the Resend key, request a real user (500, no token row left, a following request with a valid key can send). Confirm the modal shows the translated `sendFailed` string, not the raw key.

---

### Task 3: Verification cooldown inside `issue_verification_token`

**Files:**
- Modify: `supabase/schema.sql` (`issue_verification_token`, about lines 417-440, and the `revoke` / `grant` lines for that function)
- Modify: `server/api/user/resend-verification.post.ts`
- Modify: `server/api/auth/register.post.ts` (call site only; Task 4 replaces the insert)

**Interfaces:**
- Consumes: nothing new
- Produces: `issue_verification_token(p_user_id uuid, p_token_hash text, p_expires_at timestamptz, p_cooldown_seconds int) returns boolean`
  - `true`: new row inserted, other hashes for that user deleted
  - `false`: a row for that user has `created_at` inside the cooldown; no write
  - exception: user id does not exist

- [ ] **Step 1: Replace the function**

Drop the old 3-argument function so PostgREST does not keep both signatures:

```sql
drop function if exists public.issue_verification_token(uuid, text, timestamptz);

create or replace function public.issue_verification_token(
  p_user_id uuid,
  p_token_hash text,
  p_expires_at timestamptz,
  p_cooldown_seconds int
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  perform 1 from public.users where id = p_user_id for update;
  if not found then
    raise exception 'user missing for verification';
  end if;

  if p_cooldown_seconds > 0 and exists (
    select 1 from public.verification_tokens
    where user_id = p_user_id
      and created_at > now() - (p_cooldown_seconds * interval '1 second')
  ) then
    return false;
  end if;

  insert into public.verification_tokens (user_id, token_hash, expires_at)
  values (p_user_id, p_token_hash, p_expires_at);

  delete from public.verification_tokens
  where user_id = p_user_id
    and token_hash <> p_token_hash;

  return true;
end;
$$;
```

Update the revoke and grant to the 4-argument signature:

```sql
revoke all on function public.issue_verification_token(uuid, text, timestamptz, int) from public, anon, authenticated;
grant execute on function public.issue_verification_token(uuid, text, timestamptz, int) to service_role;
```

Remove the old 3-argument revoke/grant lines.

- [ ] **Step 2: Resend route uses the function result**

In `server/api/user/resend-verification.post.ts`, delete the `recent` lookup (`verification_tokens` select and the `RESEND_COOLDOWN_MS` check). Delete the `RESEND_COOLDOWN_MS` constant.

Call the RPC with `p_cooldown_seconds: 60`. If `tokenError`, log and throw 500 with message `Unable to send verification email`. If `data` is not `true`, throw 429 with message `Please wait before requesting another verification email` (the profile page already maps status 429 to `auth.verification.resendCooldown`). If `true`, send the email as it does now.

Await `sendVerificationEmail`. On throw, delete the row with this `token_hash`, log it, and throw 500 with the same message. That avoids a cooldown with no email.

- [ ] **Step 3: Manual check**

Logged in, unverified: first resend sends one email. A second resend within 60 seconds returns 429 and does not add a token. Two parallel resends result in one winning token. The profile toast shows the cooldown copy.

---

### Task 4: Register the user and the verification token in one transaction

**Files:**
- Modify: `supabase/schema.sql` (new function after `issue_verification_token`)
- Modify: `server/api/auth/register.post.ts`
- Modify: `CLAUDE.md`, `DEV_SETUP.md`

**Interfaces:**
- Consumes: `issue_verification_token(..., p_cooldown_seconds int)` from Task 3
- Produces: `register_credentials_user(p_email text, p_password_hash text, p_name text, p_token_hash text, p_expires_at timestamptz) returns uuid`
  - existing email: `null`, no insert
  - success: new user id, `email_verified` false, provider default `credentials`, one verification token
  - token issue failure: the function raises and the user insert rolls back

- [ ] **Step 1: Add the function and grants**

```sql
create or replace function public.register_credentials_user(
  p_email text,
  p_password_hash text,
  p_name text,
  p_token_hash text,
  p_expires_at timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  if exists (select 1 from public.users where email = p_email) then
    return null;
  end if;

  insert into public.users (email, password_hash, name, email_verified)
  values (p_email, p_password_hash, p_name, false)
  returning id into v_user_id;

  perform public.issue_verification_token(v_user_id, p_token_hash, p_expires_at, 0);

  return v_user_id;
end;
$$;

revoke all on function public.register_credentials_user(text, text, text, text, timestamptz) from public, anon, authenticated;
grant execute on function public.register_credentials_user(text, text, text, text, timestamptz) to service_role;
```

`issue_verification_token` runs in this same transaction. A raise undoes the user insert. Cooldown seconds are `0` because this is the first token.

- [ ] **Step 2: Thin the register route**

Keep rate limit, validation, email normalize, the early `{ ok: true }` when a row with that email already exists, and the password hash. Replace the user insert, the token RPC, and the delete-on-failure block with:

```ts
const rawToken = randomBytes(32).toString('hex')
const tokenHash = hashToken(rawToken)
const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

const { data: userId, error: registerError } = await supabase.rpc('register_credentials_user', {
  p_email: email,
  p_password_hash: passwordHash,
  p_name: name,
  p_token_hash: tokenHash,
  p_expires_at: expiresAt,
})

if (registerError || !userId) {
  console.error('[register]', registerError?.message ?? 'no user id')
  throw createError({ statusCode: 500, message: 'Unable to register user' })
}
```

Wait: an existing email returns `null` with no error. That must stay `{ ok: true }`, not 500. The route already returns `{ ok: true }` when the pre-check finds the email. Inside the RPC, `null` also means the email appeared between the pre-check and the insert. Treat `!userId && !registerError` as `{ ok: true }`. Treat `registerError` as 500.

Then keep the existing `sendVerificationEmail` try/catch that logs and still returns `{ ok: true }`. If that send throws, delete the verification row for `tokenHash` and still return `{ ok: true }`. Registration must not reveal that the address was accepted. The user can register again only if we also delete the user when the email fails — do **not** delete the user. Leave the account, remove the token, and log the send failure. They can sign in and use resend. Returning `{ ok: true }` matches today's register route.

Correct branch:

```ts
if (registerError) {
  console.error('[register]', registerError.message)
  throw createError({ statusCode: 500, message: 'Unable to register user' })
}

if (!userId) {
  return { ok: true }
}
```

- [ ] **Step 3: Docs**

Note `register_credentials_user` next to the other auth functions. Say a token failure rolls the new user back, and a duplicate email returns null.

- [ ] **Step 4: Manual check**

New email creates one user and one verification token, and the email sends. An existing email returns `{ ok: true }` and does not add a user. If the function is missing, the route returns 500, not a user row without a token.

---

### Task 5: Reset-password lookup without `used_at`

**Files:**
- Modify: `server/api/auth/reset-password.post.ts` (the select around lines 24-30)

**Interfaces:**
- Consumes: `consume_password_reset` from Task 1
- Produces: same HTTP results as today (400 invalid or expired, 500 lookup or consume error, 200 `{ ok: true }`)

- [ ] **Step 1: Stop filtering on `used_at`**

Change the select to:

```ts
const { data: row, error: lookupError } = await supabase
  .from('password_reset_tokens')
  .select('user_id')
  .eq('token_hash', tokenHash)
  .gt('expires_at', new Date().toISOString())
  .maybeSingle()
```

Keep this lookup so an invalid token does not run `hashPassword`. `consume_password_reset` remains the only writer.

- [ ] **Step 2: Manual check**

A valid link sets the new password and deletes that user's reset rows. The same link then returns 400. A second unused link for that user, if one existed, is gone after the first success.

---

## Spec coverage

| Review item | Task |
| --- | --- |
| Cooldown 429 reveals the account | Task 2: cooldown returns `{ ok: true }` |
| RPC or email failure reported as success | Task 2: 500, token row removed if the send fails |
| Verification resend race | Task 3: cooldown under the user-row lock |
| Register is two transactions | Task 4: one function |
| `used_at` unused and lookup repeated | Task 1 drops the column; Task 5 drops the filter. The cheap lookup stays so invalid tokens skip bcrypt |
| Tests | Out of scope |

## Deploy note

Apply the whole auth-token block in `supabase/schema.sql` in the Supabase SQL editor before deploying the route changes. The routes call the new signatures. That block deletes reset rows that were only marked used, then drops `used_at`, enables row-level security on both token tables, ensures the verification `token_hash` index, and creates a unique index on `users.email`. It stops if two users share an email. `drop function` for the old `issue_verification_token(uuid, text, timestamptz)` is in that same block.
