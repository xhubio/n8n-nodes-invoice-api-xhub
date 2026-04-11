import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
	IDataObject,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { parseInvoice, binaryToBase64, buildErrorMessage } from '../../../shared/GenericFunctions';

export const description: INodeProperties[] = [
	{
		displayName: 'Country',
		name: 'countryCode',
		type: 'resourceLocator',
		default: { mode: 'list', value: 'DE' },
		required: true,
		displayOptions: {
			show: {
				operation: ['parse'],
			},
		},
		description: 'The country of the invoice to parse',
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
		displayName: 'Expected Format',
		name: 'format',
		type: 'resourceLocator',
		default: { mode: 'list', value: 'xrechnung' },
		required: true,
		displayOptions: {
			show: {
				operation: ['parse'],
			},
		},
		description: 'The expected format of the invoice document',
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

export async function execute(
	this: IExecuteFunctions,
	items: INodeExecutionData[],
): Promise<INodeExecutionData[]> {
	const returnData: INodeExecutionData[] = [];

	for (let i = 0; i < items.length; i++) {
		try {
			const countryCode = this.getNodeParameter('countryCode', i, '', {
				extractValue: true,
			}) as string;
			const format = this.getNodeParameter('format', i, '', { extractValue: true }) as string;
			const inputType = this.getNodeParameter('inputType', i) as string;
			const options = this.getNodeParameter('options', i, {}) as IDataObject;

			let base64Data: string;
			let filename: string | undefined = options.filename as string | undefined;

			if (inputType === 'binary') {
				const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;
				const binaryData = items[i].binary?.[binaryPropertyName];

				if (!binaryData) {
					throw new NodeOperationError(
						this.getNode(),
						`No binary data found in property "${binaryPropertyName}"`,
						{ itemIndex: i },
					);
				}

				// Get the binary data as buffer
				const buffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);
				base64Data = binaryToBase64(buffer);

				// Use binary filename if not provided in options
				if (!filename && binaryData.fileName) {
					filename = binaryData.fileName;
				}
			} else {
				base64Data = this.getNodeParameter('base64Data', i) as string;
			}

			if (!base64Data) {
				throw new NodeOperationError(this.getNode(), 'No document data provided', { itemIndex: i });
			}

			// Call the API
			const response = await parseInvoice.call(this, countryCode, format, base64Data, filename);

			if (!response.success) {
				throw new NodeOperationError(this.getNode(), buildErrorMessage(response), { itemIndex: i });
			}

			// Build output data
			const outputData: IDataObject = {
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
		} catch (error) {
			if (this.continueOnFail()) {
				returnData.push({
					json: {
						success: false,
						error: error instanceof Error ? error.message : 'Unknown error',
						...(error instanceof Error &&
						'description' in error &&
						(error as Error & { description: string }).description
							? {
									errorDescription: (error as Error & { description: string }).description,
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
