# Multi-Agent Architecture for invoice-api.xhub

This documentation describes the multi-agent system for intelligent e-invoice processing with n8n and invoice-api.xhub.

## Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Agent Descriptions](#agent-descriptions)
- [Data Flow](#data-flow)
- [AI Model Configuration](#ai-model-configuration)
- [Human-in-the-Loop](#human-in-the-loop)
- [Redis State Management](#redis-state-management)
- [Deployment](#deployment)
- [Configuration](#configuration)

---

## Overview

The multi-agent system enables intelligent, automated e-invoice processing through specialized agents that work together in an orchestrated manner.

### Key Features

- **Modular Architecture**: Each agent is a standalone n8n workflow
- **AI-Powered Processing**: Claude 3.5 for intelligent analysis and decisions
- **Dual Validation**: API-based and AI-based verification with confidence score
- **Automatic Error Handling**: AI-powered diagnosis and auto-fix
- **Human-in-the-Loop**: Escalation for low confidence scores
- **State Management**: Redis for persistent state management

---

## System Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         Multi-Agent Invoice System                            │
└──────────────────────────────────────────────────────────────────────────────┘

                                    ┌─────────────────┐
                                    │   HTTP Client   │
                                    │  (API Request)  │
                                    └────────┬────────┘
                                             │
                                             ▼
                              ┌──────────────────────────┐
                              │    Coordinator Agent     │
                              │  (01-coordinator-agent)  │
                              │                          │
                              │  • Request Routing       │
                              │  • Action Detection      │
                              │  • Response Aggregation  │
                              └─────┬──────┬──────┬─────┘
                                    │      │      │
           ┌────────────────────────┼──────┼──────┼────────────────────────┐
           │                        │      │      │                        │
           ▼                        ▼      ▼      ▼                        ▼
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│  Generation Agent   │  │   Parsing Agent     │  │  Validation Agent   │
│ (03-generation-     │  │ (04-parsing-agent)  │  │ (02-validation-     │
│      agent)         │  │                     │  │      agent)         │
│                     │  │                     │  │                     │
│ • Text → Invoice    │  │ • Document Parse    │  │ • API Validation    │
│ • JSON → Document   │  │ • AI Enrichment     │  │ • AI Validation     │
│ • Format Conversion │  │ • Data Quality      │  │ • Confidence Score  │
└──────────┬──────────┘  └──────────┬──────────┘  └──────────┬──────────┘
           │                        │                        │
           └────────────────────────┼────────────────────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │  Error Handler Agent │
                         │ (05-error-handler-   │
                         │       agent)         │
                         │                      │
                         │ • AI Diagnosis       │
                         │ • Auto-Fix           │
                         │ • Escalation         │
                         │ • Redis Storage      │
                         └──────────┬───────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
           ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
           │    Slack    │  │    Redis    │  │   Response  │
           │  (Escalate) │  │  (Storage)  │  │   (HTTP)    │
           └─────────────┘  └─────────────┘  └─────────────┘
```

### Component Overview

| Component | Workflow File | Description |
|-----------|---------------|-------------|
| Coordinator Agent | `01-coordinator-agent.json` | Central orchestration |
| Validation Agent | `02-validation-agent.json` | Dual validation |
| Generation Agent | `03-generation-agent.json` | Document generation |
| Parsing Agent | `04-parsing-agent.json` | Document parsing |
| Error Handler Agent | `05-error-handler-agent.json` | Error handling |

---

## Agent Descriptions

### 1. Coordinator Agent

The Coordinator Agent is the central entry point for all requests.

**File:** `multi-agent-workflows/01-coordinator-agent.json`

**Functions:**
- Webhook endpoint for external requests
- Request routing based on `action` parameter
- Result aggregation
- Error forwarding to Error Handler

**Workflow Structure:**

```
Webhook → Extract Request → Route by Action → [Agent] → Merge Results → Check Success → Response
                                    │
                                    ├── generate → Generation Agent
                                    ├── parse    → Parsing Agent
                                    ├── validate → Validation Agent
                                    └── unknown  → Error Response
```

**Environment Variables:**

| Variable | Description |
|----------|-------------|
| `GENERATION_AGENT_WORKFLOW_ID` | Workflow ID of the Generation Agent |
| `PARSING_AGENT_WORKFLOW_ID` | Workflow ID of the Parsing Agent |
| `VALIDATION_AGENT_WORKFLOW_ID` | Workflow ID of the Validation Agent |
| `ERROR_HANDLER_WORKFLOW_ID` | Workflow ID of the Error Handler |

**API Request Format:**

```json
{
  "action": "validate",
  "data": {
    "invoice": { ... },
    "countryCode": "DE"
  },
  "options": {
    "strictMode": false
  }
}
```

---

### 2. Validation Agent

The Validation Agent performs dual validation: API-based and AI-based.

**File:** `multi-agent-workflows/02-validation-agent.json`

**Functions:**
- Parallel validation (API + AI)
- Confidence score calculation (0-100%)
- Error detection and classification
- Low-confidence escalation (< 70%)

**Workflow Structure:**

```
Trigger → Extract Parameters ─┬─→ invoice-api.xhub Validate ──┬─→ Merge → Combine Results → Low Confidence? → Return/Notify
                              │                           │
                              └─→ AI Validation (Claude) ─┘
```

**Dual Validation:**

| Source | Weight | Description |
|--------|--------|-------------|
| API Validation | 70% | invoice-api.xhub API validation |
| AI Validation | 30% | Claude 3.5 Sonnet analysis |

**Confidence Score Calculation:**

```javascript
const overallConfidence = Math.round(
  apiConfidence * 0.7 +  // 70% API
  aiConfidence * 0.3     // 30% AI
);
```

**AI Prompt (abbreviated):**

```
You are an expert e-invoice validation agent. Analyze the provided invoice data and identify any issues.

Consider the following validation rules:
- Required fields (seller, buyer, items, totals)
- VAT ID format validation
- Date format validation
- Amount calculations
- Country-specific requirements
```

**Output:**

```json
{
  "success": true,
  "validation": {
    "isValid": true,
    "confidence": 85,
    "countryCode": "DE",
    "errors": [],
    "warnings": [],
    "errorCount": 0,
    "warningCount": 0,
    "suggestions": ["Consider adding payment terms"],
    "apiResult": { "valid": true, "errorCount": 0 },
    "aiResult": { "confidence": 75, "isValid": true }
  }
}
```

---

### 3. Generation Agent

The Generation Agent creates e-invoices from various input formats.

**File:** `multi-agent-workflows/03-generation-agent.json`

**Functions:**
- JSON → E-invoice conversion
- Text/Email → Structured data (AI extraction)
- Format generation (XRechnung, ZUGFeRD, etc.)
- Binary output

**Supported Input Types:**

| Type | Description | AI Processing |
|------|-------------|---------------|
| `json` | Structured invoice data | No |
| `text` | Free-text invoice | Yes (Claude) |
| `email` | Email with invoice info | Yes (Claude) |

**Workflow Structure:**

```
Trigger → Extract Parameters → Route Input Type ─┬─→ Prepare JSON ──────────────┬─→ invoice-api.xhub Generate → Success?
                                                 │                               │
                                                 └─→ AI Extract → Parse Output ──┘
```

**AI Text Extraction:**

With `inputType: "text"` or `inputType: "email"`, Claude automatically extracts invoice data:

```json
{
  "action": "generate",
  "data": {
    "inputType": "text",
    "rawInput": "Invoice No. 2025-001\nFrom: ACME GmbH, Berlin\nTo: Customer AG, Munich\n10 hours consulting at 150 EUR\nVAT 19%: 285 EUR\nTotal: 1785 EUR",
    "countryCode": "DE",
    "format": "xrechnung"
  }
}
```

---

### 4. Parsing Agent

The Parsing Agent extracts data from e-invoice documents and optionally enriches them with AI.

**File:** `multi-agent-workflows/04-parsing-agent.json`

**Functions:**
- Document parsing (XML, PDF)
- Optional AI enrichment
- Data quality score
- Detect missing fields

**Workflow Structure:**

```
Trigger → Extract Parameters → invoice-api.xhub Parse → Parse Success? ─┬─→ Enrich with AI? ─┬─→ AI Enrich → Combine
                                                                    │                     │
                                                                    │                     └─→ Build Simple Result
                                                                    │
                                                                    └─→ Build Error Result
```

**AI Enrichment:**

With `enrichWithAI: true` (default), Claude analyzes the parsed data:

```json
{
  "summary": "B2B invoice for consulting services",
  "dataQualityScore": 85,
  "missingFields": ["dueDate", "paymentTerms"],
  "suggestions": ["Add payment terms"],
  "additionalMetadata": {
    "businessType": "B2B",
    "industry": "Consulting"
  }
}
```

**Output:**

```json
{
  "success": true,
  "parsing": {
    "invoice": { ... },
    "format": "xrechnung",
    "hash": "sha256:..."
  },
  "enrichment": {
    "summary": "...",
    "dataQualityScore": 85,
    "missingFields": ["dueDate"],
    "suggestions": ["..."]
  },
  "metadata": {
    "countryCode": "DE",
    "filename": "invoice.xml",
    "enrichedWithAI": true
  }
}
```

---

### 5. Error Handler Agent

The Error Handler Agent diagnoses errors and attempts automatic corrections.

**File:** `multi-agent-workflows/05-error-handler-agent.json`

**Functions:**
- AI-powered error diagnosis
- Automatic correction attempts
- Error classification and severity
- Escalation to Slack
- Redis persistence

**Workflow Structure:**

```
Trigger → Extract Error Context → AI Error Diagnosis → Parse Diagnosis → Auto-Fix Possible?
                                                                                │
                                                                    ┌───────────┴───────────┐
                                                                    ▼                       ▼
                                                            Attempt Auto-Fix        Escalate?
                                                                    │                       │
                                                                    │          ┌────────────┴────────────┐
                                                                    │          ▼                        ▼
                                                                    │    Notify Slack              No Escalation
                                                                    │          │                        │
                                                                    └──────────┴────────────────────────┘
                                                                                        │
                                                                                        ▼
                                                                               Store Error in Redis
```

**Error Classification:**

| Classification | Description | HTTP Code |
|----------------|-------------|-----------|
| `validation` | Validation error | 400 |
| `format` | Format error | 400 |
| `auth` | Authentication error | 401 |
| `network` | Network error | 503 |
| `data` | Data error | 422 |
| `unknown` | Unknown error | 500 |

**Severity Levels:**

| Level | Description | Action |
|-------|-------------|--------|
| `critical` | System-critical | Immediate escalation |
| `high` | Severe | Escalation |
| `medium` | Moderate | Logging |
| `low` | Minor | Logging only |

**AI Diagnosis Output:**

```json
{
  "diagnosis": {
    "rootCause": "VAT ID format invalid for Germany",
    "classification": "validation",
    "severity": "medium",
    "explanation": "The VAT ID 'DE12345' does not match the German format (DE + 9 digits)"
  },
  "autoFix": {
    "possible": true,
    "action": "Correct format",
    "fixedData": {
      "seller": {
        "vatId": "DE123456789"
      }
    }
  },
  "manualSteps": [
    "Verify the correct VAT ID with the customer",
    "Update the master data"
  ],
  "escalate": false,
  "escalationReason": null
}
```

---

## Data Flow

### Request Lifecycle

```
1. Client Request
   │
   ▼
2. Coordinator Agent
   ├── Validate request
   ├── Extract action
   └── Decide routing
   │
   ▼
3. Specialized Agent (Validation/Generation/Parsing)
   ├── Call invoice-api.xhub API
   ├── Perform AI analysis
   └── Prepare result
   │
   ▼
4. Success?
   ├── Yes → Response to client
   └── No → Error Handler Agent
              ├── Diagnosis
              ├── Attempt auto-fix
              └── Escalate if needed
   │
   ▼
5. Response to Client
```

### Data Format Between Agents

All agents communicate via a standardized format:

```json
{
  "requestId": "uuid-v4",
  "action": "validate|generate|parse",
  "data": { ... },
  "options": { ... },
  "timestamp": "ISO 8601"
}
```

---

## AI Model Configuration

### Models Used

| Agent | Model | Max Tokens | Temperature | Usage |
|-------|-------|------------|-------------|-------|
| Validation Agent | Claude 3.5 Sonnet | 4096 | 0.1 | Precise validation |
| Generation Agent | Claude 3.5 Sonnet | 4096 | 0.1 | Text extraction |
| Parsing Agent | Claude 3.5 Haiku | 2048 | 0.2 | Fast enrichment |
| Error Handler | Claude 3.5 Sonnet | 4096 | 0.2 | Error diagnosis |

### Anthropic API Credentials

Create credentials in n8n of type "Anthropic API":

```
Name: Anthropic API
API Key: sk-ant-api03-...
```

### Model Selection Rationale

| Model | Strengths | Usage |
|-------|-----------|-------|
| **Sonnet** | High precision, good reasoning | Validation, error diagnosis |
| **Haiku** | Fast, cost-effective | Simple enrichment |

---

## Human-in-the-Loop

### Escalation Criteria

| Criterion | Threshold | Action |
|-----------|-----------|--------|
| Confidence Score | < 70% | Slack notification |
| Error Severity | critical/high | Immediate escalation |
| Auto-fix failed | - | Escalation |
| AI diagnosis uncertain | - | Escalation |

### Slack Integration

**Configuration:**

1. Create Slack App with Bot Token
2. Create n8n Credentials (Slack API)
3. Configure channels: `#invoice-validation-review` and `#invoice-errors`

**Message Format:**

```
:warning: *Low Confidence Validation*

Request ID: abc-123
Confidence: 65%

Errors: 2
Warnings: 1

Please review this invoice validation manually.
```

---

## Redis State Management

### Usage

Redis is used for error and state persistence.

**Configuration:**

```
Host: localhost
Port: 6379
Database: 0
```

### Key Schema

| Pattern | TTL | Description |
|---------|-----|-------------|
| `invoice:error:{requestId}` | 24h | Error details |
| `invoice:state:{requestId}` | 1h | Processing status |
| `invoice:result:{requestId}` | 4h | Result cache |

### Example Entry

```json
{
  "key": "invoice:error:req-abc123",
  "value": {
    "requestId": "req-abc123",
    "error": "Validation failed",
    "diagnosis": { ... },
    "timestamp": "2025-01-15T10:30:00Z"
  },
  "ttl": 86400
}
```

---

## Deployment

### Prerequisites

- n8n (>= 1.0.0) with Community Nodes support
- Redis Server
- Anthropic API Key
- invoice-api.xhub API Key
- Slack Workspace (optional)

### Installation

1. **Install n8n Nodes:**
   ```bash
   npm install n8n-nodes-invoice-api-xhub
   ```

2. **Import Workflows:**
   ```bash
   # In n8n UI: Settings → Import Workflow
   # Import all files from multi-agent-workflows/
   ```

3. **Set Environment Variables:**
   ```bash
   export GENERATION_AGENT_WORKFLOW_ID=<workflow-id>
   export PARSING_AGENT_WORKFLOW_ID=<workflow-id>
   export VALIDATION_AGENT_WORKFLOW_ID=<workflow-id>
   export ERROR_HANDLER_WORKFLOW_ID=<workflow-id>
   ```

4. **Configure Credentials:**
   - invoice-api.xhub API
   - Anthropic API
   - Slack API (optional)
   - Redis

5. **Activate Workflows:**
   - Activate Coordinator Agent
   - Activate all sub-agents

### Docker Compose Example

```yaml
version: '3.8'
services:
  n8n:
    image: n8nio/n8n
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - GENERATION_AGENT_WORKFLOW_ID=xyz
      - PARSING_AGENT_WORKFLOW_ID=xyz
      - VALIDATION_AGENT_WORKFLOW_ID=xyz
      - ERROR_HANDLER_WORKFLOW_ID=xyz
    volumes:
      - n8n_data:/home/node/.n8n
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  n8n_data:
```

---

## Configuration

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `INVOICE_XHUB_API_KEY` | API key for invoice-api.xhub | sk_live_... |
| `ANTHROPIC_API_KEY` | API key for Claude | sk-ant-api03-... |
| `SLACK_BOT_TOKEN` | Slack bot token | xoxb-... |
| `REDIS_URL` | Redis connection URL | redis://localhost:6379 |
| `CONFIDENCE_THRESHOLD` | Escalation threshold | 70 |

### Finding Workflow IDs

After importing workflows into n8n:

1. Open each workflow
2. Copy the ID from the URL: `https://n8n.example.com/workflow/<ID>`
3. Set the corresponding environment variable

### Customizations

**Change Confidence Threshold:**

In `02-validation-agent.json`, Node "Low Confidence?":
```javascript
// Default: 70
leftValue: "={{ $json.validation.confidence }}",
rightValue: 70,  // Change this value
```

**Change Slack Channel:**

Adjust the `channel` parameter in the respective workflow files.

---

## Monitoring & Logging

### n8n Executions

All workflow executions are stored in n8n:
- Settings → Executions
- Filter by workflow or status

### Metrics

| Metric | Description |
|--------|-------------|
| Execution Time | Processing duration |
| Success Rate | Success rate |
| Error Rate | Error rate |
| Escalation Rate | Escalation rate |
| Confidence Distribution | Distribution of confidence scores |

### Recommended Logging

```javascript
// In Code nodes for debug logging
console.log(JSON.stringify({
  level: 'info',
  requestId: $json.requestId,
  action: $json.action,
  timestamp: new Date().toISOString()
}));
```

---

## Best Practices

1. **Workflow IDs as Environment Variables**: Enables easy updates
2. **Redis for Critical States**: Prevents data loss
3. **Adjust Confidence Thresholds**: Depending on use case
4. **Separate Slack Channels**: Different channels for different severity
5. **Regular Backups**: Back up workflow definitions
6. **Observe Rate Limits**: For both invoice-api.xhub and Anthropic API

---

## Further Links

- [invoice-api.xhub API Documentation](./API-REFERENCE.md)
- [n8n Documentation](https://docs.n8n.io)
- [Anthropic Claude API](https://docs.anthropic.com)
- [Tutorial: PDF Validation](../../tutorials/PDF-VALIDATION-TUTORIAL.md)
