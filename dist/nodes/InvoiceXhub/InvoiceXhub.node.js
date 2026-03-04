"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceXhub = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const actions = __importStar(require("./actions"));
class InvoiceXhub {
    description = {
        displayName: 'invoice-api.xhub',
        name: 'invoiceXhub',
        icon: 'file:invoiceXhub.svg',
        group: ['transform'],
        version: 1,
        subtitle: '={{$parameter["operation"]}}',
        description: 'Generate, parse, and validate e-invoices across 14 European countries with 18+ formats',
        defaults: {
            name: 'invoice-api.xhub',
        },
        inputs: ['main'],
        outputs: ['main'],
        credentials: [
            {
                name: 'invoiceXhubApi',
                required: true,
            },
        ],
        properties: [
            {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                noDataExpression: true,
                options: [
                    {
                        name: 'Generate',
                        value: 'generate',
                        description: 'Generate an e-invoice document (PDF, XRechnung, ZUGFeRD, etc.)',
                        action: 'Generate an e invoice document',
                    },
                    {
                        name: 'Get Formats',
                        value: 'getFormats',
                        description: 'Get supported countries and formats',
                        action: 'Get supported formats',
                    },
                    {
                        name: 'Parse',
                        value: 'parse',
                        description: 'Parse an e-invoice document and extract invoice data',
                        action: 'Parse an e invoice document',
                    },
                    {
                        name: 'Parse (Auto-Detect)',
                        value: 'parseAutoDetect',
                        description: 'Parse an e-invoice with automatic country and format detection',
                        action: 'Parse an e invoice with auto detection',
                    },
                    {
                        name: 'Validate',
                        value: 'validate',
                        description: 'Validate invoice data against country-specific rules',
                        action: 'Validate invoice data',
                    },
                ],
                default: 'generate',
            },
            // Generate operation properties
            ...actions.generate.description,
            // Parse operation properties
            ...actions.parse.description,
            // Parse Auto-Detect operation properties
            ...actions.parseAutoDetect.description,
            // Validate operation properties
            ...actions.validate.description,
            // Get Formats operation properties
            ...actions.formats.description,
        ],
    };
    async execute() {
        const items = this.getInputData();
        const operation = this.getNodeParameter('operation', 0);
        let returnData;
        switch (operation) {
            case 'generate':
                returnData = await actions.generate.execute.call(this, items);
                break;
            case 'parse':
                returnData = await actions.parse.execute.call(this, items);
                break;
            case 'parseAutoDetect':
                returnData = await actions.parseAutoDetect.execute.call(this, items);
                break;
            case 'validate':
                returnData = await actions.validate.execute.call(this, items);
                break;
            case 'getFormats':
                returnData = await actions.formats.execute.call(this, items);
                break;
            default:
                throw new n8n_workflow_1.NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
        }
        return [returnData];
    }
}
exports.InvoiceXhub = InvoiceXhub;
//# sourceMappingURL=InvoiceXhub.node.js.map