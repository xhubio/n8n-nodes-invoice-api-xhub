"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.description = void 0;
exports.execute = execute;
const n8n_workflow_1 = require("n8n-workflow");
const constants_1 = require("../../../shared/constants");
const GenericFunctions_1 = require("../../../shared/GenericFunctions");
exports.description = [
    {
        displayName: 'Scope',
        name: 'scope',
        type: 'options',
        options: [
            {
                name: 'All Countries',
                value: 'all',
                description: 'Get all supported countries and their formats',
            },
            {
                name: 'Specific Country',
                value: 'country',
                description: 'Get formats for a specific country',
            },
        ],
        default: 'all',
        displayOptions: {
            show: {
                operation: ['getFormats'],
            },
        },
        description: 'Whether to get formats for all countries or a specific one',
    },
    {
        displayName: 'Country',
        name: 'countryCode',
        type: 'options',
        options: constants_1.COUNTRY_OPTIONS,
        default: 'DE',
        required: true,
        displayOptions: {
            show: {
                operation: ['getFormats'],
                scope: ['country'],
            },
        },
        description: 'The country to get formats for',
    },
];
async function execute(items) {
    const returnData = [];
    for (let i = 0; i < items.length; i++) {
        try {
            const scope = this.getNodeParameter('scope', i);
            let response;
            if (scope === 'all') {
                response = await GenericFunctions_1.getAllFormats.call(this);
                if (!response.countries) {
                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), (0, GenericFunctions_1.buildErrorMessage)(response), { itemIndex: i });
                }
                returnData.push({
                    json: {
                        countries: response.countries,
                        totalCountries: response.countries.length,
                    },
                    pairedItem: { item: i },
                });
            }
            else {
                const countryCode = this.getNodeParameter('countryCode', i);
                response = await GenericFunctions_1.getCountryFormats.call(this, countryCode);
                if (!response.formats && !response.success) {
                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), (0, GenericFunctions_1.buildErrorMessage)(response), { itemIndex: i });
                }
                returnData.push({
                    json: response,
                    pairedItem: { item: i },
                });
            }
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
                                errorDescription: error
                                    .description,
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
//# sourceMappingURL=formats.operation.js.map