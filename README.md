# n8n-nodes-invoice-api-xhub

[![npm version](https://badge.fury.io/js/n8n-nodes-invoice-api-xhub.svg)](https://badge.fury.io/js/n8n-nodes-invoice-api-xhub)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

This is the official [invoice-api.xhub](https://invoice-api.xhub.io/en/docs/integrations/n8n) community node for n8n.

https://invoice-api.xhub.io - E-Invoice API for Developers – XRechnung, ZUGFeRD, Peppol

https://service.invoice-api.xhub.io/docs - Open API documentation for Developers 


https://service.invoice-api.xhub.io/api/v1/invoice/ - API endpoint for Developers 


[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

## Table of Contents

- [Installation](#installation)
- [Operations](#operations)
- [Credentials](#credentials)
- [Compatibility](#compatibility)
- [Usage](#usage)
- [Resources](#resources)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

The package name is `n8n-nodes-invoice-api-xhub`.

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

### Supported Formats (18+)

`xrechnung` · `zugferd` · `ebinterface` · `qr-rechnung` · `facturx` · `ubl-be` · `ubl-nl` · `fatturapa` · `facturae` · `saf-t` · `ksef` · `isdoc` · `nav` · `efactura` · `ubl-bg` · `pdf` · `ubl` · `cii`

### Minimal Example: Generate a German XRechnung

```json
{
  "operation": "generate",
  "countryCode": "DE",
  "format": "xrechnung",
  "invoiceData": {
    "invoiceNumber": "INV-2025-001",
    "invoiceDate": "2025-01-15",
    "seller": { "name": "ACME GmbH", "vatId": "DE123456789", "address": { "street": "Hauptstraße 1", "city": "Berlin", "postalCode": "10115", "country": "DE" } },
    "buyer":  { "name": "Customer AG", "address": { "street": "Nebenstraße 2", "city": "München", "postalCode": "80331", "country": "DE" } },
    "lineItems": [{ "description": "Consulting", "quantity": 10, "unitPrice": 150.00, "vatRate": 19 }],
    "currency": "EUR",
    "total": 1785.00
  }
}
```

For the full invoice data schema, all parameters, and workflow examples see the [API Reference](docs/API-REFERENCE.md) and [Tutorials](docs/tutorials/).

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
- [invoice-api.xhub Documentation](https://invoice-api.xhub.io/docs)
- [invoice-api.xhub n8n Integration Guide](https://invoice-api.xhub.io/docs/integrations/n8n)
- [API Reference (this repo)](docs/API-REFERENCE.md)
- [GitHub Repository](https://github.com/xhubio/n8n-nodes-invoice-api-xhub)
- **Support:** support@xhub.io
