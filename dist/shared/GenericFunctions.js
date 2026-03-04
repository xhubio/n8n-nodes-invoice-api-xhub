"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invoiceXhubApiRequest = invoiceXhubApiRequest;
exports.generateInvoice = generateInvoice;
exports.parseInvoice = parseInvoice;
exports.parseInvoiceAutoDetect = parseInvoiceAutoDetect;
exports.validateInvoice = validateInvoice;
exports.getCountryFormats = getCountryFormats;
exports.getAllFormats = getAllFormats;
exports.base64ToBinary = base64ToBinary;
exports.binaryToBase64 = binaryToBase64;
exports.buildErrorMessage = buildErrorMessage;
const n8n_workflow_1 = require("n8n-workflow");
/**
 * API v1 path prefix
 */
const API_PREFIX = '/api/v1/invoice';
/**
 * Make an authenticated request to the invoice-api.xhub API
 */
async function invoiceXhubApiRequest(method, endpoint, body = {}, qs = {}) {
    const credentials = await this.getCredentials('invoiceXhubApi');
    const baseUrl = credentials.baseUrl.replace(/\/+$/, '');
    const options = {
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
        const response = await this.helpers.httpRequestWithAuthentication.call(this, 'invoiceXhubApi', options);
        return response;
    }
    catch (error) {
        throw new n8n_workflow_1.NodeApiError(this.getNode(), error, {
            message: 'invoice-api.xhub API request failed',
        });
    }
}
/**
 * Generate an invoice document
 */
async function generateInvoice(countryCode, format, invoice, formatOptions) {
    const body = {
        invoice,
    };
    if (formatOptions && Object.keys(formatOptions).length > 0) {
        body.formatOptions = formatOptions;
    }
    return invoiceXhubApiRequest.call(this, 'POST', `${API_PREFIX}/${countryCode.toUpperCase()}/${format.toLowerCase()}/generate`, body);
}
/**
 * Parse an invoice document
 */
async function parseInvoice(countryCode, format, data, filename) {
    const body = {
        data,
    };
    if (filename) {
        body.filename = filename;
    }
    return invoiceXhubApiRequest.call(this, 'POST', `${API_PREFIX}/${countryCode.toUpperCase()}/${format.toLowerCase()}/parse`, body);
}
/**
 * Parse an invoice document with auto-detection of country and format
 */
async function parseInvoiceAutoDetect(data, filename) {
    const body = {
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
async function validateInvoice(countryCode, invoice) {
    return invoiceXhubApiRequest.call(this, 'POST', `${API_PREFIX}/${countryCode.toUpperCase()}/validate`, { invoice });
}
/**
 * Get supported formats for a country
 */
async function getCountryFormats(countryCode) {
    return invoiceXhubApiRequest.call(this, 'GET', `${API_PREFIX}/${countryCode.toUpperCase()}/formats`);
}
/**
 * Get all supported countries and formats
 */
async function getAllFormats() {
    return invoiceXhubApiRequest.call(this, 'GET', `${API_PREFIX}/formats`);
}
/**
 * Convert base64 data to binary for n8n
 */
function base64ToBinary(base64Data) {
    return Buffer.from(base64Data, 'base64');
}
/**
 * Convert binary/buffer to base64
 */
function binaryToBase64(data) {
    return Buffer.from(data).toString('base64');
}
/**
 * Build error message from API response
 */
function buildErrorMessage(response) {
    const messages = [];
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
        messages.push(`Quota: ${response.quota.current}/${response.quota.limit} (${response.quota.period})`);
    }
    return messages.join('; ') || 'Unknown error';
}
//# sourceMappingURL=GenericFunctions.js.map