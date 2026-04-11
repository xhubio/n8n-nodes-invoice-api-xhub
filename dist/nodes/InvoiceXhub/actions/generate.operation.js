"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.description = void 0;
exports.execute = execute;
const n8n_workflow_1 = require("n8n-workflow");
const GenericFunctions_1 = require("../../../shared/GenericFunctions");
exports.description = [
    {
        displayName: 'Country',
        name: 'countryCode',
        type: 'resourceLocator',
        default: { mode: 'list', value: 'DE' },
        required: true,
        displayOptions: {
            show: {
                operation: ['generate'],
            },
        },
        description: 'The country for which to generate the invoice',
        modes: [
            {
                displayName: 'From List',
                name: 'list',
                type: 'list',
                typeOptions: {
                    searchListMethod: 'searchCountries',
                    searchable: true,
                },
            },
            {
                displayName: 'Country Code',
                name: 'id',
                type: 'string',
                hint: 'Enter a two-letter ISO country code (e.g. DE, AT, FR)',
                placeholder: 'DE',
                validation: [
                    {
                        type: 'regex',
                        properties: {
                            regex: '^[A-Z]{2}$',
                            errorMessage: 'Country code must be two uppercase letters (e.g. DE)',
                        },
                    },
                ],
            },
        ],
    },
    {
        displayName: 'Output Format',
        name: 'format',
        type: 'resourceLocator',
        default: { mode: 'list', value: 'xrechnung' },
        required: true,
        displayOptions: {
            show: {
                operation: ['generate'],
            },
        },
        description: 'The output format for the generated invoice',
        modes: [
            {
                displayName: 'From List',
                name: 'list',
                type: 'list',
                typeOptions: {
                    searchListMethod: 'searchFormats',
                    searchable: true,
                },
            },
            {
                displayName: 'Format ID',
                name: 'id',
                type: 'string',
                hint: 'Enter a format identifier (e.g. xrechnung, zugferd, facturx)',
                placeholder: 'xrechnung',
            },
        ],
    },
    {
        displayName: 'Invoice Data',
        name: 'invoiceData',
        type: 'json',
        default: '',
        required: true,
        typeOptions: {
            rows: 10,
        },
        displayOptions: {
            show: {
                operation: ['generate'],
            },
        },
        description: 'The invoice data as JSON object',
    },
    {
        displayName: 'Options',
        name: 'options',
        type: 'collection',
        placeholder: 'Add Option',
        default: {},
        displayOptions: {
            show: {
                operation: ['generate'],
            },
        },
        options: [
            {
                displayName: 'Output Binary',
                name: 'outputBinary',
                type: 'boolean',
                default: true,
                description: 'Whether to output the generated document as binary data',
            },
            {
                displayName: 'Binary Property',
                name: 'binaryPropertyName',
                type: 'string',
                default: 'data',
                description: 'Name of the binary property to write the document to',
                displayOptions: {
                    show: {
                        outputBinary: [true],
                    },
                },
            },
            {
                displayName: 'Include Warnings',
                name: 'includeWarnings',
                type: 'boolean',
                default: true,
                description: 'Whether to include validation warnings in the output',
            },
            {
                displayName: 'Format Options',
                name: 'formatOptions',
                type: 'json',
                default: '{}',
                description: 'Additional format-specific options as JSON',
            },
        ],
    },
];
async function execute(items) {
    const returnData = [];
    for (let i = 0; i < items.length; i++) {
        try {
            const countryCode = this.getNodeParameter('countryCode', i, '', {
                extractValue: true,
            });
            const format = this.getNodeParameter('format', i, '', { extractValue: true });
            const invoiceDataRaw = this.getNodeParameter('invoiceData', i);
            const options = this.getNodeParameter('options', i, {});
            // Parse invoice data if it's a string
            let invoiceData;
            if (typeof invoiceDataRaw === 'string') {
                try {
                    invoiceData = JSON.parse(invoiceDataRaw);
                }
                catch {
                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Invoice data must be valid JSON', {
                        itemIndex: i,
                    });
                }
            }
            else {
                invoiceData = invoiceDataRaw;
            }
            // Parse format options if provided
            let formatOptions;
            if (options.formatOptions) {
                if (typeof options.formatOptions === 'string') {
                    try {
                        formatOptions = JSON.parse(options.formatOptions);
                    }
                    catch {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Format options must be valid JSON', {
                            itemIndex: i,
                        });
                    }
                }
                else {
                    formatOptions = options.formatOptions;
                }
            }
            // Call the API
            const response = await GenericFunctions_1.generateInvoice.call(this, countryCode, format, invoiceData, formatOptions);
            if (!response.success) {
                throw new n8n_workflow_1.NodeOperationError(this.getNode(), (0, GenericFunctions_1.buildErrorMessage)(response), { itemIndex: i });
            }
            // Build output data
            const outputData = {
                success: response.success,
                format: response.format,
                filename: response.filename,
                mimeType: response.mimeType,
                hash: response.hash,
            };
            // Include warnings if requested
            if (options.includeWarnings !== false && response.warnings?.length) {
                outputData.warnings = response.warnings;
            }
            // Handle binary output
            const newItem = {
                json: outputData,
                pairedItem: { item: i },
            };
            if (options.outputBinary !== false && response.data) {
                const binaryPropertyName = options.binaryPropertyName || 'data';
                const binaryData = (0, GenericFunctions_1.base64ToBinary)(response.data);
                newItem.binary = {
                    [binaryPropertyName]: await this.helpers.prepareBinaryData(binaryData, response.filename || `invoice.${format}`, response.mimeType || 'application/octet-stream'),
                };
            }
            else if (response.data) {
                // Include base64 data in JSON if binary output is disabled
                outputData.data = response.data;
            }
            returnData.push(newItem);
        }
        catch (error) {
            if (this.continueOnFail()) {
                returnData.push({
                    json: {
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error',
                        ...(error instanceof Error &&
                            'description' in error &&
                            error.description
                            ? {
                                errorDescription: error.description,
                            }
                            : {}),
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
//# sourceMappingURL=generate.operation.js.map