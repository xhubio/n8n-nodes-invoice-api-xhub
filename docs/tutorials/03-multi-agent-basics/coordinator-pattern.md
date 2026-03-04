# Coordinator Pattern

## Overview

In this tutorial, you'll build a Coordinator Agent - the central orchestrator that routes incoming requests to specialized worker agents. This is the foundation of the multi-agent system.

## Prerequisites

- [ ] Completed [Understanding Agents](./understanding-agents.md) tutorial
- [ ] invoice-api.xhub API credentials configured
- [ ] Familiarity with n8n workflows

## What You'll Learn

- How to create a webhook endpoint for agent requests
- How to extract and validate request parameters
- How to route requests using a Switch node
- How to call sub-workflows (worker agents)
- How to aggregate results and handle errors

---

## The Coordinator's Role

### What It Does

The Coordinator Agent is the "traffic controller" of the multi-agent system:

```
┌──────────────────────────────────────────────────────────────────┐
│                        Coordinator Agent                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. RECEIVE     Webhook receives HTTP requests                   │
│       │                                                          │
│       ▼                                                          │
│  2. EXTRACT     Parse action, data, options from request body    │
│       │                                                          │
│       ▼                                                          │
│  3. ROUTE       Switch on action → generate | parse | validate   │
│       │                                                          │
│       ├──────────────────┬────────────────────┐                  │
│       ▼                  ▼                    ▼                  │
│  4. DELEGATE    Call the appropriate worker agent                │
│       │                  │                    │                  │
│       └──────────────────┴────────────────────┘                  │
│       │                                                          │
│       ▼                                                          │
│  5. CHECK       Was the operation successful?                    │
│       │                                                          │
│       ├─► Success → Return result to client                      │
│       └─► Failure → Call Error Handler Agent                     │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Checkpoint

✅ You understand the 5 steps: Receive → Extract → Route → Delegate → Check

---

## Step 1: Create the Workflow

### What We're Doing

Let's create the coordinator workflow and add the webhook trigger.

### Instructions

1. Create a new workflow in n8n
2. Name it "invoice-api.xhub - Coordinator Agent"
3. Add a **Webhook** node

### Webhook Configuration

| Setting | Value |
|---------|-------|
| **HTTP Method** | POST |
| **Path** | `invoice-agent` |
| **Response Mode** | Using 'Respond to Webhook' Node |

### Why "Respond to Webhook" Mode?

This mode lets us:
- Process the request through multiple steps
- Decide the response based on the outcome
- Return different HTTP status codes for success/failure

### Visual So Far

```
┌─────────────────────┐
│  Webhook            │
│  POST /invoice-agent│
│                     │
│  Response Mode:     │
│  Respond to Webhook │
└─────────────────────┘
```

### Checkpoint

✅ You have a webhook that accepts POST requests at `/webhook/invoice-agent`

---

## Step 2: Extract Request Parameters

### What We're Doing

We'll use a Set node to extract and normalize the incoming request data.

### Instructions

1. Add a **Set** node after the Webhook
2. Name it "Extract Request"
3. Configure the following assignments:

### Set Node Configuration

Add these assignments in "Manual Mapping" mode:

| Name | Type | Value |
|------|------|-------|
| `requestId` | String | `{{ $runId }}` |
| `action` | String | `{{ $json.body.action ?? 'unknown' }}` |
| `data` | Object | `{{ $json.body.data ?? {} }}` |
| `options` | Object | `{{ $json.body.options ?? {} }}` |
| `timestamp` | String | `{{ $now.toISO() }}` |

### What Each Field Does

| Field | Purpose |
|-------|---------|
| `requestId` | Unique ID for tracking through all agents |
| `action` | Which operation: generate, parse, validate |
| `data` | The invoice data or document |
| `options` | Configuration flags |
| `timestamp` | When the request was received |

### Visual So Far

```
┌─────────────────────┐     ┌─────────────────────┐
│  Webhook            │ ──► │  Extract Request    │
│  POST /invoice-agent│     │  Set: requestId,    │
│                     │     │  action, data, etc. │
└─────────────────────┘     └─────────────────────┘
```

### Checkpoint

✅ Request data is extracted into a clean structure

---

## Step 3: Route by Action

### What We're Doing

A Switch node will route the request to the correct worker agent based on the `action` field.

### Instructions

1. Add a **Switch** node after "Extract Request"
2. Name it "Route by Action"
3. Configure routing rules

### Switch Node Configuration

**Mode:** Rules

Add these rules:

| Rule | Condition | Output Name |
|------|-----------|-------------|
| 1 | `{{ $json.action }}` equals `generate` | generate |
| 2 | `{{ $json.action }}` equals `parse` | parse |
| 3 | `{{ $json.action }}` equals `validate` | validate |
| Fallback | (all others) | extra |

### Configuration Details

For each rule:
```
Left Value:   {{ $json.action }}
Operation:    Equals
Right Value:  generate (or parse, or validate)
Output:       Rename to "generate" (or parse, or validate)
```

### Visual So Far

```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│  Webhook            │ ──► │  Extract Request    │ ──► │  Route by Action    │
│                     │     │                     │     │  Switch:            │
│                     │     │                     │     │  • generate         │
│                     │     │                     │     │  • parse            │
│                     │     │                     │     │  • validate         │
│                     │     │                     │     │  • (fallback)       │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
```

### Checkpoint

✅ Requests are routed based on the action field

---

## Step 4: Call Worker Agents

### What We're Doing

For each route, we'll add an Execute Workflow node to call the corresponding worker agent.

### Instructions

1. From the "generate" output, add an **Execute Workflow** node
2. Name it "Generation Agent"
3. Repeat for "parse" and "validate" outputs
4. For the fallback output, add a **Set** node for error response

### Execute Workflow Configuration

For each agent:

| Setting | Value |
|---------|-------|
| **Source** | Database |
| **Workflow** | By ID |
| **Workflow ID** | `{{ $env.GENERATION_AGENT_WORKFLOW_ID }}` |
| **Mode** | Each Item |
| **Wait For Sub-Workflow** | Yes |

> **Note:** Using environment variables for workflow IDs makes it easy to update without editing the workflow.

### Environment Variables

You'll need to set these in your n8n environment:

```bash
GENERATION_AGENT_WORKFLOW_ID=<workflow-id>
PARSING_AGENT_WORKFLOW_ID=<workflow-id>
VALIDATION_AGENT_WORKFLOW_ID=<workflow-id>
ERROR_HANDLER_WORKFLOW_ID=<workflow-id>
```

### Unknown Action Handler

For the fallback output, add a Set node:

| Name | Type | Value |
|------|------|-------|
| `success` | Boolean | `false` |
| `error` | String | `Unknown action. Supported: generate, parse, validate` |
| `action` | String | `{{ $('Extract Request').item.json.action }}` |

### Visual So Far

```
                                           ┌─────────────────────┐
                                      ┌──► │  Generation Agent   │
                                      │    │  Execute Workflow   │
                                      │    └─────────────────────┘
┌──────────────┐    ┌──────────────┐  │    ┌─────────────────────┐
│   Webhook    │ ─► │   Extract    │ ─┼──► │  Parsing Agent      │
│              │    │   Request    │  │    │  Execute Workflow   │
└──────────────┘    └──────────────┘  │    └─────────────────────┘
                           │          │    ┌─────────────────────┐
                           ▼          ├──► │  Validation Agent   │
                    ┌──────────────┐  │    │  Execute Workflow   │
                    │ Route by     │ ─┘    └─────────────────────┘
                    │ Action       │       ┌─────────────────────┐
                    └──────────────┘  └──► │  Unknown Action     │
                                           │  Error              │
                                           └─────────────────────┘
```

### Checkpoint

✅ Each action routes to its corresponding worker agent

---

## Step 5: Merge Results

### What We're Doing

All four outputs (3 agents + 1 error) need to merge back into a single path.

### Instructions

1. Add a **Merge** node
2. Connect all four outputs to the Merge node
3. Keep default settings (Append mode)

### Merge Configuration

| Setting | Value |
|---------|-------|
| **Mode** | Append |
| **Number of Inputs** | 4 |

### Visual So Far

```
                                           ┌─────────────────────┐
                                      ┌──► │  Generation Agent   │ ──┐
                                      │    └─────────────────────┘   │
┌──────────────┐    ┌──────────────┐  │    ┌─────────────────────┐   │    ┌─────────────┐
│   Webhook    │ ─► │   Extract    │ ─┼──► │  Parsing Agent      │ ──┼──► │   Merge     │
│              │    │   Request    │  │    └─────────────────────┘   │    │   Results   │
└──────────────┘    └──────────────┘  │    ┌─────────────────────┐   │    └─────────────┘
                           │          ├──► │  Validation Agent   │ ──┤
                           ▼          │    └─────────────────────┘   │
                    ┌──────────────┐  │    ┌─────────────────────┐   │
                    │ Route by     │ ─┴──► │  Unknown Action     │ ──┘
                    │ Action       │       │  Error              │
                    └──────────────┘       └─────────────────────┘
```

### Checkpoint

✅ All paths converge at the Merge node

---

## Step 6: Check Success and Respond

### What We're Doing

We'll check if the operation succeeded and respond appropriately.

### Instructions

1. Add an **IF** node after Merge
2. Name it "Check Success"
3. Add two **Respond to Webhook** nodes (success and error)
4. Optionally, add Error Handler for failures

### IF Node Configuration

| Setting | Value |
|---------|-------|
| **Condition** | `{{ $json.success }}` equals `true` |

### Success Response Node

| Setting | Value |
|---------|-------|
| **Respond With** | JSON |
| **Response Code** | 200 |
| **Response Body** | See below |

```javascript
{
  "success": true,
  "requestId": "{{ $('Extract Request').item.json.requestId }}",
  "result": {{ JSON.stringify($json) }},
  "timestamp": "{{ $now.toISO() }}"
}
```

### Error Response Node

| Setting | Value |
|---------|-------|
| **Respond With** | JSON |
| **Response Code** | `{{ $json.errorCode ?? 500 }}` |
| **Response Body** | See below |

```javascript
{
  "success": false,
  "requestId": "{{ $('Extract Request').item.json.requestId }}",
  "error": "{{ $json.error ?? 'Processing failed' }}",
  "errorDetails": {{ $json.errorDetails ?? null }},
  "timestamp": "{{ $now.toISO() }}"
}
```

### Optional: Error Handler

Before the error response, you can call the Error Handler Agent:

```
Check Success (false) ──► Error Handler Agent ──► Respond Error
```

### Checkpoint

✅ Success returns 200 with result; failure returns error with details

---

## Complete Workflow Structure

Here's the final coordinator workflow:

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                           Coordinator Agent                                   │
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌─────────────┐              │
│  │ Webhook  │ ─► │ Extract  │ ─► │ Route by │ ─► │ Generation  │ ─┐           │
│  │          │    │ Request  │    │ Action   │    │ Agent       │  │           │
│  └──────────┘    └──────────┘    │          │    └─────────────┘  │           │
│                                  │          │    ┌─────────────┐  │           │
│                                  │          ├─►  │ Parsing     │ ─┤           │
│                                  │          │    │ Agent       │  │           │
│                                  │          │    └─────────────┘  │           │
│                                  │          │    ┌─────────────┐  │  ┌──────┐ │
│                                  │          ├─►  │ Validation  │ ─┼► │Merge │ │
│                                  │          │    │ Agent       │  │  └───┬──┘ │
│                                  │          │    └─────────────┘  │      │    │
│                                  │          │    ┌─────────────┐  │      │    │
│                                  │          └─►  │ Unknown     │ ─┘      │    │
│                                  └──────────┘    │ Action Err  │         │    │
│                                                  └─────────────┘         │    │
│                                                                          │    │
│                                          ┌───────────────────────────────┘    │
│                                          │                                    │
│                                          ▼                                    │
│                                   ┌─────────────┐                             │
│                                   │ Check       │                             │
│                                   │ Success     │                             │
│                                   └──────┬──────┘                             │
│                                          │                                    │
│                               ┌──────────┴──────────┐                         │
│                               │                     │                         │
│                               ▼                     ▼                         │
│                        ┌─────────────┐       ┌─────────────┐                  │
│                        │ Respond     │       │ Error       │                  │
│                        │ Success     │       │ Handler     │                  │
│                        │ (200)       │       │ Agent       │                  │
│                        └─────────────┘       └──────┬──────┘                  │
│                                                     │                         │
│                                                     ▼                         │
│                                              ┌─────────────┐                  │
│                                              │ Respond     │                  │
│                                              │ Error       │                  │
│                                              │ (4xx/5xx)   │                  │
│                                              └─────────────┘                  │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

---

## Step 7: Test the Coordinator

### What We're Doing

Let's test the coordinator with sample requests.

### Test: Valid Generate Request

Send this request to your webhook URL:

```bash
curl -X POST http://localhost:5678/webhook/invoice-agent \
  -H "Content-Type: application/json" \
  -d '{
    "action": "generate",
    "data": {
      "countryCode": "DE",
      "format": "pdf",
      "invoice": {
        "invoiceNumber": "INV-001",
        "invoiceDate": "2025-01-15",
        "seller": { "name": "ACME GmbH", "vatId": "DE123456789", "address": { "street": "Main St", "city": "Berlin", "postalCode": "10115", "country": "DE" }},
        "buyer": { "name": "Customer", "address": { "street": "Other St", "city": "Munich", "postalCode": "80331", "country": "DE" }},
        "lineItems": [{ "description": "Service", "quantity": 1, "unit": "C62", "unitPrice": 100, "vatRate": 19 }],
        "currency": "EUR",
        "total": 119
      }
    }
  }'
```

### Expected Response (Success)

```json
{
  "success": true,
  "requestId": "abc123",
  "result": {
    "success": true,
    "format": "pdf",
    "filename": "invoice-INV-001.pdf"
  },
  "timestamp": "2025-01-15T10:30:00Z"
}
```

### Test: Invalid Action

```bash
curl -X POST http://localhost:5678/webhook/invoice-agent \
  -H "Content-Type: application/json" \
  -d '{"action": "invalid", "data": {}}'
```

### Expected Response (Error)

```json
{
  "success": false,
  "requestId": "xyz789",
  "error": "Unknown action. Supported: generate, parse, validate",
  "timestamp": "2025-01-15T10:31:00Z"
}
```

### Checkpoint

✅ Valid requests route correctly; invalid actions return an error

---

## Troubleshooting

### Error: "Workflow not found"

**Problem:** The Execute Workflow node can't find the worker agent.

**Solution:**
1. Verify the workflow ID is correct
2. Check that the environment variable is set
3. Ensure the worker workflow exists and is active

### Error: "Cannot read property of undefined"

**Problem:** The request body structure doesn't match expectations.

**Solution:**
1. Ensure client sends `action` and `data` in the request body
2. Add null checks: `$json.body?.action ?? 'unknown'`

### Webhook returns 500 immediately

**Problem:** An early node is failing.

**Solution:**
1. Check the execution log for the specific error
2. Verify the Webhook node's Response Mode is "Respond to Webhook"
3. Ensure there's a Respond to Webhook node on all paths

### Sub-workflow never returns

**Problem:** Worker agent has no output or is in infinite loop.

**Solution:**
1. Check "Wait For Sub-Workflow" is enabled
2. Verify the worker workflow has an output
3. Add timeout handling if needed

---

## Summary

### What You Built

A Coordinator Agent that:
- Receives requests via webhook
- Extracts and validates parameters
- Routes to the correct worker agent
- Handles errors gracefully
- Returns structured responses

### The Orchestrator-Worker Pattern

```
┌─────────────────────────────────────────────────────────────────┐
│  Orchestrator (Coordinator)                                     │
│  • Single entry point                                           │
│  • Routing logic                                                │
│  • Result aggregation                                           │
│  • Error handling                                               │
└─────────────────────────────────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  Worker 1       │  │  Worker 2       │  │  Worker 3       │
│  (Specialized)  │  │  (Specialized)  │  │  (Specialized)  │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

### Key Takeaways

| Concept | Implementation |
|---------|----------------|
| **Single Entry Point** | Webhook node |
| **Request Parsing** | Set node with null-safe expressions |
| **Routing** | Switch node with rules |
| **Sub-Workflow Calls** | Execute Workflow node |
| **Result Handling** | Merge + IF nodes |
| **Response** | Respond to Webhook nodes |

### What's Next

Now you have the coordinator! The next steps would be to:

1. **Build Worker Agents** - Create the Generation, Validation, and Parsing agents
2. **Add AI Enhancement** - Integrate Claude for intelligent processing
3. **Implement Error Handler** - Build the error diagnosis agent

---

## Complete Workflow JSON

You can import this workflow directly into n8n.

### Option 1: Download and Import

Download the workflow JSON file and import it in n8n:

**[Download tutorial-03-coordinator.json](../workflows/tutorial-03-coordinator.json)**

To import:
1. In n8n, go to **Workflows** → **Import from File**
2. Select the downloaded JSON file
3. Activate the workflow to enable the webhook endpoint
4. Test with the curl commands below

### Option 2: Copy and Paste

Copy the JSON below and import directly:

```json
{
  "name": "invoice-api.xhub - Coordinator Agent",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "invoice-agent",
        "responseMode": "responseNode",
        "options": {}
      },
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "position": [240, 300]
    },
    {
      "parameters": {
        "assignments": {
          "assignments": [
            { "name": "requestId", "value": "={{ $runId }}", "type": "string" },
            { "name": "action", "value": "={{ $json.body.action ?? 'unknown' }}", "type": "string" },
            { "name": "data", "value": "={{ $json.body.data ?? {} }}", "type": "object" },
            { "name": "options", "value": "={{ $json.body.options ?? {} }}", "type": "object" },
            { "name": "timestamp", "value": "={{ $now.toISO() }}", "type": "string" }
          ]
        }
      },
      "name": "Extract Request",
      "type": "n8n-nodes-base.set",
      "position": [440, 300]
    },
    {
      "parameters": {
        "rules": {
          "rules": [
            {
              "conditions": {
                "conditions": [{ "leftValue": "={{ $json.action }}", "rightValue": "generate", "operator": { "type": "string", "operation": "equals" }}]
              },
              "renameOutput": true,
              "outputKey": "generate"
            },
            {
              "conditions": {
                "conditions": [{ "leftValue": "={{ $json.action }}", "rightValue": "parse", "operator": { "type": "string", "operation": "equals" }}]
              },
              "renameOutput": true,
              "outputKey": "parse"
            },
            {
              "conditions": {
                "conditions": [{ "leftValue": "={{ $json.action }}", "rightValue": "validate", "operator": { "type": "string", "operation": "equals" }}]
              },
              "renameOutput": true,
              "outputKey": "validate"
            }
          ],
          "fallbackOutput": { "fallbackOutput": "extra" }
        }
      },
      "name": "Route by Action",
      "type": "n8n-nodes-base.switch",
      "position": [640, 300]
    },
    {
      "parameters": {
        "assignments": {
          "assignments": [
            { "name": "success", "value": false, "type": "boolean" },
            { "name": "error", "value": "Unknown action. Supported: generate, parse, validate", "type": "string" }
          ]
        }
      },
      "name": "Unknown Action",
      "type": "n8n-nodes-base.set",
      "position": [880, 500]
    },
    {
      "parameters": {},
      "name": "Merge Results",
      "type": "n8n-nodes-base.merge",
      "position": [1100, 300]
    },
    {
      "parameters": {
        "conditions": {
          "conditions": [{ "leftValue": "={{ $json.success }}", "rightValue": true, "operator": { "type": "boolean", "operation": "equals" }}]
        }
      },
      "name": "Check Success",
      "type": "n8n-nodes-base.if",
      "position": [1300, 300]
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{ JSON.stringify({ success: true, requestId: $('Extract Request').item.json.requestId, result: $json, timestamp: $now.toISO() }) }}",
        "options": { "responseCode": 200 }
      },
      "name": "Respond Success",
      "type": "n8n-nodes-base.respondToWebhook",
      "position": [1520, 200]
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{ JSON.stringify({ success: false, requestId: $('Extract Request').item.json.requestId, error: $json.error ?? 'Processing failed', timestamp: $now.toISO() }) }}",
        "options": { "responseCode": "={{ $json.errorCode ?? 500 }}" }
      },
      "name": "Respond Error",
      "type": "n8n-nodes-base.respondToWebhook",
      "position": [1520, 400]
    }
  ],
  "connections": {
    "Webhook": { "main": [[{ "node": "Extract Request", "type": "main", "index": 0 }]] },
    "Extract Request": { "main": [[{ "node": "Route by Action", "type": "main", "index": 0 }]] },
    "Route by Action": {
      "main": [
        [{ "node": "Merge Results", "type": "main", "index": 0 }],
        [{ "node": "Merge Results", "type": "main", "index": 0 }],
        [{ "node": "Merge Results", "type": "main", "index": 0 }],
        [{ "node": "Unknown Action", "type": "main", "index": 0 }]
      ]
    },
    "Unknown Action": { "main": [[{ "node": "Merge Results", "type": "main", "index": 0 }]] },
    "Merge Results": { "main": [[{ "node": "Check Success", "type": "main", "index": 0 }]] },
    "Check Success": {
      "main": [
        [{ "node": "Respond Success", "type": "main", "index": 0 }],
        [{ "node": "Respond Error", "type": "main", "index": 0 }]
      ]
    }
  }
}
```

> **Note:** This simplified version uses placeholder Set nodes instead of actual Execute Workflow nodes. The placeholder nodes return mock responses so you can test the routing logic without setting up the worker agents first.
>
> For the production implementation with actual sub-workflow calls, see [01-coordinator-agent.json](../../../multi-agent-workflows/01-coordinator-agent.json).

---

## Resources

- [Importable Tutorial Workflow](../workflows/tutorial-03-coordinator.json) - Simplified version for learning
- [Production Coordinator JSON](../../../multi-agent-workflows/01-coordinator-agent.json) - Full implementation with sub-workflow calls
- [Multi-Agent Architecture](../../MULTI-AGENT-ARCHITECTURE.md) - Complete system documentation
- [n8n Execute Workflow](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.executeworkflow/) - Sub-workflow documentation
