# Attachments & Vercel Blob — How It Works

## Overview

Attachments (images, PDFs, Word docs) are stored in **Vercel Blob**, not on our server or database. The database only stores metadata (filename, type, size, and the Blob URL). This keeps file bytes off our backend entirely — the frontend uploads directly to Blob using a short-lived token our server issues.

Two separate API calls are involved:

1. **Get an upload token + upload the file bytes** → talks straight to Vercel Blob.
2. **Create the attachment record** → talks to our backend, saves metadata + the Blob URL returned from step 1.

```
Frontend                     Our Backend                  Vercel Blob
   |                              |                              |
   |--- POST /upload-token ----->|                              |
   |                              |--- issues token ------------>|
   |<---------- token ------------|                              |
   |                                                              |
   |------------------- upload file bytes ---------------------->|
   |<------------------------ blob URL ---------------------------|
   |                                                              |
   |--- POST .../attachments (filePath = blob URL) -->|          |
   |<--------------- 201 Attachment record ------------|          |
```

No file bytes ever touch our Express server — `@vercel/blob/client`'s `upload()` helper on the frontend sends bytes directly to Blob's storage.

## Environment setup

Requires `BLOB_READ_WRITE_TOKEN_READ_WRITE_TOKEN` in `backend/.env` (note: this project's Vercel Blob store connection was created with the "Add a read-write token env var" option, which prefixes the var name per-store instead of the plain `BLOB_READ_WRITE_TOKEN` name docs usually show).

```
BLOB_READ_WRITE_TOKEN_READ_WRITE_TOKEN="vercel_blob_rw_xxxxxxxxxxxxx"
```

Get this value from: Vercel dashboard → project → **Storage** tab → your Blob store → `.env.local` / Quickstart tab.

The controller passes this explicitly to `handleUpload()` via the `token` option (`backend/src/controllers/attachmentUpload.controller.ts`) — it does **not** rely on `@vercel/blob`'s default env var name, since that default is `BLOB_READ_WRITE_TOKEN` and ours is prefixed differently.

Blob store access level: **Public** — anyone with the URL can view the file. Fine for our use case (benefit requirement/utilization documents viewed via URL), no signed-read logic needed.

## Backend pieces (already built, no work needed here)

| File | Purpose |
|---|---|
| `backend/src/controllers/attachmentUpload.controller.ts` | Issues the short-lived Blob upload token via `handleUpload()` |
| `backend/src/routes/attachmentUpload.routes.ts` | Route: `POST /api/attachments/upload-token` |
| `backend/src/requests/benefitAttachment.request.ts` | Zod schema + allowed file types for the attachment CRUD |

**Endpoint:** `POST /api/attachments/upload-token`
- Auth: `mockAuth` + `requireRole(CREATE_BENEFIT_ATTACHMENTS)` (SUPERADMIN or AGENT)
- Body: whatever `@vercel/blob/client`'s `upload()` sends automatically (`HandleUploadBody`) — you never construct this by hand
- Enforces same allowlist as attachment CRUD, max size 25MB

**Allowed file types:**
- `image/jpg`, `image/jpeg`, `image/png`, `image/gif`, `image/webp`
- `application/pdf`
- `application/msword` (`.doc`)
- `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (`.docx`)

## Frontend flow (what you build)

### Install

```bash
npm install @vercel/blob
```

### Single file upload

```ts
import { upload } from '@vercel/blob/client';

async function uploadAttachment(file: File, requirementId: string) {
  // Step 1: upload bytes straight to Blob
  const blob = await upload(file.name, file, {
    access: 'public',
    handleUploadUrl: '/api/attachments/upload-token',
  });

  // Step 2: save metadata + blob URL to our backend
  const res = await fetch(`/api/benefits/.../requirements/${requirementId}/attachments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileLabel: file.name,
      fileName: file.name,
      fileType: file.type,      // must match ALLOWED_ATTACHMENT_FILE_TYPES
      filePath: blob.url,       // from step 1
      fileSize: file.size,
    }),
  });

  return res.json();
}
```

### Multiple files at once

The upload-token endpoint and the attachment-create endpoint each handle **one file per call** — there's no batch endpoint. To upload several files, loop and run in parallel:

```ts
async function uploadAttachments(files: File[], requirementId: string) {
  return Promise.all(
    files.map((file) => uploadAttachment(file, requirementId))
  );
}
```

Pair with `<input type="file" multiple>` to let the user pick several files at once, then pass `Array.from(input.files)` into `uploadAttachments`.

## Common pitfalls

- **`400 BLOB_TOKEN_ERROR`** → `BLOB_READ_WRITE_TOKEN_READ_WRITE_TOKEN` missing/wrong in `backend/.env`.
- **`400` zod validation on attachment create** → `fileType` doesn't match the allowlist exactly (must be the full MIME string, not just `"pdf"` or `"image"`).
- **`fileSize` comes back as a string** (e.g. `"204800"`) in API responses — it's a `BigInt` column in Postgres, always JSON-serialized as a string. Don't assume it's a number when reading the response.
- **Don't build a "delete from Blob" flow expecting it to cascade from attachment delete** — attachment delete is a soft delete in our DB; it does not currently delete the underlying Blob object.
