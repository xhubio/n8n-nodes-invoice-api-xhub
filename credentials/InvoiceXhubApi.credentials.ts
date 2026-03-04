import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class InvoiceXhubApi implements ICredentialType {
	name = 'invoiceXhubApi';
	displayName = 'Invoice-api.xhub API';
	documentationUrl = 'https://invoice-api.xhub.io/docs/api/authentication';
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description: 'API Key for invoice-api.xhub (starts with sk_live_ or sk_test_)',
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://service.invoice-api.xhub.io',
			required: true,
			description: 'Base URL for the invoice-api.xhub API',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl}}',
			url: '/api/v1/invoice/formats',
			method: 'GET',
		},
	};
}
