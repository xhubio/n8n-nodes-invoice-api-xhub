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
export const SUPPORTED_COUNTRIES = [
	'AT', // Austria
	'BE', // Belgium
	'BG', // Bulgaria
	'CH', // Switzerland
	'CY', // Cyprus
	'CZ', // Czech Republic
	'DE', // Germany
	'DK', // Denmark
	'EE', // Estonia
	'ES', // Spain
	'FI', // Finland
	'FR', // France
	'GB', // United Kingdom
	'GR', // Greece
	'HU', // Hungary
	'IE', // Ireland
	'IT', // Italy
	'LT', // Lithuania
	'LU', // Luxembourg
	'LV', // Latvia
	'MT', // Malta
	'NL', // Netherlands
	'NO', // Norway
	'PL', // Poland
	'PT', // Portugal
	'RO', // Romania
	'SE', // Sweden
	'SI', // Slovenia
] as const;

export type CountryCode = (typeof SUPPORTED_COUNTRIES)[number];

/**
 * Country options for n8n dropdowns (ordered by ISO code)
 */
export const COUNTRY_OPTIONS: INodePropertyOptions[] = [
	{ name: 'Austria (AT)', value: 'AT' },
	{ name: 'Belgium (BE)', value: 'BE' },
	{ name: 'Bulgaria (BG)', value: 'BG' },
	{ name: 'Switzerland (CH)', value: 'CH' },
	{ name: 'Cyprus (CY)', value: 'CY' },
	{ name: 'Czech Republic (CZ)', value: 'CZ' },
	{ name: 'Germany (DE)', value: 'DE' },
	{ name: 'Denmark (DK)', value: 'DK' },
	{ name: 'Estonia (EE)', value: 'EE' },
	{ name: 'Spain (ES)', value: 'ES' },
	{ name: 'Finland (FI)', value: 'FI' },
	{ name: 'France (FR)', value: 'FR' },
	{ name: 'United Kingdom (GB)', value: 'GB' },
	{ name: 'Greece (GR)', value: 'GR' },
	{ name: 'Hungary (HU)', value: 'HU' },
	{ name: 'Ireland (IE)', value: 'IE' },
	{ name: 'Italy (IT)', value: 'IT' },
	{ name: 'Lithuania (LT)', value: 'LT' },
	{ name: 'Luxembourg (LU)', value: 'LU' },
	{ name: 'Latvia (LV)', value: 'LV' },
	{ name: 'Malta (MT)', value: 'MT' },
	{ name: 'Netherlands (NL)', value: 'NL' },
	{ name: 'Norway (NO)', value: 'NO' },
	{ name: 'Poland (PL)', value: 'PL' },
	{ name: 'Portugal (PT)', value: 'PT' },
	{ name: 'Romania (RO)', value: 'RO' },
	{ name: 'Sweden (SE)', value: 'SE' },
	{ name: 'Slovenia (SI)', value: 'SI' },
];

/**
 * E-Invoice format identifiers matching the OpenAPI v1.3 `format` path enum.
 *
 * Superset of generate + parse formats. Generate formats (per country) come from
 * the `/formats` endpoint; `cii`, `ksef`, `efactura` and `saft` are parse-only.
 */
export const E_INVOICE_FORMATS = [
	'pdf', // All countries (universal PDF)
	'ubl', // Generic UBL (most countries)
	'zugferd', // DE/CH - ZUGFeRD (PDF + embedded XML)
	'xrechnung', // DE - XRechnung (XML)
	'facturx', // FR - Factur-X
	'fatturapa', // IT - FatturaPA
	'facturae', // ES - Facturae
	'ebinterface', // AT - ebInterface
	'isdoc', // CZ - ISDOC
	'nav', // HU - NAV
	'mydata', // GR - myDATA
	'qr-bill', // CH - Swiss QR-bill
	'peppol-ubl', // PL/PT/RO - Peppol BIS UBL
	'cii', // Cross Industry Invoice (parse)
	'ksef', // PL - KSeF (parse)
	'efactura', // RO - e-Factura (parse)
	'saft', // PT - SAF-T (parse)
] as const;

export type EInvoiceFormat = (typeof E_INVOICE_FORMATS)[number];

/**
 * Format options for n8n dropdowns (grouped by region/purpose)
 */
export const FORMAT_OPTIONS: INodePropertyOptions[] = [
	// Universal
	{ name: 'PDF', value: 'pdf' },
	{ name: 'UBL (Generic)', value: 'ubl' },
	{ name: 'Peppol BIS UBL', value: 'peppol-ubl' },
	{ name: 'CII (Cross Industry Invoice)', value: 'cii' },
	// DACH
	{ name: 'XRechnung (DE)', value: 'xrechnung' },
	{ name: 'ZUGFeRD (DE/CH)', value: 'zugferd' },
	{ name: 'ebInterface (AT)', value: 'ebinterface' },
	{ name: 'QR-Bill (CH)', value: 'qr-bill' },
	// EU West
	{ name: 'Factur-X (FR)', value: 'facturx' },
	// EU South
	{ name: 'FatturaPA (IT)', value: 'fatturapa' },
	{ name: 'Facturae (ES)', value: 'facturae' },
	{ name: 'SAF-T (PT)', value: 'saft' },
	{ name: 'myDATA (GR)', value: 'mydata' },
	// EU East
	{ name: 'KSeF (PL)', value: 'ksef' },
	{ name: 'ISDOC (CZ)', value: 'isdoc' },
	{ name: 'NAV (HU)', value: 'nav' },
	{ name: 'E-Factura (RO)', value: 'efactura' },
];

/**
 * Country-specific format mappings (local superset — authoritative list comes
 * from the `/formats` endpoint). Mirrors the generate formats reported by the API.
 */
export const COUNTRY_FORMATS: Record<CountryCode, EInvoiceFormat[]> = {
	AT: ['pdf', 'ebinterface', 'ubl'],
	BE: ['pdf', 'ubl'],
	BG: ['pdf', 'ubl'],
	CH: ['pdf', 'zugferd', 'qr-bill'],
	CY: ['pdf', 'ubl'],
	CZ: ['pdf', 'isdoc', 'ubl'],
	DE: ['pdf', 'xrechnung', 'zugferd'],
	DK: ['pdf', 'ubl'],
	EE: ['pdf', 'ubl'],
	ES: ['pdf', 'facturae', 'ubl'],
	FI: ['pdf', 'ubl'],
	FR: ['pdf', 'facturx', 'ubl'],
	GB: ['pdf', 'ubl'],
	GR: ['pdf', 'mydata'],
	HU: ['pdf', 'nav'],
	IE: ['pdf', 'ubl'],
	IT: ['pdf', 'fatturapa'],
	LT: ['pdf', 'ubl'],
	LU: ['pdf', 'ubl'],
	LV: ['pdf', 'ubl'],
	MT: ['pdf', 'ubl'],
	NL: ['pdf', 'ubl'],
	NO: ['pdf', 'ubl'],
	PL: ['pdf', 'ubl', 'peppol-ubl'],
	PT: ['pdf', 'ubl', 'peppol-ubl'],
	RO: ['pdf', 'ubl', 'peppol-ubl'],
	SE: ['pdf', 'ubl'],
	SI: ['pdf', 'ubl'],
};

/**
 * MIME types for output formats
 */
export const FORMAT_MIME_TYPES: Record<string, string> = {
	pdf: 'application/pdf',
	ubl: 'application/xml',
	zugferd: 'application/pdf',
	xrechnung: 'application/xml',
	facturx: 'application/pdf',
	fatturapa: 'application/xml',
	facturae: 'application/xml',
	ebinterface: 'application/xml',
	isdoc: 'application/xml',
	nav: 'application/xml',
	mydata: 'application/xml',
	'qr-bill': 'application/pdf',
	'peppol-ubl': 'application/xml',
	cii: 'application/xml',
	ksef: 'application/xml',
	efactura: 'application/xml',
	saft: 'application/xml',
};

/**
 * File extensions for output formats
 */
export const FORMAT_EXTENSIONS: Record<string, string> = {
	pdf: '.pdf',
	ubl: '.xml',
	zugferd: '.pdf',
	xrechnung: '.xml',
	facturx: '.pdf',
	fatturapa: '.xml',
	facturae: '.xml',
	ebinterface: '.xml',
	isdoc: '.xml',
	nav: '.xml',
	mydata: '.xml',
	'qr-bill': '.pdf',
	'peppol-ubl': '.xml',
	cii: '.xml',
	ksef: '.xml',
	efactura: '.xml',
	saft: '.xml',
};
