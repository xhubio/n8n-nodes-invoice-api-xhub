# invoice-api.xhub Tutorials

Learn how to build intelligent e-invoice automation with n8n and invoice-api.xhub.

## Learning Path

This tutorial series takes you from basic setup to building production-ready multi-agent systems for e-invoice processing.

```
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│   Getting Started   │ ─► │   Multi-Agent       │ ─► │   Advanced Topics   │
│   (Beginner)        │    │   Basics            │    │   (Coming Soon)     │
│                     │    │   (Intermediate)    │    │                     │
│ • Setup Credentials │    │ • Understanding     │    │ • Dual Validation   │
│ • First Invoice     │    │   Agents            │    │ • AI Error Diagnosis│
│                     │    │ • Coordinator       │    │ • Human-in-the-Loop │
│                     │    │   Pattern           │    │                     │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
```

---

## 01 - Getting Started

**For:** New n8n users, first-time invoice-api.xhub users

| Tutorial | Description | What You'll Learn |
|----------|-------------|-------------------|
| [Setup Credentials](./01-getting-started/setup-credentials.md) | Get API key, configure n8n credentials, test connection | How to authenticate with invoice-api.xhub API |
| [Your First Invoice](./01-getting-started/first-invoice.md) | Generate a simple PDF invoice step-by-step | Basic invoice generation workflow |

**Prerequisites:** n8n installed ([Installation Guide](https://docs.n8n.io/hosting/installation/))

---

## 03 - Multi-Agent Basics

**For:** Users wanting to build intelligent automation

| Tutorial | Description | What You'll Learn |
|----------|-------------|-------------------|
| [Understanding Agents](./03-multi-agent-basics/understanding-agents.md) | What are agents? Why multi-agent? Architecture overview | Agent concepts and when to use them |
| [Coordinator Pattern](./03-multi-agent-basics/coordinator-pattern.md) | Build the central orchestration agent | Orchestrator-worker pattern in n8n |

**Prerequisites:** Completed Getting Started tutorials

---

## Quick Reference

### Supported Countries

| Region | Countries |
|--------|-----------|
| DACH | Germany (DE), Austria (AT), Switzerland (CH) |
| EU West | France (FR), Belgium (BE), Netherlands (NL) |
| EU South | Italy (IT), Spain (ES), Portugal (PT) |
| EU East | Poland (PL), Czech Republic (CZ), Hungary (HU), Romania (RO), Bulgaria (BG) |

### Popular Formats

| Format | Country | Use Case |
|--------|---------|----------|
| XRechnung | DE | German B2G e-invoices (mandatory) |
| ZUGFeRD | DE/AT/CH | Hybrid PDF/XML for B2B |
| Factur-X | FR | French e-invoice standard |
| FatturaPA | IT | Italian e-invoice standard |

---

## Importable Workflows

Having trouble following along? Download and import these ready-made workflows:

| Workflow | Tutorial | Description |
|----------|----------|-------------|
| [tutorial-01-first-invoice.json](./workflows/tutorial-01-first-invoice.json) | [Your First Invoice](./01-getting-started/first-invoice.md) | Simple PDF invoice generation |
| [tutorial-03-coordinator.json](./workflows/tutorial-03-coordinator.json) | [Coordinator Pattern](./03-multi-agent-basics/coordinator-pattern.md) | Simplified coordinator agent for learning |

**To import:**
1. Download the JSON file
2. In n8n: **Workflows** → **Import from File**
3. Select the downloaded file
4. Update credentials as needed

---

## Resources

- [API Reference](../API-REFERENCE.md) - Complete API documentation
- [Multi-Agent Architecture](../MULTI-AGENT-ARCHITECTURE.md) - System architecture details
- [n8n Documentation](https://docs.n8n.io) - n8n platform documentation
- [invoice-api.xhub Portal](https://portal.invoice-api.xhub.io) - Get your API key

---

## Feedback

Found an issue or have a suggestion? [Open an issue](https://github.com/xhubio/n8n-nodes-invoice-api-xhub/issues) on GitHub.
