import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import * as actions from './actions';

export class InvoiceXhub implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'invoice-api.xhub',
		name: 'invoiceXhub',
		icon: 'file:invoiceXhub.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description:
			'Generate, parse, and validate e-invoices across 14 European countries with 18+ formats',
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

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const operation = this.getNodeParameter('operation', 0) as string;

		let returnData: INodeExecutionData[];

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
				throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
		}

		return [returnData];
	}
}
