# Understanding Agents

## Overview

This tutorial introduces the concept of multi-agent systems for e-invoice processing. You'll learn what agents are, why they're useful, and how the invoice-api.xhub multi-agent architecture works.

## Prerequisites

- [ ] Completed [Getting Started](../01-getting-started/setup-credentials.md) tutorials
- [ ] Basic understanding of n8n workflows

## What You'll Learn

- What an "agent" means in workflow automation
- Why multi-agent architecture is useful for invoicing
- The invoice-api.xhub multi-agent system components
- When to use single workflows vs. multi-agent systems

---

## What is an Agent?

### Definition

In n8n workflow automation, an **agent** is a specialized workflow that:

1. **Has a single responsibility** - Does one thing well
2. **Can be called by other workflows** - Acts as a reusable component
3. **Makes decisions** - Often uses AI to analyze data and choose actions
4. **Reports back** - Returns structured results to its caller

### Simple Example

Think of agents like employees in a company:

```
┌────────────────────────────────────────────────────────────┐
│  Traditional Workflow (One person does everything)         │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Receive Invoice → Validate → Process → File → Report     │
│       ↓              ↓          ↓        ↓        ↓       │
│     [One big workflow handles ALL steps]                   │
│                                                            │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  Multi-Agent System (Specialized team)                     │
├────────────────────────────────────────────────────────────┤
│                                                            │
│                    ┌─────────────────┐                     │
│                    │   Coordinator   │ (Manager)           │
│                    │   "Route tasks" │                     │
│                    └───────┬─────────┘                     │
│                            │                               │
│         ┌──────────────────┼──────────────────┐            │
│         ▼                  ▼                  ▼            │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐      │
│  │  Validator  │   │  Generator  │   │   Parser    │      │
│  │  "Check     │   │  "Create    │   │  "Extract   │      │
│  │   invoices" │   │   documents"│   │   data"     │      │
│  └─────────────┘   └─────────────┘   └─────────────┘      │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Checkpoint

✅ You understand that agents are specialized, reusable workflows

---

## Why Multi-Agent for Invoicing?

### The Challenge

E-invoice processing is complex because:

| Challenge | Description |
|-----------|-------------|
| **Multiple formats** | XRechnung, ZUGFeRD, Factur-X, FatturaPA... |
| **Multiple operations** | Generate, validate, parse, convert |
| **Country-specific rules** | Each country has different requirements |
| **Error handling** | Validation errors need diagnosis and fixing |
| **AI opportunities** | LLMs can enhance validation and extraction |

### Why Not One Big Workflow?

A single workflow quickly becomes:

```
❌ Hard to maintain (hundreds of nodes)
❌ Hard to test (can't test parts independently)
❌ Hard to debug (where did it fail?)
❌ Inflexible (change one thing, break others)
```

### Multi-Agent Benefits

```
✅ Modular - Each agent is small and focused
✅ Testable - Test each agent independently
✅ Debuggable - Easy to see which agent failed
✅ Reusable - Use agents in different workflows
✅ Scalable - Add new agents without changing others
```

### Checkpoint

✅ You understand why multi-agent architecture helps with e-invoice processing

---

## The invoice-api.xhub Multi-Agent System

### Architecture Overview

The invoice-api.xhub multi-agent system has 5 specialized agents:

```
┌──────────────────────────────────────────────────────────────────┐
│                    Multi-Agent Invoice System                     │
└──────────────────────────────────────────────────────────────────┘

                          ┌─────────────────────┐
                          │   HTTP Request      │
                          │   (Your App)        │
                          └──────────┬──────────┘
                                     │
                                     ▼
                      ┌──────────────────────────┐
                      │    Coordinator Agent     │
                      │                          │
                      │  • Receives requests     │
                      │  • Routes to specialists │
                      │  • Aggregates results    │
                      └─────┬──────┬──────┬─────┘
                            │      │      │
           ┌────────────────┼──────┼──────┼────────────────┐
           │                │      │      │                │
           ▼                ▼      ▼      ▼                ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Generation      │  │ Validation      │  │ Parsing         │
│ Agent           │  │ Agent           │  │ Agent           │
│                 │  │                 │  │                 │
│ • JSON→Invoice  │  │ • API Validate  │  │ • XML→JSON     │
│ • Text→Invoice  │  │ • AI Validate   │  │ • PDF→JSON     │
│ • Format Output │  │ • Confidence    │  │ • AI Enrich    │
└─────────────────┘  └─────────────────┘  └─────────────────┘
                            │
                            │ On Error
                            ▼
                   ┌─────────────────┐
                   │ Error Handler   │
                   │ Agent           │
                   │                 │
                   │ • AI Diagnosis  │
                   │ • Auto-Fix      │
                   │ • Escalate      │
                   └─────────────────┘
```

### Agent Descriptions

| Agent | Workflow File | Purpose |
|-------|---------------|---------|
| **Coordinator** | `01-coordinator-agent.json` | Routes requests to the right specialist |
| **Validation** | `02-validation-agent.json` | Validates invoices (API + AI dual validation) |
| **Generation** | `03-generation-agent.json` | Creates invoice documents from data |
| **Parsing** | `04-parsing-agent.json` | Extracts data from invoice documents |
| **Error Handler** | `05-error-handler-agent.json` | Diagnoses and fixes errors |

### Checkpoint

✅ You can name the 5 agents and their purposes

---

## How Agents Communicate

### Standard Message Format

All agents communicate using a consistent JSON structure:

```json
{
  "requestId": "unique-request-id",
  "action": "validate",
  "data": {
    "invoice": { ... },
    "countryCode": "DE"
  },
  "options": {
    "strictMode": false
  },
  "timestamp": "2025-01-15T10:30:00Z"
}
```

| Field | Purpose |
|-------|---------|
| `requestId` | Tracks the request through all agents |
| `action` | Tells coordinator which agent to use |
| `data` | The payload (invoice data, document, etc.) |
| `options` | Configuration flags |
| `timestamp` | For logging and debugging |

### Request Flow Example

Let's trace a validation request:

```
1. Your App sends:
   POST /webhook/invoice-agent
   { "action": "validate", "data": { "invoice": {...} } }

2. Coordinator receives request
   → Extracts action: "validate"
   → Routes to Validation Agent

3. Validation Agent processes:
   → Calls invoice-api.xhub API (70% weight)
   → Calls Claude AI (30% weight)
   → Calculates confidence score
   → Returns result

4. Coordinator checks result:
   → Success? Return to client
   → Failure? Route to Error Handler

5. Client receives:
   { "success": true, "validation": { "confidence": 85, ... } }
```

### Checkpoint

✅ You understand how requests flow through the multi-agent system

---

## When to Use Multi-Agent vs. Single Workflow

### Use a Single Workflow When:

| Scenario | Example |
|----------|---------|
| Simple, linear process | Generate one invoice from form data |
| Few decision points | If country=DE, use XRechnung |
| Low error complexity | Retry once, then fail |
| No AI needed | Straightforward API calls |

```
Good for: Simple automations, scripts, scheduled tasks
```

### Use Multi-Agent When:

| Scenario | Example |
|----------|---------|
| Complex routing logic | Multiple operations, multiple formats |
| AI-enhanced processing | Validation with LLM analysis |
| Sophisticated error handling | Diagnose, auto-fix, escalate |
| Reusable components | Same validation for multiple workflows |
| Team development | Different people work on different agents |

```
Good for: Production systems, enterprise automation, AI-powered processing
```

### Decision Guide

```
┌─────────────────────────────────────────────────────────────┐
│  Should I use multi-agent?                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Will multiple workflows need the same logic?               │
│  └─► Yes → Multi-agent (reusable components)                │
│                                                             │
│  Do you need AI-powered decisions?                          │
│  └─► Yes → Multi-agent (AI agents)                          │
│                                                             │
│  Is error handling complex (diagnose, fix, escalate)?       │
│  └─► Yes → Multi-agent (error handler agent)                │
│                                                             │
│  Is the workflow > 20 nodes?                                │
│  └─► Yes → Consider multi-agent (split into components)     │
│                                                             │
│  All "No"?                                                  │
│  └─► Single workflow is probably fine                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Checkpoint

✅ You can decide when to use multi-agent vs. single workflows

---

## AI in the Multi-Agent System

### Where AI is Used

The invoice-api.xhub multi-agent system uses Claude AI in several agents:

| Agent | AI Use | Model | Purpose |
|-------|--------|-------|---------|
| Validation | Claude 3.5 Sonnet | Analyze invoice for issues beyond rule-based checks |
| Generation | Claude 3.5 Sonnet | Extract invoice data from unstructured text/email |
| Parsing | Claude 3.5 Haiku | Enrich parsed data, identify missing fields |
| Error Handler | Claude 3.5 Sonnet | Diagnose errors, suggest fixes |

### Dual Validation Example

The Validation Agent combines API and AI validation:

```
┌───────────────────────────────────────────────────────────────┐
│  Validation Agent - Dual Validation                           │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  Invoice Data                                                 │
│       │                                                       │
│       ├────────────────┬────────────────┐                     │
│       │                │                │                     │
│       ▼                ▼                │                     │
│  ┌─────────────┐  ┌─────────────┐       │                     │
│  │ API Valid.  │  │ AI Valid.   │       │                     │
│  │ (70% weight)│  │ (30% weight)│       │                     │
│  │             │  │             │       │                     │
│  │ • Format    │  │ • Semantic  │       │                     │
│  │ • Required  │  │ • Business  │       │                     │
│  │ • Calc      │  │ • Context   │       │                     │
│  └─────┬───────┘  └─────┬───────┘       │                     │
│        │                │               │                     │
│        └───────┬────────┘               │                     │
│                │                        │                     │
│                ▼                        │                     │
│        ┌─────────────┐                  │                     │
│        │  Combine    │                  │                     │
│        │  Confidence │                  │                     │
│        │  Score      │                  │                     │
│        │             │                  │                     │
│        │  (0-100%)   │                  │                     │
│        └─────────────┘                  │                     │
│                                                               │
│  Result: { confidence: 85, isValid: true, ... }               │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

### Confidence Score

The confidence score determines what happens next:

| Score | Meaning | Action |
|-------|---------|--------|
| 85-100% | High confidence | Process automatically |
| 70-84% | Medium confidence | Process with warnings |
| < 70% | Low confidence | Escalate to human review |

### Checkpoint

✅ You understand how AI enhances the multi-agent system

---

## Summary

### What You Learned

1. **Agents** are specialized, reusable workflows
2. **Multi-agent systems** split complex processes into manageable components
3. The invoice-api.xhub system has 5 agents: Coordinator, Validation, Generation, Parsing, Error Handler
4. Agents communicate via **standardized JSON messages**
5. **AI (Claude)** enhances validation, generation, parsing, and error handling
6. Use multi-agent when you need **reusability, AI, or complex error handling**

### Key Concepts

| Concept | Definition |
|---------|------------|
| **Orchestrator-Worker Pattern** | Coordinator routes tasks to specialized workers |
| **Dual Validation** | Combine API (rules) + AI (semantic) for robust validation |
| **Confidence Score** | Numeric measure of validation certainty (0-100%) |
| **Human-in-the-Loop** | Escalate low-confidence cases to human review |

### Next Steps

Ready to build? Continue to:
- [Coordinator Pattern](./coordinator-pattern.md) - Build the central orchestration agent

---

## Resources

- [Multi-Agent Architecture](../../MULTI-AGENT-ARCHITECTURE.md) - Complete technical documentation
- [Anthropic Multi-Agent Research](https://www.anthropic.com/engineering/multi-agent-research-system) - AI multi-agent patterns
- [n8n Sub-Workflows](https://docs.n8n.io/workflows/sub-workflows/) - How n8n calls workflows from workflows
