"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FORMAT_EXTENSIONS = exports.FORMAT_MIME_TYPES = exports.COUNTRY_FORMATS = exports.FORMAT_OPTIONS = exports.E_INVOICE_FORMATS = exports.COUNTRY_OPTIONS = exports.SUPPORTED_COUNTRIES = void 0;
/**
 * Supported country codes for invoice-api.xhub API.
 *
 * Displayed in UI in uppercase (ISO 3166-1 alpha-2). The API expects
 * lowercase in URL paths — that lowercasing happens at the HTTP boundary
 * (see GenericFunctions.ts).
 */
exports.SUPPORTED_COUNTRIES = [
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
];
/**
 * Country options for n8n dropdowns
 */
exports.COUNTRY_OPTIONS = [
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
 * E-Invoice format identifiers matching the OpenAPI v1.1 `format` path enum.
 */
exports.E_INVOICE_FORMATS = [
    'pdf', // All countries (universal PDF)
    'zugferd', // DE - ZUGFeRD (PDF + embedded XML)
    'xrechnung', // DE - XRechnung (XML)
    'ebinterface', // AT - ebInterface
    'facturx', // FR - Factur-X
    'fatturapa', // IT - FatturaPA
    'facturae', // ES - Facturae
    'ubl', // Generic UBL (BE, NL, RO, and fallback)
    'isdoc', // CZ - ISDOC
    'nav', // HU - NAV
    'ksef', // PL - KSeF
    'efactura', // RO - e-Factura
    'saft', // PT - SAF-T
];
/**
 * Format options for n8n dropdowns (grouped by region)
 */
exports.FORMAT_OPTIONS = [
    // Universal
    { name: 'PDF', value: 'pdf' },
    // DACH
    { name: 'XRechnung (DE)', value: 'xrechnung' },
    { name: 'ZUGFeRD (DE)', value: 'zugferd' },
    { name: 'ebInterface (AT)', value: 'ebinterface' },
    // EU West
    { name: 'Factur-X (FR)', value: 'facturx' },
    // EU South
    { name: 'FatturaPA (IT)', value: 'fatturapa' },
    { name: 'Facturae (ES)', value: 'facturae' },
    { name: 'SAF-T (PT)', value: 'saft' },
    // EU East
    { name: 'KSeF (PL)', value: 'ksef' },
    { name: 'ISDOC (CZ)', value: 'isdoc' },
    { name: 'NAV (HU)', value: 'nav' },
    { name: 'E-Factura (RO)', value: 'efactura' },
    // Generic
    { name: 'UBL (Generic)', value: 'ubl' },
];
/**
 * Country-specific format mappings (local superset — authoritative list comes from the /formats endpoint)
 */
exports.COUNTRY_FORMATS = {
    DE: ['xrechnung', 'zugferd', 'pdf', 'ubl'],
    AT: ['ebinterface', 'zugferd', 'pdf', 'ubl'],
    CH: ['zugferd', 'pdf', 'ubl'],
    BE: ['ubl', 'pdf'],
    NL: ['ubl', 'pdf'],
    FR: ['facturx', 'pdf', 'ubl'],
    IT: ['fatturapa', 'pdf'],
    ES: ['facturae', 'pdf'],
    PT: ['saft', 'pdf', 'ubl'],
    PL: ['ksef', 'pdf', 'ubl'],
    CZ: ['isdoc', 'pdf', 'ubl'],
    HU: ['nav', 'pdf', 'ubl'],
    RO: ['efactura', 'pdf', 'ubl'],
    BG: ['ubl', 'pdf'],
};
/**
 * MIME types for output formats
 */
exports.FORMAT_MIME_TYPES = {
    pdf: 'application/pdf',
    xrechnung: 'application/xml',
    zugferd: 'application/pdf',
    facturx: 'application/pdf',
    ebinterface: 'application/xml',
    fatturapa: 'application/xml',
    facturae: 'application/xml',
    ubl: 'application/xml',
    ksef: 'application/xml',
    isdoc: 'application/xml',
    nav: 'application/xml',
    efactura: 'application/xml',
    saft: 'application/xml',
};
/**
 * File extensions for output formats
 */
exports.FORMAT_EXTENSIONS = {
    pdf: '.pdf',
    xrechnung: '.xml',
    zugferd: '.pdf',
    facturx: '.pdf',
    ebinterface: '.xml',
    fatturapa: '.xml',
    facturae: '.xml',
    ubl: '.xml',
    ksef: '.xml',
    isdoc: '.xml',
    nav: '.xml',
    efactura: '.xml',
    saft: '.xml',
};
//# sourceMappingURL=constants.js.map