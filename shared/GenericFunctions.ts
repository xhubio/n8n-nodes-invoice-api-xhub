import type {
	IExecuteFunctions,
	IHookFunctions,
	ILoadOptionsFunctions,
	IDataObject,
	IHttpRequestMethods,
	IHttpRequestOptions,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

/**
 * API v1 path prefix
 */
const API_PREFIX = '/api/v1/invoice';

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
export async function invoiceXhubApiRequest(
	this: IExecuteFunctions | IHookFunctions | ILoadOptionsFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body: IDataObject = {},
	qs: IDataObject = {},
): Promise<InvoiceXhubApiResponse> {
	const credentials = await this.getCredentials('invoiceXhubApi');
	const baseUrl = (credentials.baseUrl as string).replace(/\/+$/, '');

	const options: IHttpRequestOptions = {
		method,
		url: `${baseUrl}${endpoint}`,
		headers: {
			'Content-Type': 'application/json',
		},
		body,
		qs,
		json: true,
	};

	// Remove empty body for GET requests
	if (method === 'GET') {
		delete options.body;
	}

	try {
		const response = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'invoiceXhubApi',
			options,
		);
		return response as InvoiceXhubApiResponse;
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject, {
			message: 'invoice-api.xhub API request failed',
		});
	}
}

/**
 * Generate an invoice document
 */
export async function generateInvoice(
	this: IExecuteFunctions,
	countryCode: string,
	format: string,
	invoice: IDataObject,
	formatOptions?: IDataObject,
): Promise<InvoiceXhubApiResponse> {
	const body: IDataObject = {
		invoice,
	};

	if (formatOptions && Object.keys(formatOptions).length > 0) {
		body.formatOptions = formatOptions;
	}

	return invoiceXhubApiRequest.call(
		this,
		'POST',
		`${API_PREFIX}/${countryCode.toUpperCase()}/${format.toLowerCase()}/generate`,
		body,
	);
}

/**
 * Parse an invoice document
 */
export async function parseInvoice(
	this: IExecuteFunctions,
	countryCode: string,
	format: string,
	data: string,
	filename?: string,
): Promise<InvoiceXhubApiResponse> {
	const body: IDataObject = {
		data,
	};

	if (filename) {
		body.filename = filename;
	}

	return invoiceXhubApiRequest.call(
		this,
		'POST',
		`${API_PREFIX}/${countryCode.toUpperCase()}/${format.toLowerCase()}/parse`,
		body,
	);
}

/**
 * Parse an invoice document with auto-detection of country and format
 */
export async function parseInvoiceAutoDetect(
	this: IExecuteFunctions,
	data: string,
	filename?: string,
): Promise<InvoiceXhubApiResponse> {
	const body: IDataObject = {
		data,
	};

	if (filename) {
		body.filename = filename;
	}

	return invoiceXhubApiRequest.call(this, 'POST', `${API_PREFIX}/parse`, body);
}

/**
 * Validate an invoice
 */
export async function validateInvoice(
	this: IExecuteFunctions,
	countryCode: string,
	invoice: IDataObject,
): Promise<InvoiceXhubApiResponse> {
	return invoiceXhubApiRequest.call(
		this,
		'POST',
		`${API_PREFIX}/${countryCode.toUpperCase()}/validate`,
		{ invoice },
	);
}

/**
 * Get supported formats for a country
 */
export async function getCountryFormats(
	this: IExecuteFunctions | ILoadOptionsFunctions,
	countryCode: string,
): Promise<InvoiceXhubApiResponse> {
	return invoiceXhubApiRequest.call(
		this,
		'GET',
		`${API_PREFIX}/${countryCode.toUpperCase()}/formats`,
	);
}

/**
 * Get all supported countries and formats
 */
export async function getAllFormats(
	this: IExecuteFunctions | ILoadOptionsFunctions,
): Promise<InvoiceXhubApiResponse> {
	return invoiceXhubApiRequest.call(this, 'GET', `${API_PREFIX}/formats`);
}

/**
 * Convert base64 data to binary for n8n
 */
export function base64ToBinary(base64Data: string): Buffer {
	return Buffer.from(base64Data, 'base64');
}

/**
 * Convert binary/buffer to base64
 */
export function binaryToBase64(data: Buffer | Uint8Array): string {
	return Buffer.from(data).toString('base64');
}

/**
 * Build error message from API response
 */
export function buildErrorMessage(response: InvoiceXhubApiResponse): string {
	const messages: string[] = [];

	if (response.error) {
		messages.push(response.error);
	}

	if (response.message) {
		messages.push(response.message);
	}

	if (response.errors && response.errors.length > 0) {
		for (const err of response.errors) {
			const parts = [err.code, err.message];
			if (err.field) {
				parts.push(`(field: ${err.field})`);
			}
			messages.push(parts.join(': '));
		}
	}

	if (response.quota) {
		messages.push(
			`Quota: ${response.quota.current}/${response.quota.limit} (${response.quota.period})`,
		);
	}

	return messages.join('; ') || 'Unknown error';
}
