import type { IExecuteFunctions, IHookFunctions, ILoadOptionsFunctions, IDataObject, IHttpRequestMethods } from 'n8n-workflow';
/**
 * Auto-detect detection result
 */
export interface DetectionResult {
    format: string | null;
    formatVersion?: string;
    countryCode: string | null;
    confidence: number;
    formatMethod: string;
    countrySource: string;
    isAmbiguous: boolean;
    alternativeCountries?: string[];
}
/**
 * Quota information (returned on 429 responses)
 */
export interface QuotaInfo {
    current: number;
    limit: number;
    period: string;
}
/**
 * API response interface
 */
export interface InvoiceXhubApiResponse {
    success: boolean;
    valid?: boolean;
    format?: string;
    filename?: string;
    mimeType?: string;
    hash?: string;
    data?: string;
    invoice?: IDataObject;
    countries?: IDataObject[];
    detection?: DetectionResult;
    quota?: QuotaInfo;
    errors?: Array<{
        code: string;
        message: string;
        field?: string;
        severity?: string;
    }>;
    warnings?: Array<{
        code: string;
        message: string;
        field?: string;
    }>;
    error?: string;
    message?: string;
}
/**
 * Make an authenticated request to the invoice-api.xhub API
 */
export declare function invoiceXhubApiRequest(this: IExecuteFunctions | IHookFunctions | ILoadOptionsFunctions, method: IHttpRequestMethods, endpoint: string, body?: IDataObject, qs?: IDataObject): Promise<InvoiceXhubApiResponse>;
/**
 * Generate an invoice document
 */
export declare function generateInvoice(this: IExecuteFunctions, countryCode: string, format: string, invoice: IDataObject, formatOptions?: IDataObject): Promise<InvoiceXhubApiResponse>;
/**
 * Parse an invoice document
 */
export declare function parseInvoice(this: IExecuteFunctions, countryCode: string, format: string, data: string, filename?: string): Promise<InvoiceXhubApiResponse>;
/**
 * Parse an invoice document with auto-detection of country and format
 */
export declare function parseInvoiceAutoDetect(this: IExecuteFunctions, data: string, filename?: string): Promise<InvoiceXhubApiResponse>;
/**
 * Validate an invoice
 */
export declare function validateInvoice(this: IExecuteFunctions, countryCode: string, invoice: IDataObject): Promise<InvoiceXhubApiResponse>;
/**
 * Get supported formats for a country
 */
export declare function getCountryFormats(this: IExecuteFunctions | ILoadOptionsFunctions, countryCode: string): Promise<InvoiceXhubApiResponse>;
/**
 * Get all supported countries and formats
 */
export declare function getAllFormats(this: IExecuteFunctions | ILoadOptionsFunctions): Promise<InvoiceXhubApiResponse>;
/**
 * Convert base64 data to binary for n8n
 */
export declare function base64ToBinary(base64Data: string): Buffer;
/**
 * Convert binary/buffer to base64
 */
export declare function binaryToBase64(data: Buffer | Uint8Array): string;
/**
 * Build error message from API response
 */
export declare function buildErrorMessage(response: InvoiceXhubApiResponse): string;
//# sourceMappingURL=GenericFunctions.d.ts.map