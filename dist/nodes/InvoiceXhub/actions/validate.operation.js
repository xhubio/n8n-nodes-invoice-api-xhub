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
                operation: ['validate'],
            },
        },
        description: 'The country rules to validate against',
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
                operation: ['validate'],
            },
        },
        description: 'The invoice data to validate as JSON object',
    },
    {
        displayName: 'Options',
        name: 'options',
        type: 'collection',
        placeholder: 'Add Option',
        default: {},
        displayOptions: {
            show: {
                operation: ['validate'],
            },
        },
        options: [
            {
                displayName: 'Fail on Errors',
                name: 'failOnErrors',
                type: 'boolean',
                default: false,
                description: 'Whether to fail the node if validation errors are found',
            },
            {
                displayName: 'Fail on Warnings',
                name: 'failOnWarnings',
                type: 'boolean',
                default: false,
                description: 'Whether to fail the node if validation warnings are found',
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
            // Call the API
            const response = await GenericFunctions_1.validateInvoice.call(this, countryCode, invoiceData);
            // Determine validity: prefer explicit `valid` field, fall back to success/errors
            const isValid = response.valid ?? (response.errors ? response.errors.length === 0 : response.success);
            // Build output data
            const outputData = {
                valid: isValid,
                countryCode,
                errors: response.errors || [],
                warnings: response.warnings || [],
                errorCount: response.errors?.length || 0,
                warningCount: response.warnings?.length || 0,
            };
            // Check if we should fail on errors
            if (options.failOnErrors && response.errors && response.errors.length > 0) {
                const errorMessages = response.errors.map((e) => e.message).join('; ');
                throw new n8n_workflow_1.NodeOperationError(this.getNode(), `Validation failed with ${response.errors.length} error(s): ${errorMessages}`, { itemIndex: i });
            }
            // Check if we should fail on warnings
            if (options.failOnWarnings && response.warnings && response.warnings.length > 0) {
                const warningMessages = response.warnings.map((w) => w.message).join('; ');
                throw new n8n_workflow_1.NodeOperationError(this.getNode(), `Validation has ${response.warnings.length} warning(s): ${warningMessages}`, { itemIndex: i });
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
                        valid: false,
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
//# sourceMappingURL=validate.operation.js.map