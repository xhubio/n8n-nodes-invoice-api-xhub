import { SUPPORTED_COUNTRIES, E_INVOICE_FORMATS, COUNTRY_FORMATS } from '../shared/constants';
import * as actions from '../nodes/InvoiceXhub/actions';

describe('InvoiceXhub Constants', () => {
	describe('SUPPORTED_COUNTRIES', () => {
		it('should have 14 supported countries', () => {
			expect(SUPPORTED_COUNTRIES).toHaveLength(14);
		});

		it('should include DACH countries', () => {
			expect(SUPPORTED_COUNTRIES).toContain('DE');
			expect(SUPPORTED_COUNTRIES).toContain('AT');
			expect(SUPPORTED_COUNTRIES).toContain('CH');
		});

		it('should include EU West countries', () => {
			expect(SUPPORTED_COUNTRIES).toContain('FR');
			expect(SUPPORTED_COUNTRIES).toContain('BE');
			expect(SUPPORTED_COUNTRIES).toContain('NL');
		});

		it('should include EU South countries', () => {
			expect(SUPPORTED_COUNTRIES).toContain('IT');
			expect(SUPPORTED_COUNTRIES).toContain('ES');
			expect(SUPPORTED_COUNTRIES).toContain('PT');
		});

		it('should include EU East countries', () => {
			expect(SUPPORTED_COUNTRIES).toContain('PL');
			expect(SUPPORTED_COUNTRIES).toContain('CZ');
			expect(SUPPORTED_COUNTRIES).toContain('HU');
			expect(SUPPORTED_COUNTRIES).toContain('RO');
			expect(SUPPORTED_COUNTRIES).toContain('BG');
		});
	});

	describe('E_INVOICE_FORMATS', () => {
		it('matches OpenAPI v1.1 format enum', () => {
			expect(E_INVOICE_FORMATS).toEqual(
				expect.arrayContaining([
					'pdf',
					'zugferd',
					'xrechnung',
					'ebinterface',
					'facturx',
					'fatturapa',
					'facturae',
					'ubl',
					'isdoc',
					'nav',
					'ksef',
					'efactura',
					'saft',
				]),
			);
		});

		it('should include German formats', () => {
			expect(E_INVOICE_FORMATS).toContain('xrechnung');
			expect(E_INVOICE_FORMATS).toContain('zugferd');
		});

		it('should include generic formats', () => {
			expect(E_INVOICE_FORMATS).toContain('pdf');
			expect(E_INVOICE_FORMATS).toContain('ubl');
		});
	});

	describe('COUNTRY_FORMATS', () => {
		it('should have formats for all countries', () => {
			for (const country of SUPPORTED_COUNTRIES) {
				expect(COUNTRY_FORMATS[country]).toBeDefined();
				expect(COUNTRY_FORMATS[country].length).toBeGreaterThan(0);
			}
		});

		it('should have xrechnung for Germany', () => {
			expect(COUNTRY_FORMATS.DE).toContain('xrechnung');
		});

		it('should have fatturapa for Italy', () => {
			expect(COUNTRY_FORMATS.IT).toContain('fatturapa');
		});
	});
});

describe('InvoiceXhub Actions', () => {
	describe('parseAutoDetect', () => {
		it('should export description and execute', () => {
			expect(actions.parseAutoDetect).toBeDefined();
			expect(actions.parseAutoDetect.description).toBeDefined();
			expect(Array.isArray(actions.parseAutoDetect.description)).toBe(true);
			expect(actions.parseAutoDetect.execute).toBeDefined();
			expect(typeof actions.parseAutoDetect.execute).toBe('function');
		});
	});
});
