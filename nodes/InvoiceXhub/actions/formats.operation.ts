import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
	IDataObject,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { COUNTRY_OPTIONS } from '../../../shared/constants';
import {
	getAllFormats,
	getCountryFormats,
	buildErrorMessage,
} from '../../../shared/GenericFunctions';

export const description: INodeProperties[] = [
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
		options: COUNTRY_OPTIONS,
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

export async function execute(
	this: IExecuteFunctions,
	items: INodeExecutionData[],
): Promise<INodeExecutionData[]> {
	const returnData: INodeExecutionData[] = [];

	for (let i = 0; i < items.length; i++) {
		try {
			const scope = this.getNodeParameter('scope', i) as string;

			let response;
			if (scope === 'all') {
				response = await getAllFormats.call(this);

				if (!response.countries) {
					throw new NodeOperationError(
						this.getNode(),
						buildErrorMessage(response),
						{ itemIndex: i },
					);
				}

				returnData.push({
					json: {
						countries: response.countries,
						totalCountries: response.countries.length,
					} as IDataObject,
					pairedItem: { item: i },
				});
			} else {
				const countryCode = this.getNodeParameter('countryCode', i) as string;
				response = await getCountryFormats.call(this, countryCode);

				if (!response.formats && !response.success) {
					throw new NodeOperationError(
						this.getNode(),
						buildErrorMessage(response),
						{ itemIndex: i },
					);
				}

				returnData.push({
					json: response as unknown as IDataObject,
					pairedItem: { item: i },
				});
			}
		} catch (error) {
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
