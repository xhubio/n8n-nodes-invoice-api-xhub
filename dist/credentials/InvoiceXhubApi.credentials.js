"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceXhubApi = void 0;
class InvoiceXhubApi {
    name = 'invoiceXhubApi';
    displayName = 'Invoice-api.xhub API';
    documentationUrl = 'https://invoice-api.xhub.io/docs/api/authentication';
    icon = 'file:invoiceXhub.svg';
    properties = [
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
    authenticate = {
        type: 'generic',
        properties: {
            headers: {
                Authorization: '=Bearer {{$credentials.apiKey}}',
            },
        },
    };
    test = {
        request: {
            baseURL: '={{$credentials.baseUrl}}',
            url: '/api/v1/invoice/formats',
            method: 'GET',
        },
    };
}
exports.InvoiceXhubApi = InvoiceXhubApi;
//# sourceMappingURL=InvoiceXhubApi.credentials.js.map