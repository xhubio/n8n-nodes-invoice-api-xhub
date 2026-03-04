# Setup Credentials

## Overview

In this tutorial, you'll set up your invoice-api.xhub API credentials in n8n and verify the connection works correctly.

## Prerequisites

- [ ] n8n installed and running ([Installation Guide](https://docs.n8n.io/hosting/installation/))
- [ ] invoice-api.xhub account ([Sign up](https://portal.invoice-api.xhub.io))

## What You'll Learn

- How to obtain your API key from invoice-api.xhub
- How to configure credentials in n8n
- How to test your API connection

---

## Step 1: Get Your API Key

### What We're Doing

Before connecting n8n to invoice-api.xhub, you need an API key for authentication.

### Instructions

1. Go to [portal.invoice-api.xhub.io](https://portal.invoice-api.xhub.io)
2. Sign in or create a new account
3. Navigate to **Settings** → **API Keys**
4. Click **Create New API Key**
5. Give your key a descriptive name (e.g., "n8n Integration")
6. Choose the environment:
   - **Test** (`sk_test_...`) - For development and testing
   - **Production** (`sk_live_...`) - For real invoices
7. Copy the API key immediately (you won't be able to see it again)

### API Key Formats

| Type | Prefix | Use For |
|------|--------|---------|
| Test | `sk_test_` | Development, testing, tutorials |
| Production | `sk_live_` | Real invoices, production workflows |

### Checkpoint

✅ You should have an API key that looks like: `sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxx`

---

## Step 2: Install the invoice-api.xhub Node

### What We're Doing

The invoice-api.xhub node is a community node that needs to be installed in your n8n instance.

### Option A: Using npm (Self-hosted n8n)

```bash
# Navigate to your n8n installation directory
cd ~/.n8n

# Install the community node
npm install n8n-nodes-invoice-api-xhub

# Restart n8n
# (method depends on how you're running n8n)
```

### Option B: Using n8n Cloud

1. Go to **Settings** → **Community Nodes**
2. Click **Install a community node**
3. Enter: `n8n-nodes-invoice-api-xhub`
4. Click **Install**

### Option C: Using Docker

Add to your environment variables:

```yaml
environment:
  - N8N_COMMUNITY_PACKAGES=n8n-nodes-invoice-api-xhub
```

### Checkpoint

✅ After restarting n8n, search for "invoice" in the nodes panel - you should see "invoice-api.xhub"

---

## Step 3: Create Credentials in n8n

### What We're Doing

Now we'll configure n8n to use your API key for authenticating with invoice-api.xhub.

### Instructions

1. Open n8n in your browser
2. Go to **Settings** (gear icon) → **Credentials**
3. Click **Add Credential**
4. Search for and select **invoice-api.xhub API**
5. Fill in the credential form:

### Configuration

| Field | Value | Description |
|-------|-------|-------------|
| **API Key** | `sk_test_xxxx...` | Your API key from Step 1 |
| **Base URL** | `https://service.invoice-api.xhub.io` | Production API endpoint |

For sandbox/testing, use:

| Field | Value |
|-------|-------|
| **Base URL** | `https://sandbox.api.invoice-api.xhub.io` |

### Screenshot Guide

```
┌──────────────────────────────────────────────────────┐
│  invoice-api.xhub API                                    │
├──────────────────────────────────────────────────────┤
│                                                      │
│  API Key                                             │
│  ┌────────────────────────────────────────────────┐  │
│  │ your-api-key-here                             │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  Base URL                                            │
│  ┌────────────────────────────────────────────────┐  │
│  │ https://service.invoice-api.xhub.io                    │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  ┌──────────────────┐                                │
│  │  Test Credential │  ← Click this!                 │
│  └──────────────────┘                                │
│                                                      │
└──────────────────────────────────────────────────────┘
```

6. Click **Test Credential** to verify the connection

### Checkpoint

✅ You should see "Connection successful" or a green checkmark

---

## Step 4: Test the Connection with a Workflow

### What We're Doing

Let's create a simple workflow to confirm everything works by fetching supported formats from the API.

### Instructions

1. Create a new workflow (**Workflows** → **Add Workflow**)
2. Add a **Manual Trigger** node (click the + button, search "manual")
3. Add an **invoice-api.xhub** node after the trigger
4. Configure the invoice-api.xhub node:

### Node Configuration

| Setting | Value |
|---------|-------|
| **Credential** | Select your invoice-api.xhub API credential |
| **Operation** | Get Formats |

### Visual Workflow

```
┌─────────────────┐     ┌─────────────────────┐
│  Manual Trigger │ ──► │  invoice-api.xhub       │
│                 │     │  Operation: Get     │
│                 │     │  Formats            │
└─────────────────┘     └─────────────────────┘
```

5. Click **Test Workflow**

### Expected Output

You should see a JSON response with supported countries and formats:

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
          "description": "Deutscher E-Rechnungsstandard"
        },
        {
          "id": "zugferd",
          "name": "ZUGFeRD",
          "description": "Hybrid PDF/XML Format"
        }
      ]
    }
  ]
}
```

### Checkpoint

✅ You see a list of countries and their supported formats

---

## Troubleshooting

### Error: "Unauthorized" or "Invalid API Key"

**Problem:** The API key is incorrect or expired.

**Solution:**
1. Verify you copied the entire API key (they're long!)
2. Check if you're using a test key with production URL or vice versa
3. Generate a new API key if needed

### Error: "Connection refused" or "Network error"

**Problem:** Cannot reach the API server.

**Solution:**
1. Check your internet connection
2. Verify the Base URL is correct (`https://service.invoice-api.xhub.io`)
3. If using a firewall, ensure outbound HTTPS is allowed

### Error: "Cannot find module 'n8n-nodes-invoice-api-xhub'"

**Problem:** The community node isn't installed correctly.

**Solution:**
1. Restart n8n after installation
2. Check the npm installation completed without errors
3. Verify the package is in your `~/.n8n/node_modules/` directory

### Node doesn't appear in search

**Problem:** The node isn't loaded by n8n.

**Solution:**
1. Clear your browser cache
2. Restart n8n completely (not just reload)
3. Check n8n logs for any loading errors

---

## Summary

### What You Accomplished

- Obtained an invoice-api.xhub API key
- Installed the invoice-api.xhub community node
- Configured API credentials in n8n
- Verified the connection with a test workflow

### Key Concepts

- **API Keys** authenticate your requests to invoice-api.xhub
- **Test keys** (`sk_test_`) are for development; **Live keys** (`sk_live_`) are for production
- **Credentials** in n8n securely store your API keys
- The **Get Formats** operation is useful for testing connectivity

### Next Steps

- [Your First Invoice](./first-invoice.md) - Generate your first e-invoice

---

## Resources

- [API Reference - Authentication](../../API-REFERENCE.md#authentifizierung)
- [n8n Credentials Documentation](https://docs.n8n.io/credentials/)
- [invoice-api.xhub Portal](https://portal.invoice-api.xhub.io)
