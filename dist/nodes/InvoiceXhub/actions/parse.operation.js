"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.description = void 0;
exports.execute = execute;
const n8n_workflow_1 = require("n8n-workflow");
const constants_1 = require("../../../shared/constants");
const GenericFunctions_1 = require("../../../shared/GenericFunctions");
exports.description = [
    {
        displayName: 'Country',
        name: 'countryCode',
        type: 'options',
        options: constants_1.COUNTRY_OPTIONS,
        default: 'DE',
        required: true,
        displayOptions: {
            show: {
                operation: ['parse'],
            },
        },
        description: 'The country of the invoice to parse',
    },
    {
        displayName: 'Expected Format',
        name: 'format',
        type: 'options',
        options: constants_1.FORMAT_OPTIONS,
        default: 'xrechnung',
        required: true,
        displayOptions: {
            show: {
                operation: ['parse'],
            },
        },
        description: 'The expected format of the invoice document',
    },
    {
        displayName: 'Input Type',
        name: 'inputType',
        type: 'options',
        options: [
            {
                name: 'Binary Data',
                value: 'binary',
                description: 'Read from binary input',
            },
            {
                name: 'Base64 String',
                value: 'base64',
                description: 'Use base64 encoded string',
            },
        ],
        default: 'binary',
        displayOptions: {
            show: {
                operation: ['parse'],
            },
        },
        description: 'How to provide the invoice document',
    },
    {
        displayName: 'Binary Property',
        name: 'binaryPropertyName',
        type: 'string',
        default: 'data',
        required: true,
        displayOptions: {
            show: {
                operation: ['parse'],
                inputType: ['binary'],
            },
        },
        description: 'Name of the binary property containing the invoice document',
    },
    {
        displayName: 'Base64 Data',
        name: 'base64Data',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
            show: {
                operation: ['parse'],
                inputType: ['base64'],
            },
        },
        description: 'Base64 encoded invoice document',
    },
    {
        displayName: 'Options',
        name: 'options',
        type: 'collection',
        placeholder: 'Add Option',
        default: {},
        displayOptions: {
            show: {
                operation: ['parse'],
            },
        },
        options: [
            {
                displayName: 'Filename',
                name: 'filename',
                type: 'string',
                default: '',
                description: 'Optional filename hint for the parser',
            },
            {
                displayName: 'Include Warnings',
                name: 'includeWarnings',
                type: 'boolean',
                default: true,
                description: 'Whether to include validation warnings in the output',
            },
        ],
    },
];
async function execute(items) {
    const returnData = [];
    for (let i = 0; i < items.length; i++) {
        try {
            const countryCode = this.getNodeParameter('countryCode', i);
            const format = this.getNodeParameter('format', i);
            const inputType = this.getNodeParameter('inputType', i);
            const options = this.getNodeParameter('options', i, {});
            let base64Data;
            let filename = options.filename;
            if (inputType === 'binary') {
                const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i);
                const binaryData = items[i].binary?.[binaryPropertyName];
                if (!binaryData) {
                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), `No binary data found in property "${binaryPropertyName}"`, { itemIndex: i });
                }
                // Get the binary data as buffer
                const buffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);
                base64Data = (0, GenericFunctions_1.binaryToBase64)(buffer);
                // Use binary filename if not provided in options
                if (!filename && binaryData.fileName) {
                    filename = binaryData.fileName;
                }
            }
            else {
                base64Data = this.getNodeParameter('base64Data', i);
            }
            if (!base64Data) {
                throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'No document data provided', { itemIndex: i });
            }
            // Call the API
            const response = await GenericFunctions_1.parseInvoice.call(this, countryCode, format, base64Data, filename);
            if (!response.success) {
                throw new n8n_workflow_1.NodeOperationError(this.getNode(), (0, GenericFunctions_1.buildErrorMessage)(response), { itemIndex: i });
            }
            // Build output data
            const outputData = {
                success: response.success,
                format: response.format,
                hash: response.hash,
                invoice: response.invoice,
            };
            // Include warnings if requested
            if (options.includeWarnings !== false && response.warnings?.length) {
                outputData.warnings = response.warnings;
            }
            returnData.push({
                json: outputData,
                pairedItem: { item: i },
            });
        }
        catch (error) {
            if (this.continueOnFail()) {
                returnData.push({
                    json: {
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error',
                    },
                    pairedItem: { item: i },
                });
                continue;
            }
            throw error;
        }
    }
    return returnData;
}
//# sourceMappingURL=parse.operation.js.map