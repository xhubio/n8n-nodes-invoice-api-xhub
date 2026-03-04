import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
	IDataObject,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { COUNTRY_OPTIONS } from '../../../shared/constants';
import { validateInvoice } from '../../../shared/GenericFunctions';

export const description: INodeProperties[] = [
	{
		displayName: 'Country',
		name: 'countryCode',
		type: 'options',
		options: COUNTRY_OPTIONS,
		default: 'DE',
		required: true,
		displayOptions: {
			show: {
				operation: ['validate'],
			},
		},
		description: 'The country rules to validate against',
	},
	{
		displayName: 'Invoice Data',
		name: 'invoiceData',
		type: 'json',
		default: '',
		required: true,
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

export async function execute(
	this: IExecuteFunctions,
	items: INodeExecutionData[],
): Promise<INodeExecutionData[]> {
	const returnData: INodeExecutionData[] = [];

	for (let i = 0; i < items.length; i++) {
		try {
			const countryCode = this.getNodeParameter('countryCode', i) as string;
			const invoiceDataRaw = this.getNodeParameter('invoiceData', i) as string | IDataObject;
			const options = this.getNodeParameter('options', i, {}) as IDataObject;

			// Parse invoice data if it's a string
			let invoiceData: IDataObject;
			if (typeof invoiceDataRaw === 'string') {
				try {
					invoiceData = JSON.parse(invoiceDataRaw) as IDataObject;
				} catch {
					throw new NodeOperationError(
						this.getNode(),
						'Invoice data must be valid JSON',
						{ itemIndex: i },
					);
				}
			} else {
				invoiceData = invoiceDataRaw;
			}

			// Call the API
			const response = await validateInvoice.call(
				this,
				countryCode,
				invoiceData,
			);

			// Determine validity: prefer explicit `valid` field, fall back to success/errors
			const isValid =
				response.valid ?? (response.errors ? response.errors.length === 0 : response.success);

			// Build output data
			const outputData: IDataObject = {
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
				throw new NodeOperationError(
					this.getNode(),
					`Validation failed with ${response.errors.length} error(s): ${errorMessages}`,
					{ itemIndex: i },
				);
			}

			// Check if we should fail on warnings
			if (options.failOnWarnings && response.warnings && response.warnings.length > 0) {
				const warningMessages = response.warnings.map((w) => w.message).join('; ');
				throw new NodeOperationError(
					this.getNode(),
					`Validation has ${response.warnings.length} warning(s): ${warningMessages}`,
					{ itemIndex: i },
				);
			}

			returnData.push({
				json: outputData,
				pairedItem: { item: i },
			});
		} catch (error) {
			if (this.continueOnFail()) {
				returnData.push({
					json: {
						valid: false,
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
