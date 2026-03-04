# API Reference - invoice-api.xhub

Complete API documentation for the invoice-api.xhub E-Invoice API.

## Table of Contents

- [Authentication](#authentication)
- [Base URL](#base-url)
- [Endpoints](#endpoints)
  - [Generate Invoice](#generate-invoice)
  - [Parse Invoice](#parse-invoice)
  - [Parse Auto-Detect](#parse-auto-detect)
  - [Validate Invoice](#validate-invoice)
  - [Get Formats](#get-formats)
  - [Get Country Formats](#get-country-formats)
- [Request/Response Schemas](#requestresponse-schemas)
- [Error Codes](#error-codes)
- [Rate Limits](#rate-limits)

---

## Authentication

All API requests require a Bearer Token in the Authorization header.

### Header Format

```http
Authorization: Bearer sk_live_xxxxxxxxxxxxxxxxxxxx
```

### API Key Types

| Type | Prefix | Usage |
|------|--------|-------|
| Production | `sk_live_` | Live environment, real invoices |
| Test/Sandbox | `sk_test_` | Development and testing |

### Example Request

```bash
curl -X POST https://service.invoice-api.xhub.io/api/v1/invoice/DE/xrechnung/generate \
  -H "Authorization: Bearer sk_live_xxxxxxxxxxxxxxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{"invoice": {...}}'
```

---

## Base URL

| Environment | URL |
|-------------|-----|
| Production | `https://service.invoice-api.xhub.io` |
| Sandbox | `https://sandbox.api.invoice-api.xhub.io` |

---

## Endpoints

### Generate Invoice

Creates an e-invoice in the desired format.

```
POST /api/v1/invoice/{countryCode}/{format}/generate
```

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `countryCode` | string | ISO 3166-1 Alpha-2 country code (DE, AT, CH, etc.) |
| `format` | string | Target format (xrechnung, zugferd, pdf, etc.) |

#### Request Body

```json
{
  "invoice": {
    "invoiceNumber": "string (required)",
    "invoiceDate": "string (YYYY-MM-DD, required)",
    "dueDate": "string (YYYY-MM-DD, optional)",
    "seller": {
      "name": "string (required)",
      "address": {
        "street": "string (required)",
        "city": "string (required)",
        "postalCode": "string (required)",
        "country": "string (ISO 3166-1, required)"
      },
      "vatId": "string (required)",
      "email": "string (optional)",
      "phone": "string (optional)",
      "bankAccount": {
        "iban": "string (optional)",
        "bic": "string (optional)",
        "bankName": "string (optional)"
      }
    },
    "buyer": {
      "name": "string (required)",
      "address": {
        "street": "string (required)",
        "city": "string (required)",
        "postalCode": "string (required)",
        "country": "string (ISO 3166-1, required)"
      },
      "vatId": "string (optional)",
      "email": "string (optional)"
    },
    "lineItems": [
      {
        "position": "number (optional)",
        "description": "string (required)",
        "quantity": "number (required)",
        "unit": "string (UN/ECE Rec. 20, required)",
        "unitPrice": "number (required)",
        "vatRate": "number (required, percentage)",
        "vatAmount": "number (optional, calculated)",
        "lineTotal": "number (optional, calculated)"
      }
    ],
    "currency": "string (ISO 4217, required)",
    "subtotal": "number (optional, calculated)",
    "totalVat": "number (optional, calculated)",
    "total": "number (required)",
    "paymentTerms": "string (optional)",
    "notes": "string (optional)",
    "buyerReference": "string (optional, Leitweg-ID for B2G)"
  },
  "formatOptions": {
    "profile": "string (optional: basic, comfort, extended)",
    "pdfVersion": "string (optional: PDF/A-3b)",
    "embedXml": "boolean (optional, default: true for ZUGFeRD)"
  }
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "format": "xrechnung",
  "filename": "invoice-INV-2025-001.xml",
  "mimeType": "application/xml",
  "hash": "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "data": "PD94bWwgdmVyc2lvbj0iMS4wIi4uLg==",
  "warnings": [
    {
      "code": "W001",
      "message": "Payment terms recommended",
      "field": "paymentTerms"
    }
  ]
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether generation was successful |
| `format` | string | Format used |
| `filename` | string | Recommended filename |
| `mimeType` | string | MIME type of the document |
| `hash` | string | SHA-256 hash of the document |
| `data` | string | Base64-encoded document |
| `warnings` | array | List of warnings |

---

### Parse Invoice

Extracts invoice data from an e-invoice document.

```
POST /api/v1/invoice/{countryCode}/{format}/parse
```

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `countryCode` | string | Expected country code |
| `format` | string | Expected format |

#### Request Body

```json
{
  "data": "PD94bWwgdmVyc2lvbj0iMS4wIi4uLg==",
  "filename": "invoice.xml"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `data` | string | Yes | Base64-encoded document |
| `filename` | string | No | Filename hint |

#### Response (200 OK)

```json
{
  "success": true,
  "format": "xrechnung",
  "hash": "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "invoice": {
    "invoiceNumber": "INV-2025-001",
    "invoiceDate": "2025-01-15",
    "dueDate": "2025-02-14",
    "seller": {
      "name": "ACME GmbH",
      "address": {
        "street": "Hauptstraße 1",
        "city": "Berlin",
        "postalCode": "10115",
        "country": "DE"
      },
      "vatId": "DE123456789"
    },
    "buyer": {
      "name": "Customer AG",
      "address": {
        "street": "Nebenstraße 2",
        "city": "München",
        "postalCode": "80331",
        "country": "DE"
      },
      "vatId": "DE987654321"
    },
    "lineItems": [
      {
        "position": 1,
        "description": "Consulting Services",
        "quantity": 10,
        "unit": "HUR",
        "unitPrice": 150.00,
        "vatRate": 19,
        "vatAmount": 285.00,
        "lineTotal": 1500.00
      }
    ],
    "currency": "EUR",
    "subtotal": 1500.00,
    "totalVat": 285.00,
    "total": 1785.00
  },
  "warnings": []
}
```

---

### Parse Auto-Detect

Parses an invoice document with automatic country and format detection.

```
POST /api/v1/invoice/parse
```

#### Request Body

```json
{
  "data": "PD94bWwgdmVyc2lvbj0iMS4wIi4uLg==",
  "filename": "invoice.xml"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `data` | string | Yes | Base64-encoded document |
| `filename` | string | No | Filename hint for format detection |

#### Response (200 OK)

```json
{
  "success": true,
  "format": "xrechnung",
  "hash": "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "invoice": { ... },
  "detection": {
    "format": "xrechnung",
    "formatVersion": "2.3.0",
    "countryCode": "DE",
    "confidence": 0.95,
    "formatMethod": "xml-analysis",
    "countrySource": "vatId",
    "isAmbiguous": false
  }
}
```

#### Detection Fields

| Field | Type | Description |
|-------|------|-------------|
| `detection.format` | string | Detected format identifier |
| `detection.formatVersion` | string | Detected format version (if available) |
| `detection.countryCode` | string | Detected country code |
| `detection.confidence` | number | Confidence score (0-1) |
| `detection.formatMethod` | string | How format was detected |
| `detection.countrySource` | string | How country was determined |
| `detection.isAmbiguous` | boolean | Whether detection was ambiguous |
| `detection.alternativeCountries` | string[] | Other possible countries (if ambiguous) |

---

### Validate Invoice

Validates invoice data against country-specific rules.

```
POST /api/v1/invoice/{countryCode}/validate
```

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `countryCode` | string | Country code for validation rules |

#### Request Body

```json
{
  "invoice": {
    "invoiceNumber": "INV-2025-001",
    "invoiceDate": "2025-01-15",
    "seller": { ... },
    "buyer": { ... },
    "lineItems": [ ... ],
    "currency": "EUR",
    "total": 7497.00
  }
}
```

#### Response (200 OK) - Valid

```json
{
  "success": true,
  "errors": [],
  "warnings": []
}
```

#### Response (200 OK) - With Errors

```json
{
  "success": false,
  "errors": [
    {
      "code": "E001",
      "message": "Invalid VAT ID format",
      "field": "seller.vatId",
      "severity": "error"
    },
    {
      "code": "E002",
      "message": "Invoice total does not match line items",
      "field": "total",
      "severity": "error"
    }
  ],
  "warnings": [
    {
      "code": "W001",
      "message": "Due date is missing",
      "field": "dueDate",
      "severity": "warning"
    }
  ]
}
```

---

### Get Formats

Retrieves all supported countries and formats.

```
GET /api/v1/invoice/formats
```

#### Response (200 OK)

```json
{
  "success": true,
  "countries": [
    {
      "code": "DE",
      "name": "Germany",
      "region": "DACH",
      "formats": [
        {
          "id": "xrechnung",
          "name": "XRechnung",
          "description": "German e-invoice standard",
          "mimeType": "application/xml",
          "extension": ".xml",
          "mandatory": true,
          "b2g": true
        },
        {
          "id": "zugferd",
          "name": "ZUGFeRD",
          "description": "Hybrid PDF/XML format",
          "mimeType": "application/pdf",
          "extension": ".pdf",
          "mandatory": false,
          "b2g": false
        }
      ]
    },
    {
      "code": "AT",
      "name": "Austria",
      "region": "DACH",
      "formats": [ ... ]
    }
  ]
}
```

---

### Get Country Formats

Retrieves supported formats for a specific country.

```
GET /api/v1/invoice/{countryCode}/formats
```

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `countryCode` | string | ISO 3166-1 Alpha-2 country code |

#### Response (200 OK)

```json
{
  "success": true,
  "country": {
    "code": "DE",
    "name": "Germany",
    "region": "DACH"
  },
  "formats": [
    {
      "id": "xrechnung",
      "name": "XRechnung",
      "description": "German e-invoice standard",
      "mimeType": "application/xml",
      "extension": ".xml",
      "mandatory": true,
      "b2g": true,
      "versions": ["2.3.0", "3.0.0"]
    }
  ]
}
```

---

## Request/Response Schemas

### Invoice Schema

```typescript
interface Invoice {
  // Required fields
  invoiceNumber: string;
  invoiceDate: string;        // YYYY-MM-DD
  seller: Party;
  buyer: Party;
  lineItems: LineItem[];
  currency: string;           // ISO 4217
  total: number;

  // Optional fields
  dueDate?: string;           // YYYY-MM-DD
  subtotal?: number;
  totalVat?: number;
  paymentTerms?: string;
  notes?: string;
  buyerReference?: string;    // Leitweg-ID for B2G
  orderReference?: string;
  contractReference?: string;
}

interface Party {
  name: string;
  address: Address;
  vatId?: string;
  email?: string;
  phone?: string;
  bankAccount?: BankAccount;
  contactPerson?: string;
}

interface Address {
  street: string;
  additionalLine?: string;
  city: string;
  postalCode: string;
  country: string;            // ISO 3166-1 Alpha-2
}

interface BankAccount {
  iban: string;
  bic?: string;
  bankName?: string;
}

interface LineItem {
  position?: number;
  description: string;
  quantity: number;
  unit: string;               // UN/ECE Rec. 20
  unitPrice: number;
  vatRate: number;            // Percentage
  vatAmount?: number;
  lineTotal?: number;
  articleNumber?: string;
  discount?: number;
}
```

### Error Schema

```typescript
interface ErrorResponse {
  success: false;
  error: string;
  message?: string;
  errors?: ValidationError[];
}

interface ValidationError {
  code: string;
  message: string;
  field?: string;
  severity: 'error' | 'warning';
}
```

---

## Error Codes

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 400 | Bad Request | Invalid request/validation error |
| 401 | Unauthorized | API key missing or invalid |
| 403 | Forbidden | No permission for this resource |
| 404 | Not Found | Resource not found |
| 422 | Unprocessable Entity | Semantic errors in data |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

### Validation Error Codes

#### Errors

| Code | Description | Field |
|------|-------------|-------|
| `E001` | Invalid VAT ID format | seller.vatId, buyer.vatId |
| `E002` | Invoice total does not match | total |
| `E003` | Required field missing | various |
| `E004` | Invalid date format | invoiceDate, dueDate |
| `E005` | Negative amounts not allowed | lineItems[].unitPrice |
| `E006` | Invalid VAT rate | lineItems[].vatRate |
| `E007` | Invalid currency code | currency |
| `E008` | Invalid country code | seller.address.country |
| `E009` | Invalid unit code | lineItems[].unit |
| `E010` | Invoice number already used | invoiceNumber |

#### Warnings

| Code | Description | Field |
|------|-------------|-------|
| `W001` | Due date is missing | dueDate |
| `W002` | Payment terms are missing | paymentTerms |
| `W003` | Bank account is missing | seller.bankAccount |
| `W004` | Email address is missing | seller.email, buyer.email |
| `W005` | Position number is missing | lineItems[].position |
| `W006` | Leitweg-ID recommended for B2G | buyerReference |

### API Error Codes

| Code | Description |
|------|-------------|
| `AUTH_MISSING` | Authorization header is missing |
| `AUTH_INVALID` | API key is invalid |
| `AUTH_EXPIRED` | API key has expired |
| `RATE_LIMIT` | Rate limit exceeded |
| `FORMAT_UNSUPPORTED` | Format not supported for country |
| `COUNTRY_UNSUPPORTED` | Country not supported |
| `PARSE_ERROR` | Document could not be parsed |
| `GENERATION_ERROR` | Document could not be generated |

---

## Rate Limits

### Standard Limits

| Plan | Requests/Minute | Requests/Day |
|------|-----------------|--------------|
| Free | 10 | 100 |
| Starter | 60 | 1,000 |
| Professional | 300 | 10,000 |
| Enterprise | 1,000 | 100,000 |

### Rate Limit Headers

```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1705312800
```

| Header | Description |
|--------|-------------|
| `X-RateLimit-Limit` | Maximum requests per minute |
| `X-RateLimit-Remaining` | Remaining requests |
| `X-RateLimit-Reset` | Unix timestamp for reset |

### Rate Limit Exceeded

```json
{
  "success": false,
  "error": "RATE_LIMIT",
  "message": "Rate limit exceeded. Try again in 45 seconds.",
  "retryAfter": 45
}
```

---

## Webhooks (optional)

### Webhook Events

| Event | Description |
|-------|-------------|
| `invoice.generated` | Invoice was generated |
| `invoice.validated` | Invoice was validated |
| `invoice.parsed` | Invoice was parsed |
| `invoice.error` | Error during processing |

### Webhook Payload

```json
{
  "event": "invoice.generated",
  "timestamp": "2025-01-15T10:30:00Z",
  "data": {
    "requestId": "req_abc123",
    "invoiceNumber": "INV-2025-001",
    "format": "xrechnung",
    "countryCode": "DE",
    "success": true
  }
}
```

### Webhook Signature

Webhooks are signed with HMAC-SHA256:

```http
X-Webhook-Signature: sha256=abc123...
```

---

## SDK Support

### n8n Community Node

```bash
npm install n8n-nodes-invoice-api-xhub
```

### JavaScript/TypeScript

```typescript
import { InvoiceXhubClient } from 'invoice-xhub-sdk';

const client = new InvoiceXhubClient({
  apiKey: 'sk_live_...'
});

const result = await client.generate({
  countryCode: 'DE',
  format: 'xrechnung',
  invoice: { ... }
});
```

### cURL

```bash
curl -X POST https://service.invoice-api.xhub.io/api/v1/invoice/DE/xrechnung/generate \
  -H "Authorization: Bearer sk_live_..." \
  -H "Content-Type: application/json" \
  -d @invoice.json
```

---

## Changelog

### v1.3.0 (2025-06)
- Added Parse Auto-Detect endpoint (`POST /api/v1/invoice/parse`)
- Automatic country and format detection with confidence scoring
- All endpoints use `/api/v1/invoice/` prefix

### v1.0.0 (2025-01)
- Initial API release
- Support for 14 countries
- 18 formats available
- Generate, Parse, Validate, Get Formats endpoints
