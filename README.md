# n8n-nodes-invoice-api-xhub

[![npm version](https://badge.fury.io/js/n8n-nodes-invoice-api-xhub.svg)](https://badge.fury.io/js/n8n-nodes-invoice-api-xhub)
[![npm downloads](https://img.shields.io/npm/dw/n8n-nodes-invoice-api-xhub)](https://www.npmjs.com/package/n8n-nodes-invoice-api-xhub)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![n8n](https://img.shields.io/badge/n8n-community%20node-ff6d5a)](https://docs.n8n.io/integrations/community-nodes/)

This is the official [invoice-api.xhub](https://invoice-api.xhub.io) community node for [n8n](https://n8n.io/). Generate, parse, and validate e-invoices across 14 European countries and 18+ formats — including XRechnung, ZUGFeRD, Factur-X, FatturaPA, and Peppol — directly from your n8n workflows.

[Full documentation](https://invoice-api.xhub.io/docs/integrations/n8n) | [API Playground](https://invoice-api.xhub.io/playground) | [OpenAPI Reference](https://service.invoice-api.xhub.io/docs)

## Why invoice-api.xhub?

- **14 countries, 18+ formats** — one unified JSON schema for XRechnung, ZUGFeRD, Factur-X, FatturaPA, UBL, and more
- **Compliance built in** — validation against country-specific rules (EN 16931, B2G/B2B mandates)
- **No-code automation** — drag-and-drop n8n node with auto-detect parsing, binary file support, and batch processing
- **Free sandbox** — test with `sk_test_*` keys, no credit card required

See the [full feature overview](https://invoice-api.xhub.io) and [n8n workflow templates](https://invoice-api.xhub.io/docs/integrations/n8n/templates).

## Table of Contents

- [Why invoice-api.xhub?](#why-invoice-apixhub)
- [Installation](#installation)
- [Operations](#operations)
- [Credentials](#credentials)
- [Compatibility](#compatibility)
- [Usage](#usage)
- [Troubleshooting](#troubleshooting)
- [Resources](#resources)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

The package name is `n8n-nodes-invoice-api-xhub`.

For a step-by-step walkthrough, see the [n8n Integration Guide](https://invoice-api.xhub.io/docs/integrations/n8n).

## Operations

**Generate**
- Create e-invoice from JSON data (XRechnung, ZUGFeRD, Factur-X, FatturaPA, and more)

**Parse**
- Extract structured invoice data from XML or PDF documents

**Parse (Auto-Detect)**
- Parse an invoice with automatic country and format detection — no configuration needed

**Validate**
- Validate invoice JSON against country-specific rules and return errors/warnings

**Get Formats**
- Retrieve all supported countries and formats, or formats for a specific country

## Credentials

This node requires an API key from [invoice-api.xhub.io](https://invoice-api.xhub.io).

1. Register at [invoice-api.xhub.io](https://invoice-api.xhub.io) and navigate to **Dashboard → API Keys**
2. Create a new API key — keys follow the format `sk_live_...` (production) or `sk_test_...` (sandbox)
3. In n8n, go to **Credentials → New Credential**, search for "invoice-api.xhub API", and enter your key

The credential test automatically verifies the connection by calling `GET /api/v1/invoice/formats`.

## Compatibility

Tested with n8n **1.94.0** and later.

Requires Node.js **≥ 22.0**.

## Usage

### Supported Countries (14)

| Region | Countries |
|--------|-----------|
| DACH | Germany (DE), Austria (AT), Switzerland (CH) |
| EU West | France (FR), Belgium (BE), Netherlands (NL) |
| EU South | Italy (IT), Spain (ES), Portugal (PT) |
| EU East | Poland (PL), Czech Republic (CZ), Hungary (HU), Romania (RO), Bulgaria (BG) |

### Supported Formats

`pdf` · `zugferd` · `xrechnung` · `ebinterface` · `facturx` · `fatturapa` · `facturae` · `ubl` · `isdoc` · `nav` · `ksef` · `efactura` · `saft`

For format details and country-specific requirements, see the [API documentation](https://invoice-api.xhub.io/docs).

### Minimal Example: Generate a German XRechnung

```json
{
  "operation": "generate",
  "countryCode": "DE",
  "format": "xrechnung",
  "invoiceData": {
    "type": "invoice",
    "invoiceNumber": "INV-2025-001",
    "issueDate": "2025-01-15",
    "dueDate": "2025-02-14",
    "currency": "EUR",
    "seller": { "name": "ACME GmbH", "street": "Hauptstraße 1", "city": "Berlin", "postalCode": "10115", "countryCode": "DE", "vatId": "DE123456789" },
    "buyer": { "name": "Customer AG", "street": "Nebenstraße 2", "city": "München", "postalCode": "80331", "countryCode": "DE" },
    "countrySpecific": { "buyerReference": "BUYER-REF-001" },
    "items": [{ "position": 1, "description": "Consulting", "quantity": 10, "unit": "HUR", "unitPrice": 150.00, "netAmount": 1500.00, "taxRate": 19, "taxAmount": 285.00, "grossAmount": 1785.00 }],
    "taxSummary": [{ "taxRate": 19, "netAmount": 1500.00, "taxAmount": 285.00 }],
    "subtotal": 1500.00,
    "total": 1785.00,
    "paymentTerms": { "dueDays": 30 }
  }
}
```

For the full invoice data schema, all parameters, and workflow examples see the [API Reference](docs/API-REFERENCE.md) and [n8n workflow templates](https://invoice-api.xhub.io/docs/integrations/n8n/templates).

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `401 Unauthorized` | Check your API key format (`sk_live_*` or `sk_test_*`) and that it's entered in the credential |
| `Invalid VAT ID` | Ensure VAT IDs include the country prefix (e.g., `DE123456789`) |
| Binary output is empty | Set "Output Binary" to `true` and check the binary property name (default: `data`) |
| Request timeout | For large batches, increase the n8n node timeout or process invoices in smaller chunks |
| Format not found | Use the "Get Formats" operation to list available formats for a country |

For more help, see the [full troubleshooting guide](https://invoice-api.xhub.io/docs/integrations/n8n) or contact support@xhub.io.

## Resources

- [invoice-api.xhub Website](https://invoice-api.xhub.io) — pricing, features, and documentation
- [n8n Integration Guide](https://invoice-api.xhub.io/docs/integrations/n8n) — setup, workflow templates, and FAQ
- [API Playground](https://invoice-api.xhub.io/playground) — test API calls in your browser
- [OpenAPI Documentation](https://service.invoice-api.xhub.io/docs) — full endpoint reference
- [API Reference (this repo)](docs/API-REFERENCE.md)
- [n8n Community Nodes](https://docs.n8n.io/integrations/community-nodes/) — how to install community nodes
- [GitHub Repository](https://github.com/xhubio/n8n-nodes-invoice-api-xhub)
- **Support:** support@xhub.io

## Version History

See [Releases](https://github.com/xhubio/n8n-nodes-invoice-api-xhub/releases) for the full changelog.

## License

[MIT](LICENSE)
