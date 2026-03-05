# n8n-nodes-invoice-api-xhub

[![npm version](https://badge.fury.io/js/n8n-nodes-invoice-api-xhub.svg)](https://badge.fury.io/js/n8n-nodes-invoice-api-xhub)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Custom n8n Community Node for the invoice-api.xhub E-Invoice API. Generate, parse, and validate e-invoices for 14 European countries with 18+ formats. 

https://service.invoice-api.xhub.io/api/v1/invoice/

## Features

- **Generate**: Create e-invoices in various formats (XRechnung, ZUGFeRD, Factur-X, FatturaPA, etc.)
- **Parse**: Extract invoice data from XML or PDF documents
- **Parse Auto-Detect**: Parse invoices with automatic country and format detection
- **Validate**: Validate invoice data against country-specific rules
- **Get Formats**: Retrieve supported countries and formats

## Quick Start

```bash
# Installation
npm install n8n-nodes-invoice-api-xhub

# Or via n8n Community Nodes UI
```

1. Install the node via n8n Community Nodes
2. Create credentials with your invoice-api.xhub API key
3. Add the invoice-api.xhub node to your workflow
4. Select the desired operation (Generate, Parse, Validate, Get Formats)

## Documentation

| Document | Description |
|----------|-------------|
| [API Reference](docs/API-REFERENCE.md) | Complete API documentation |
| [Multi-Agent Architecture](docs/MULTI-AGENT-ARCHITECTURE.md) | AI-powered multi-agent system |
| [Tutorials](docs/tutorials/README.md) | Step-by-step guides |

### Tutorials

| Tutorial | Level | Duration |
|----------|-------|----------|
| [Setup Credentials](docs/tutorials/01-getting-started/setup-credentials.md) | Beginner | 10 min |
| [Your First Invoice](docs/tutorials/01-getting-started/first-invoice.md) | Beginner | 15 min |
| [Understanding Agents](docs/tutorials/03-multi-agent-basics/understanding-agents.md) | Intermediate | 15 min |
| [Coordinator Pattern](docs/tutorials/03-multi-agent-basics/coordinator-pattern.md) | Intermediate | 30 min |

## Installation

### In n8n (Recommended)

Navigate to **Settings → Community Nodes** and search for `n8n-nodes-invoice-api-xhub`.

Alternatively via CLI:

```bash
npm install n8n-nodes-invoice-api-xhub
```

### For Development

```bash
git clone https://github.com/xhubio/n8n-nodes-invoice-api-xhub.git
cd n8n-nodes-invoice-api-xhub
pnpm install
pnpm build
```

## Credentials Setup

### Step 1: Get API Key

1. Register at [invoice-api.xhub.io](https://invoice-api.xhub.io)
2. Navigate to **Dashboard → API Keys**
3. Create a new API key

API keys have the following format:
- **Production**: `sk_live_xxxxxxxxxxxxxxxxxxxx`
- **Test/Sandbox**: `sk_test_xxxxxxxxxxxxxxxxxxxx`

### Step 2: Create Credentials in n8n

1. Open n8n
2. Navigate to **Credentials → New Credential**
3. Search for "invoice-api.xhub API"
4. Fill in the fields:
   - **API Key**: Your API key (sk_live_... or sk_test_...)
   - **Base URL**: `https://service.invoice-api.xhub.io` (default)

### Step 3: Test Connection

The credential test automatically calls `/api/v1/invoice/formats` to verify the connection.

## Node Operations

### Generate - Create E-Invoice

Creates an e-invoice document from JSON data.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `countryCode` | Dropdown | Yes | Target country (DE, AT, CH, etc.) |
| `format` | Dropdown | Yes | Output format (xrechnung, zugferd, pdf, etc.) |
| `invoiceData` | JSON | Yes | Invoice data as JSON object |

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `outputBinary` | Boolean | true | Output document as binary data |
| `binaryPropertyName` | String | "data" | Name of the binary property |
| `includeWarnings` | Boolean | true | Include validation warnings |
| `formatOptions` | JSON | {} | Additional format-specific options |

**Output:**

```json
{
  "success": true,
  "format": "xrechnung",
  "filename": "invoice-INV-2025-001.xml",
  "mimeType": "application/xml",
  "hash": "sha256:abc123...",
  "warnings": []
}
```

### Parse - Parse E-Invoice

Extracts invoice data from a document.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `countryCode` | Dropdown | Yes | Expected country of the invoice |
| `format` | Dropdown | Yes | Expected format |
| `inputType` | Dropdown | Yes | Input type (binary/base64) |
| `binaryPropertyName` | String | Yes* | Binary property with the document |
| `base64Data` | String | Yes* | Base64-encoded document |

*Depending on `inputType`

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `filename` | String | - | Filename hint for the parser |
| `includeWarnings` | Boolean | true | Include warnings |

**Output:**

```json
{
  "success": true,
  "format": "xrechnung",
  "hash": "sha256:abc123...",
  "invoice": {
    "invoiceNumber": "INV-2025-001",
    "invoiceDate": "2025-01-15",
    "seller": { ... },
    "buyer": { ... },
    "lineItems": [ ... ],
    "total": 7497.00
  }
}
```

### Parse Auto-Detect - Parse with Auto-Detection

Parses an invoice document with automatic country and format detection.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `inputType` | Dropdown | Yes | Input type (binary/base64) |
| `binaryPropertyName` | String | Yes* | Binary property with the document |
| `base64Data` | String | Yes* | Base64-encoded document |

*Depending on `inputType`

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `filename` | String | - | Filename hint for format detection |
| `includeWarnings` | Boolean | true | Include warnings |

**Output:**

```json
{
  "success": true,
  "format": "xrechnung",
  "hash": "sha256:abc123...",
  "invoice": { ... },
  "detection": {
    "format": "xrechnung",
    "countryCode": "DE",
    "confidence": 0.95,
    "formatMethod": "xml-analysis",
    "countrySource": "vatId",
    "isAmbiguous": false
  },
  "detectedFormat": "xrechnung",
  "detectedCountry": "DE",
  "confidence": 0.95
}
```

### Validate - Validate Invoice

Validates invoice data against country-specific rules.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `countryCode` | Dropdown | Yes | Country for validation rules |
| `invoiceData` | JSON | Yes | Invoice data to validate |

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `failOnErrors` | Boolean | false | Fail node on errors |
| `failOnWarnings` | Boolean | false | Fail node on warnings |

**Output:**

```json
{
  "valid": true,
  "countryCode": "DE",
  "errors": [],
  "warnings": [
    {
      "code": "W001",
      "message": "Payment terms recommended",
      "field": "paymentTerms"
    }
  ],
  "errorCount": 0,
  "warningCount": 1
}
```

### Get Formats - Retrieve Supported Formats

Retrieves all supported countries and formats.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `scope` | Dropdown | Yes | "all" or "country" |
| `countryCode` | Dropdown | Yes* | Country for specific formats |

*Only when scope="country"

**Output:**

```json
{
  "success": true,
  "countries": [
    {
      "code": "DE",
      "name": "Germany",
      "formats": ["xrechnung", "zugferd", "pdf", "ubl", "cii"]
    }
  ]
}
```

## Supported Countries (14)

| Region | Countries | Main Formats |
|--------|-----------|--------------|
| **DACH** | Germany (DE), Austria (AT), Switzerland (CH) | XRechnung, ZUGFeRD, ebInterface, QR-Rechnung |
| **EU West** | France (FR), Belgium (BE), Netherlands (NL) | Factur-X, UBL-BE, UBL-NL |
| **EU South** | Italy (IT), Spain (ES), Portugal (PT) | FatturaPA, Facturae, SAF-T |
| **EU East** | Poland (PL), Czech Republic (CZ), Hungary (HU), Romania (RO), Bulgaria (BG) | KSeF, ISDOC, NAV, e-Factura, UBL-BG |

## Supported Formats (18)

### DACH Region

| Format | Country | Description | Output |
|--------|---------|-------------|--------|
| `xrechnung` | DE | German e-invoice standard (mandatory for B2G) | XML |
| `zugferd` | DE/AT/CH | Hybrid format with embedded XML data | PDF |
| `ebinterface` | AT | Austrian e-invoice standard | XML |
| `qr-rechnung` | CH | Swiss QR invoice | PDF |

### EU West

| Format | Country | Description | Output |
|--------|---------|-------------|--------|
| `facturx` | FR | French standard (based on ZUGFeRD) | PDF |
| `ubl-be` | BE | Belgian UBL format | XML |
| `ubl-nl` | NL | Dutch UBL format | XML |

### EU South

| Format | Country | Description | Output |
|--------|---------|-------------|--------|
| `fatturapa` | IT | Italian e-invoice standard (mandatory) | XML |
| `facturae` | ES | Spanish e-invoice standard | XML |
| `saf-t` | PT | Portuguese SAF-T format | XML |

### EU East

| Format | Country | Description | Output |
|--------|---------|-------------|--------|
| `ksef` | PL | Polish Krajowy System e-Faktur | XML |
| `isdoc` | CZ | Czech e-invoice standard | XML |
| `nav` | HU | Hungarian tax reporting system | XML |
| `efactura` | RO | Romanian e-Factura system | XML |
| `ubl-bg` | BG | Bulgarian UBL format | XML |

### Generic Formats

| Format | Description | Output |
|--------|-------------|--------|
| `pdf` | Plain PDF without structured data | PDF |
| `ubl` | Generic UBL (Universal Business Language) | XML |
| `cii` | Cross Industry Invoice (UN/CEFACT) | XML |

## Invoice Data Schema

### Complete Example

```json
{
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
    "vatId": "DE123456789",
    "email": "billing@acme.de",
    "phone": "+49 30 12345678",
    "bankAccount": {
      "iban": "DE89370400440532013000",
      "bic": "COBADEFFXXX",
      "bankName": "Commerzbank"
    }
  },
  "buyer": {
    "name": "Customer AG",
    "address": {
      "street": "Nebenstraße 2",
      "city": "München",
      "postalCode": "80331",
      "country": "DE"
    },
    "vatId": "DE987654321",
    "email": "purchasing@customer.de"
  },
  "lineItems": [
    {
      "position": 1,
      "description": "Consulting Services - Project Planning",
      "quantity": 10,
      "unit": "HUR",
      "unitPrice": 150.00,
      "vatRate": 19,
      "vatAmount": 285.00,
      "lineTotal": 1500.00
    },
    {
      "position": 2,
      "description": "Software Development",
      "quantity": 40,
      "unit": "HUR",
      "unitPrice": 120.00,
      "vatRate": 19,
      "vatAmount": 912.00,
      "lineTotal": 4800.00
    }
  ],
  "currency": "EUR",
  "subtotal": 6300.00,
  "totalVat": 1197.00,
  "total": 7497.00,
  "paymentTerms": "Payable within 30 days without deduction",
  "notes": "Thank you for your order!"
}
```

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `invoiceNumber` | String | Unique invoice number |
| `invoiceDate` | String (YYYY-MM-DD) | Invoice date |
| `seller` | Object | Seller/Supplier |
| `seller.name` | String | Company name |
| `seller.address` | Object | Address with street, city, postalCode, country |
| `seller.vatId` | String | VAT ID |
| `buyer` | Object | Buyer/Recipient |
| `buyer.name` | String | Company name |
| `buyer.address` | Object | Address |
| `lineItems` | Array | Invoice line items |
| `lineItems[].description` | String | Description |
| `lineItems[].quantity` | Number | Quantity |
| `lineItems[].unitPrice` | Number | Unit price |
| `lineItems[].vatRate` | Number | VAT rate in % |
| `currency` | String | Currency code (EUR, CHF, etc.) |
| `total` | Number | Total amount including VAT |

### Unit Codes (UN/ECE Rec. 20)

| Code | Description |
|------|-------------|
| `C62` | Piece |
| `HUR` | Hour |
| `DAY` | Day |
| `MON` | Month |
| `KGM` | Kilogram |
| `MTR` | Meter |
| `LTR` | Liter |

## Examples

### Example 1: XRechnung for German B2G Customer

```javascript
// Generate Node Configuration
{
  "operation": "generate",
  "countryCode": "DE",
  "format": "xrechnung",
  "invoiceData": {
    "invoiceNumber": "XR-2025-001",
    "invoiceDate": "2025-01-15",
    "buyerReference": "04011000-12345-67",  // Leitweg-ID for B2G
    // ... additional data
  }
}
```

### Example 2: ZUGFeRD PDF with Embedded Data

```javascript
{
  "operation": "generate",
  "countryCode": "DE",
  "format": "zugferd",
  "invoiceData": { ... },
  "options": {
    "outputBinary": true,
    "binaryPropertyName": "invoice_pdf",
    "formatOptions": {
      "profile": "extended",  // basic, comfort, extended
      "pdfVersion": "PDF/A-3b"
    }
  }
}
```

### Example 3: Parse and Validate Invoice

```javascript
// Workflow: Parse → Validate → Process
// 1. Parse Node
{
  "operation": "parse",
  "countryCode": "DE",
  "format": "xrechnung",
  "inputType": "binary",
  "binaryPropertyName": "data"
}

// 2. Validate Node (connected to Parse)
{
  "operation": "validate",
  "countryCode": "DE",
  "invoiceData": "={{ $json.invoice }}",
  "options": {
    "failOnErrors": true
  }
}
```

## Multi-Agent Workflows

This package is part of a larger multi-agent system for intelligent e-invoice processing. See [docs/MULTI-AGENT-ARCHITECTURE.md](docs/MULTI-AGENT-ARCHITECTURE.md) for details.

### Available Agents

| Agent | Description |
|-------|-------------|
| **Coordinator Agent** | Central orchestration of all requests |
| **Validation Agent** | Dual validation (API + AI) with confidence score |
| **Generation Agent** | Intelligent invoice creation from text/JSON |
| **Parsing Agent** | Document parsing with AI enrichment |
| **Error Handler Agent** | Automatic error diagnosis and resolution |

### Key Features

- **AI-Powered Processing**: Claude 3.5 for intelligent analysis
- **Dual Validation**: API-based and AI-based verification
- **Confidence Scoring**: 0-100% confidence with threshold-based escalation
- **Human-in-the-Loop**: Slack notifications for low-confidence results
- **Auto-Fix**: Automatic error correction attempts

## Project Structure

```
n8n-nodes-invoice-api-xhub/
├── credentials/                    # API credential definitions
│   └── InvoiceXhubApi.credentials.ts
├── nodes/InvoiceXhub/              # Node implementation
│   ├── actions/                    # Operation handlers
│   │   ├── generate.operation.ts
│   │   ├── parse.operation.ts
│   │   ├── parseAutoDetect.operation.ts
│   │   ├── validate.operation.ts
│   │   └── formats.operation.ts
│   └── InvoiceXhub.node.ts         # Main node entry point
├── shared/                         # Shared utilities
│   ├── GenericFunctions.ts         # API request helpers
│   └── constants.ts                # Country/format mappings
├── docs/                           # Documentation
│   ├── API-REFERENCE.md            # Complete API docs
│   ├── MULTI-AGENT-ARCHITECTURE.md # Multi-agent system
│   └── tutorials/                  # Step-by-step tutorials
│       ├── README.md
│       ├── 01-getting-started/
│       ├── 03-multi-agent-basics/
│       └── workflows/              # Importable workflow JSONs
└── test/                           # Jest tests
```

## Troubleshooting

### Common Errors

#### "API Key invalid"
- Check that the API key was copied correctly
- Ensure the key starts with `sk_live_` or `sk_test_`
- Verify the Base URL

#### "Validation error: VAT ID invalid"
- VAT ID must match the country's format
- DE: `DE` + 9 digits
- AT: `ATU` + 8 digits
- CH: `CHE` + 9 digits + "MWST"

#### "Format not supported for country"
- Not all formats are available for all countries
- Check `COUNTRY_FORMATS` in the constants
- Use "Get Formats" operation

#### "Binary data not found"
- Ensure the previous node outputs binary data
- Check the `binaryPropertyName`

### Debug Mode

Enable extended logs in n8n:

```bash
export N8N_LOG_LEVEL=debug
n8n start
```

## Development

### Build

```bash
pnpm build
```

### Watch Mode

```bash
pnpm dev
```

### Test

```bash
pnpm test
```

### Lint

```bash
pnpm lint
pnpm lint:fix
```

### Local Installation in n8n

```bash
# Build
pnpm build

# Link in n8n custom extensions folder
cd ~/.n8n/custom
npm link /path/to/n8n-nodes-invoice-xhub
```

## Changelog

### v1.3.0
- Added Parse Auto-Detect operation (automatic country/format detection)
- Updated API endpoints to `/api/v1/invoice/...` prefix
- Improved error handling for country-specific format requests
- Trailing-slash tolerance for base URL configuration

### v1.0.0
- Initial Release
- Generate, Parse, Validate, Get Formats operations
- Support for 14 countries and 18 formats
- Multi-agent workflow support
- Comprehensive documentation and tutorials

## License

MIT

## Links

- [invoice-api.xhub Documentation](https://invoice-api.xhub.io/docs)
- [invoice-api.xhub N8N Integration](https://invoice-api.xhub.io/docs/integrations/n8n)
- [invoice-api.xhub API Console](https://console.invoice-api.xhub.io)
- [n8n Community Nodes](https://docs.n8n.io/integrations/community-nodes/)
- [invoice-api.xhub Homepage](https://invoice-api.xhub.io)
- [xhub.io Homepage](https://xhub.io)
- [GitHub Repository](https://github.com/xhubio/n8n-nodes-invoice-api-xhub)

## Support

- **Documentation**: [docs.invoice-api.xhub.io](https://invoice-api.xhub.io/docs)
- **GitHub Issues**: [github.com/xhubio/n8n-nodes-invoice-api-xhub/issues](https://github.com/xhubio/n8n-nodes-invoice-api-xhub/issues)
- **Email**: support@xhub.io
