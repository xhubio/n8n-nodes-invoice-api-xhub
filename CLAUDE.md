# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

n8n community node package (`n8n-nodes-invoice-api-xhub`) for the invoice-api.xhub E-Invoice API (v1.3). Provides generate, parse, parse-auto-detect, validate, and get-formats operations for e-invoices across 14 European countries with 18+ formats.

## Commands

```bash
pnpm install          # Install dependencies
pnpm build            # tsc + gulp build:icons (copies SVGs to dist/)
pnpm dev              # tsc --watch
pnpm test             # Jest
pnpm test -- test/InvoiceXhub.test.ts   # Single test file
pnpm lint             # ESLint (uses eslint-plugin-n8n-nodes-base)
pnpm lint:fix         # Auto-fix lint issues
pnpm format           # Prettier
```

## Architecture

### Node Structure (n8n pattern)

```
InvoiceXhub.node.ts          # INodeType entry point - routes operations via switch
  └─ actions/
       ├─ index.ts            # Re-exports all operations
       ├─ generate.operation.ts
       ├─ parse.operation.ts
       ├─ parseAutoDetect.operation.ts
       ├─ validate.operation.ts
       └─ formats.operation.ts
```

Each operation file exports:
- `description: INodeProperties[]` — UI field definitions (spread into main node's `properties`)
- `execute(items): INodeExecutionData[]` — called with `this` bound to `IExecuteFunctions`

### Shared Layer

- **`shared/GenericFunctions.ts`** — API request wrapper (`invoiceXhubApiRequest`), typed operation helpers (`generateInvoice`, `parseInvoice`, `parseInvoiceAutoDetect`, `validateInvoice`, `getAllFormats`, `getCountryFormats`), binary conversion utilities, `buildErrorMessage()`. Exports `DetectionResult`, `QuotaInfo`, and `InvoiceXhubApiResponse` interfaces.
- **`shared/constants.ts`** — `SUPPORTED_COUNTRIES`, `COUNTRY_OPTIONS`, `E_INVOICE_FORMATS`, `FORMAT_OPTIONS`, `COUNTRY_FORMATS` mapping (local superset — authoritative list from `/formats` endpoint), MIME types, file extensions

### Credentials

`credentials/InvoiceXhubApi.credentials.ts` — Bearer token auth with configurable base URL. Credential test hits `GET /api/v1/invoice/formats`.

### API Endpoints (v1)

All endpoints use the `/api/v1/invoice` prefix (constant `API_PREFIX` in GenericFunctions.ts).

| Operation        | Method | Endpoint |
|------------------|--------|----------|
| Generate         | POST   | `/api/v1/invoice/{COUNTRY}/{format}/generate` |
| Parse            | POST   | `/api/v1/invoice/{COUNTRY}/{format}/parse` |
| Parse Auto-Detect| POST   | `/api/v1/invoice/parse` |
| Validate         | POST   | `/api/v1/invoice/{COUNTRY}/validate` |
| Formats          | GET    | `/api/v1/invoice/formats` or `/api/v1/invoice/{COUNTRY}/formats` |

### Key Patterns

- All operations iterate `items` and support `continueOnFail()` for error resilience
- Generate outputs binary data (base64 → Buffer → `prepareBinaryData`) by default
- Parse accepts binary input or base64 string, converts to base64 for API
- Parse Auto-Detect requires no country/format selection — returns `detection` object with `detectedFormat`, `detectedCountry`, `confidence`
- Validate uses `response.valid` (with fallback to `response.errors` count / `response.success`) to determine validity
- `displayOptions.show.operation` controls which fields appear per operation in the n8n UI
- `buildErrorMessage()` includes quota info when `response.quota` is present (429 responses)
- Operation options in the node dropdown must be **alphabetically sorted** (enforced by `n8n-nodes-base` lint rule)

## Code Style

- **Prettier**: Semicolons, single quotes, tabs, 100 char width, trailing commas (all)
- **ESLint**: TypeScript-ESLint + `eslint-plugin-n8n-nodes-base` (nodes + credentials rules)
- Unused vars with `_` prefix are allowed
- TypeScript strict mode, ES2022 target, CommonJS modules

## Testing

- **Framework**: Jest with ts-jest
- Test files in `test/` matching `**/test/**/*.test.ts`
- Test fixture: `test/invoice.json` (sample invoice data)

## Local n8n Testing

```bash
pnpm build
cd ~/.n8n/custom
npm link /path/to/n8n-nodes-invoice-xhub
```
