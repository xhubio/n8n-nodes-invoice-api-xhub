import type { INodePropertyOptions } from 'n8n-workflow';
/**
 * Supported country codes for invoice-api.xhub API.
 *
 * Displayed in UI in uppercase (ISO 3166-1 alpha-2). The API expects
 * lowercase in URL paths — that lowercasing happens at the HTTP boundary
 * (see GenericFunctions.ts).
 */
export declare const SUPPORTED_COUNTRIES: readonly ["DE", "AT", "CH", "BE", "NL", "FR", "IT", "ES", "PT", "PL", "CZ", "HU", "RO", "BG"];
export type CountryCode = (typeof SUPPORTED_COUNTRIES)[number];
/**
 * Country options for n8n dropdowns
 */
export declare const COUNTRY_OPTIONS: INodePropertyOptions[];
/**
 * E-Invoice format identifiers matching the OpenAPI v1.1 `format` path enum.
 */
export declare const E_INVOICE_FORMATS: readonly ["pdf", "zugferd", "xrechnung", "ebinterface", "facturx", "fatturapa", "facturae", "ubl", "isdoc", "nav", "ksef", "efactura", "saft"];
export type EInvoiceFormat = (typeof E_INVOICE_FORMATS)[number];
/**
 * Format options for n8n dropdowns (grouped by region)
 */
export declare const FORMAT_OPTIONS: INodePropertyOptions[];
/**
 * Country-specific format mappings (local superset — authoritative list comes from the /formats endpoint)
 */
export declare const COUNTRY_FORMATS: Record<CountryCode, EInvoiceFormat[]>;
/**
 * MIME types for output formats
 */
export declare const FORMAT_MIME_TYPES: Record<string, string>;
/**
 * File extensions for output formats
 */
export declare const FORMAT_EXTENSIONS: Record<string, string>;
//# sourceMappingURL=constants.d.ts.map