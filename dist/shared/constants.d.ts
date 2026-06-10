import type { INodePropertyOptions } from 'n8n-workflow';
/**
 * Supported country codes for invoice-api.xhub API (OpenAPI v1.3, 28 countries).
 *
 * Displayed in UI in uppercase (ISO 3166-1 alpha-2). The API expects
 * lowercase in URL paths — that lowercasing happens at the HTTP boundary
 * (see GenericFunctions.ts). Ordered by ISO code to match the `/formats` response.
 *
 * This is a local fallback superset — the authoritative list comes from the
 * `/formats` endpoint at runtime (see methods/loadOptions.ts).
 */
export declare const SUPPORTED_COUNTRIES: readonly ["AT", "BE", "BG", "CH", "CY", "CZ", "DE", "DK", "EE", "ES", "FI", "FR", "GB", "GR", "HU", "IE", "IT", "LT", "LU", "LV", "MT", "NL", "NO", "PL", "PT", "RO", "SE", "SI"];
export type CountryCode = (typeof SUPPORTED_COUNTRIES)[number];
/**
 * Country options for n8n dropdowns (ordered by ISO code)
 */
export declare const COUNTRY_OPTIONS: INodePropertyOptions[];
/**
 * E-Invoice format identifiers matching the OpenAPI v1.3 `format` path enum.
 *
 * Superset of generate + parse formats. Generate formats (per country) come from
 * the `/formats` endpoint; `cii`, `ksef`, `efactura` and `saft` are parse-only.
 */
export declare const E_INVOICE_FORMATS: readonly ["pdf", "ubl", "zugferd", "xrechnung", "facturx", "fatturapa", "facturae", "ebinterface", "isdoc", "nav", "mydata", "qr-bill", "peppol-ubl", "cii", "ksef", "efactura", "saft"];
export type EInvoiceFormat = (typeof E_INVOICE_FORMATS)[number];
/**
 * Format options for n8n dropdowns (grouped by region/purpose)
 */
export declare const FORMAT_OPTIONS: INodePropertyOptions[];
/**
 * Country-specific format mappings (local superset — authoritative list comes
 * from the `/formats` endpoint). Mirrors the generate formats reported by the API.
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