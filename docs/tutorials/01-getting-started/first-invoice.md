# Your First Invoice

## Overview

In this tutorial, you'll generate your first e-invoice using n8n and invoice-api.xhub. You'll create a simple PDF invoice and learn the basic invoice data structure.

## Prerequisites

- [ ] Completed [Setup Credentials](./setup-credentials.md) tutorial
- [ ] invoice-api.xhub API credentials configured in n8n

## What You'll Learn

- How to structure invoice data for the API
- How to use the Generate operation
- How to handle binary output (PDF/XML files)
- Understanding validation warnings

---

## Step 1: Create the Workflow

### What We're Doing

We'll build a workflow that takes invoice data and generates a PDF document.

### Instructions

1. Create a new workflow in n8n
2. Name it "Generate Invoice - Tutorial"
3. Add a **Manual Trigger** node
4. Add an **invoice-api.xhub** node and connect it to the trigger

### Visual Workflow

```
┌─────────────────┐     ┌─────────────────────┐
│  Manual Trigger │ ──► │  invoice-api.xhub       │
│                 │     │  Operation: Generate│
└─────────────────┘     └─────────────────────┘
```

### Checkpoint

✅ You have a workflow with two connected nodes

---

## Step 2: Configure the invoice-api.xhub Node

### What We're Doing

Now we'll configure the node to generate a PDF invoice for Germany.

### Instructions

1. Click on the invoice-api.xhub node to open its settings
2. Configure the following:

### Node Settings

| Setting | Value |
|---------|-------|
| **Credential** | Your invoice-api.xhub API credential |
| **Operation** | Generate |
| **Country** | Germany (DE) |
| **Output Format** | PDF |

### Screenshot Guide

```
┌──────────────────────────────────────────────────────┐
│  invoice-api.xhub                                        │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Operation                                           │
│  ┌────────────────────────────────────────────────┐  │
│  │ Generate                                   ▼   │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  Country                                             │
│  ┌────────────────────────────────────────────────┐  │
│  │ Germany (DE)                               ▼   │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  Output Format                                       │
│  ┌────────────────────────────────────────────────┐  │
│  │ PDF                                        ▼   │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  Invoice Data                                        │
│  ┌────────────────────────────────────────────────┐  │
│  │ { ... JSON data ... }                          │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### Checkpoint

✅ Operation is set to "Generate" and Country is "Germany (DE)"

---

## Step 3: Add Invoice Data

### What We're Doing

Now we'll add the invoice data in JSON format. This includes seller, buyer, line items, and totals.

### Instructions

1. In the **Invoice Data** field, paste the following JSON:

### Invoice Data JSON

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
    "email": "invoices@acme.de",
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
    "email": "billing@customer.de"
  },
  "lineItems": [
    {
      "position": 1,
      "description": "Consulting Services - Project Alpha",
      "quantity": 10,
      "unit": "HUR",
      "unitPrice": 150.00,
      "vatRate": 19
    },
    {
      "position": 2,
      "description": "Software License - Annual",
      "quantity": 1,
      "unit": "C62",
      "unitPrice": 500.00,
      "vatRate": 19
    }
  ],
  "currency": "EUR",
  "total": 2499.00,
  "paymentTerms": "Net 30 days",
  "notes": "Thank you for your business!"
}
```

### Understanding the Data Structure

| Field | Required | Description |
|-------|----------|-------------|
| `invoiceNumber` | Yes | Unique invoice identifier |
| `invoiceDate` | Yes | Issue date (YYYY-MM-DD) |
| `dueDate` | No | Payment due date |
| `seller` | Yes | Your company details |
| `buyer` | Yes | Customer details |
| `lineItems` | Yes | Products/services invoiced |
| `currency` | Yes | ISO 4217 currency code |
| `total` | Yes | Total invoice amount |

### Unit Codes (UN/ECE Rec. 20)

| Code | Meaning |
|------|---------|
| `HUR` | Hour |
| `C62` | One (piece/unit) |
| `DAY` | Day |
| `MON` | Month |
| `KGM` | Kilogram |

### Checkpoint

✅ Invoice data is pasted and the JSON is valid (no red error indicators)

---

## Step 4: Run the Workflow

### What We're Doing

Let's generate the invoice and see the results.

### Instructions

1. Click **Test Workflow** or press `Ctrl+Enter`
2. Wait for the execution to complete
3. Click on the invoice-api.xhub node to see the output

### Expected Output

The node output will show:

```json
{
  "success": true,
  "format": "pdf",
  "filename": "invoice-INV-2025-001.pdf",
  "mimeType": "application/pdf",
  "hash": "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "warnings": []
}
```

### Binary Data

The generated PDF is available as binary data attached to the output item. You'll see a "Binary" tab in the output panel.

```
┌─────────────────────────────────────────────────────────┐
│  Output                                                 │
├──────────────────────────────────────────────────────────┤
│  [JSON]  [Binary]  [Schema]                             │
│                                                          │
│  Binary                                                  │
│  ┌───────────────────────────────────────────────────┐  │
│  │ 📄 data                                           │  │
│  │    invoice-INV-2025-001.pdf                       │  │
│  │    application/pdf                                │  │
│  │    [Download] [View]                              │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

4. Click **Download** to save the PDF
5. Open the PDF to see your generated invoice!

### Checkpoint

✅ You have a downloadable PDF invoice

---

## Step 5: Understanding Warnings

### What We're Doing

The API may return warnings for recommended but non-required fields. Let's learn how to interpret them.

### Try This

Modify the invoice data to remove `paymentTerms`:

```json
{
  "invoiceNumber": "INV-2025-002",
  "invoiceDate": "2025-01-15",
  "seller": { ... },
  "buyer": { ... },
  "lineItems": [ ... ],
  "currency": "EUR",
  "total": 2499.00
}
```

Run the workflow again.

### Expected Warnings

```json
{
  "success": true,
  "warnings": [
    {
      "code": "W001",
      "message": "Due date missing",
      "field": "dueDate"
    },
    {
      "code": "W002",
      "message": "Payment terms recommended",
      "field": "paymentTerms"
    }
  ]
}
```

### Warning vs Error

| Type | Behavior | Action Required |
|------|----------|-----------------|
| **Warning** | Invoice still generated | Optional to fix |
| **Error** | Invoice NOT generated | Must fix before retry |

### Checkpoint

✅ You understand the difference between warnings and errors

---

## Step 6: Save to File (Optional)

### What We're Doing

Let's add a node to save the generated PDF to disk.

### Instructions

1. Add a **Write Binary File** node after invoice-api.xhub
2. Configure it:

### Node Settings

| Setting | Value |
|---------|-------|
| **File Name** | `{{ $json.filename }}` |
| **Property Name** | `data` |

### Updated Workflow

```
┌─────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│  Manual Trigger │ ──► │  invoice-api.xhub       │ ──► │  Write Binary File  │
│                 │     │  Operation: Generate│     │                     │
└─────────────────┘     └─────────────────────┘     └─────────────────────┘
```

3. Run the workflow
4. The PDF is saved to your n8n's working directory

### Checkpoint

✅ You can save generated invoices to the filesystem

---

## Troubleshooting

### Error: "Invoice data must be valid JSON"

**Problem:** The JSON in the Invoice Data field is malformed.

**Solution:**
1. Check for missing commas between fields
2. Ensure all strings are in double quotes
3. Use a JSON validator like [jsonlint.com](https://jsonlint.com)

### Error: "Required field missing: seller.vatId"

**Problem:** A required field is not provided.

**Solution:**
1. Check the error message for the specific field
2. Add the missing field to your invoice data
3. Refer to the [API Reference](../../API-REFERENCE.md) for required fields

### Error: "Invalid VAT ID format"

**Problem:** The VAT ID doesn't match the expected format for the country.

**Solution:**
| Country | Format | Example |
|---------|--------|---------|
| DE | DE + 9 digits | DE123456789 |
| AT | ATU + 8 digits | ATU12345678 |
| FR | FR + 2 chars + 9 digits | FR12345678901 |

### No PDF generated (empty binary)

**Problem:** The `outputBinary` option might be disabled.

**Solution:**
1. Check **Options** → **Output Binary** is `true` (default)
2. Verify **Binary Property** is set to `data`

---

## Summary

### What You Built

A workflow that generates PDF invoices from JSON data:

```
Manual Trigger ──► invoice-api.xhub (Generate) ──► [Optional: Save File]
```

### Key Concepts

- **Invoice Data Structure**: Seller, Buyer, Line Items, Totals
- **Unit Codes**: UN/ECE Rec. 20 standard (HUR, C62, DAY, etc.)
- **Binary Output**: Generated documents are returned as binary data
- **Warnings vs Errors**: Warnings allow generation; errors block it

### What's Next

Now that you can generate basic invoices, you can:

1. **Try different formats**: Change Output Format to `XRechnung` or `ZUGFeRD`
2. **Add validation**: Use the Validate operation before generating
3. **Learn multi-agent patterns**: Continue to [Understanding Agents](../03-multi-agent-basics/understanding-agents.md)

---

## Complete Workflow JSON

You can import this workflow directly into n8n.

### Option 1: Download and Import

Download the workflow JSON file and import it in n8n:

**[Download tutorial-01-first-invoice.json](../workflows/tutorial-01-first-invoice.json)**

To import:
1. In n8n, go to **Workflows** → **Import from File**
2. Select the downloaded JSON file
3. Update the credential reference to your invoice-api.xhub API credential
4. Save and test the workflow

### Option 2: Copy and Paste

Copy the JSON below and use **Import from URL** or paste directly:

```json
{
  "name": "Tutorial - Generate Invoice",
  "nodes": [
    {
      "parameters": {},
      "name": "Manual Trigger",
      "type": "n8n-nodes-base.manualTrigger",
      "position": [240, 300]
    },
    {
      "parameters": {
        "operation": "generate",
        "countryCode": "DE",
        "format": "pdf",
        "invoiceData": "{\n  \"invoiceNumber\": \"INV-2025-001\",\n  \"invoiceDate\": \"2025-01-15\",\n  \"dueDate\": \"2025-02-14\",\n  \"seller\": {\n    \"name\": \"ACME GmbH\",\n    \"address\": {\n      \"street\": \"Hauptstraße 1\",\n      \"city\": \"Berlin\",\n      \"postalCode\": \"10115\",\n      \"country\": \"DE\"\n    },\n    \"vatId\": \"DE123456789\",\n    \"email\": \"invoices@acme.de\"\n  },\n  \"buyer\": {\n    \"name\": \"Customer AG\",\n    \"address\": {\n      \"street\": \"Nebenstraße 2\",\n      \"city\": \"München\",\n      \"postalCode\": \"80331\",\n      \"country\": \"DE\"\n    },\n    \"vatId\": \"DE987654321\"\n  },\n  \"lineItems\": [\n    {\n      \"position\": 1,\n      \"description\": \"Consulting Services\",\n      \"quantity\": 10,\n      \"unit\": \"HUR\",\n      \"unitPrice\": 150.00,\n      \"vatRate\": 19\n    }\n  ],\n  \"currency\": \"EUR\",\n  \"total\": 1785.00\n}"
      },
      "name": "invoice-api.xhub",
      "type": "n8n-nodes-invoice-api-xhub.invoiceXhub",
      "position": [460, 300],
      "credentials": {
        "invoiceXhubApi": {
          "id": "REPLACE_WITH_YOUR_CREDENTIAL_ID",
          "name": "invoice-api.xhub API"
        }
      }
    }
  ],
  "connections": {
    "Manual Trigger": {
      "main": [[{ "node": "invoice-api.xhub", "type": "main", "index": 0 }]]
    }
  }
}
```

> **Note:** After importing, update the credential ID to match your invoice-api.xhub API credential.

---

## Resources

- [API Reference - Generate Invoice](../../API-REFERENCE.md#generate-invoice)
- [Supported Formats](../../API-REFERENCE.md#get-formats)
- [Invoice Schema](../../API-REFERENCE.md#invoice-schema)
