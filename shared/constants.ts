import type { INodePropertyOptions } from 'n8n-workflow';

/**
 * Supported country codes for invoice-api.xhub API
 */
export const SUPPORTED_COUNTRIES = [
	'DE', // Germany
	'AT', // Austria
	'CH', // Switzerland
	'BE', // Belgium
	'NL', // Netherlands
	'FR', // France
	'IT', // Italy
	'ES', // Spain
	'PT', // Portugal
	'PL', // Poland
	'CZ', // Czech Republic
	'HU', // Hungary
	'RO', // Romania
	'BG', // Bulgaria
] as const;

export type CountryCode = (typeof SUPPORTED_COUNTRIES)[number];

/**
 * Country options for n8n dropdowns
 */
export const COUNTRY_OPTIONS: INodePropertyOptions[] = [
	{ name: 'Germany (DE)', value: 'DE' },
	{ name: 'Austria (AT)', value: 'AT' },
	{ name: 'Switzerland (CH)', value: 'CH' },
	{ name: 'Belgium (BE)', value: 'BE' },
	{ name: 'Netherlands (NL)', value: 'NL' },
	{ name: 'France (FR)', value: 'FR' },
	{ name: 'Italy (IT)', value: 'IT' },
	{ name: 'Spain (ES)', value: 'ES' },
	{ name: 'Portugal (PT)', value: 'PT' },
	{ name: 'Poland (PL)', value: 'PL' },
	{ name: 'Czech Republic (CZ)', value: 'CZ' },
	{ name: 'Hungary (HU)', value: 'HU' },
	{ name: 'Romania (RO)', value: 'RO' },
	{ name: 'Bulgaria (BG)', value: 'BG' },
];

/**
 * E-Invoice format identifiers
 */
export const E_INVOICE_FORMATS = [
	'xrechnung', // DE - XRechnung
	'zugferd', // DE - ZUGFeRD
	'ebinterface', // AT - ebInterface
	'qr-rechnung', // CH - QR-Rechnung
	'ubl-be', // BE - UBL Belgium
	'ubl-nl', // NL - UBL Netherlands
	'facturx', // FR - Factur-X
	'fatturapa', // IT - FatturaPA
	'facturae', // ES - Facturae
	'isdoc', // CZ - ISDOC
	'nav', // HU - NAV
	'ksef', // PL - KSeF
	'saf-t', // PT - SAF-T
	'efactura', // RO - e-Factura
	'ubl-bg', // BG - UBL Bulgaria
	'pdf', // PDF only
	'ubl', // Generic UBL
	'cii', // Cross Industry Invoice
] as const;

export type EInvoiceFormat = (typeof E_INVOICE_FORMATS)[number];

/**
 * Format options for n8n dropdowns (grouped by region)
 */
export const FORMAT_OPTIONS: INodePropertyOptions[] = [
	// DACH Region
	{ name: 'XRechnung (DE)', value: 'xrechnung' },
	{ name: 'ZUGFeRD (DE)', value: 'zugferd' },
	{ name: 'ebInterface (AT)', value: 'ebinterface' },
	{ name: 'QR-Rechnung (CH)', value: 'qr-rechnung' },
	// EU West
	{ name: 'Factur-X (FR)', value: 'facturx' },
	{ name: 'UBL Belgium (BE)', value: 'ubl-be' },
	{ name: 'UBL Netherlands (NL)', value: 'ubl-nl' },
	// EU South
	{ name: 'FatturaPA (IT)', value: 'fatturapa' },
	{ name: 'Facturae (ES)', value: 'facturae' },
	{ name: 'SAF-T (PT)', value: 'saf-t' },
	// EU East
	{ name: 'KSeF (PL)', value: 'ksef' },
	{ name: 'ISDOC (CZ)', value: 'isdoc' },
	{ name: 'NAV (HU)', value: 'nav' },
	{ name: 'E-Factura (RO)', value: 'efactura' },
	{ name: 'UBL Bulgaria (BG)', value: 'ubl-bg' },
	// Generic
	{ name: 'PDF', value: 'pdf' },
	{ name: 'UBL (Generic)', value: 'ubl' },
	{ name: 'CII (Cross Industry Invoice)', value: 'cii' },
];

/**
 * Country-specific format mappings (local superset — authoritative list comes from the /formats endpoint)
 */
export const COUNTRY_FORMATS: Record<CountryCode, EInvoiceFormat[]> = {
	DE: ['xrechnung', 'zugferd', 'pdf', 'ubl', 'cii'],
	AT: ['ebinterface', 'zugferd', 'pdf', 'ubl'],
	CH: ['qr-rechnung', 'zugferd', 'pdf', 'ubl'],
	BE: ['ubl-be', 'pdf', 'ubl'],
	NL: ['ubl-nl', 'pdf', 'ubl'],
	FR: ['facturx', 'pdf', 'ubl', 'cii'],
	IT: ['fatturapa', 'pdf'],
	ES: ['facturae', 'pdf'],
	PT: ['saf-t', 'pdf', 'ubl'],
	PL: ['ksef', 'pdf', 'ubl'],
	CZ: ['isdoc', 'pdf', 'ubl'],
	HU: ['nav', 'pdf', 'ubl'],
	RO: ['efactura', 'pdf', 'ubl'],
	BG: ['ubl-bg', 'pdf', 'ubl'],
};

/**
 * MIME types for output formats
 */
export const FORMAT_MIME_TYPES: Record<string, string> = {
	pdf: 'application/pdf',
	xrechnung: 'application/xml',
	zugferd: 'application/pdf',
	facturx: 'application/pdf',
	ebinterface: 'application/xml',
	fatturapa: 'application/xml',
	facturae: 'application/xml',
	ubl: 'application/xml',
	cii: 'application/xml',
	'ubl-be': 'application/xml',
	'ubl-nl': 'application/xml',
	'ubl-bg': 'application/xml',
	ksef: 'application/xml',
	isdoc: 'application/xml',
	nav: 'application/xml',
	efactura: 'application/xml',
	'qr-rechnung': 'application/pdf',
	'saf-t': 'application/xml',
};

/**
 * File extensions for output formats
 */
export const FORMAT_EXTENSIONS: Record<string, string> = {
	pdf: '.pdf',
	xrechnung: '.xml',
	zugferd: '.pdf',
	facturx: '.pdf',
	ebinterface: '.xml',
	fatturapa: '.xml',
	facturae: '.xml',
	ubl: '.xml',
	cii: '.xml',
	'ubl-be': '.xml',
	'ubl-nl': '.xml',
	'ubl-bg': '.xml',
	ksef: '.xml',
	isdoc: '.xml',
	nav: '.xml',
	efactura: '.xml',
	'qr-rechnung': '.pdf',
	'saf-t': '.xml',
};
