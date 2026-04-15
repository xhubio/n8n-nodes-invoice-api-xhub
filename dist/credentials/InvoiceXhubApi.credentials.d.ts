import type { IAuthenticateGeneric, ICredentialTestRequest, ICredentialType, INodeProperties } from 'n8n-workflow';
export declare class InvoiceXhubApi implements ICredentialType {
    name: string;
    displayName: string;
    documentationUrl: string;
    icon: "file:invoiceXhub.svg";
    properties: INodeProperties[];
    authenticate: IAuthenticateGeneric;
    test: ICredentialTestRequest;
}
//# sourceMappingURL=InvoiceXhubApi.credentials.d.ts.map