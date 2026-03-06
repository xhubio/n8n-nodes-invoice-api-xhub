/**
 * Integration tests that exercise the actual node execute() functions
 * against the live invoice-api.xhub service.
 *
 * Requires API_KEY in .env.local with generate/validate/formats entitlements.
 * Run with: pnpm test -- test/integration.test.ts
 *
 * Generated documents are cached in test/fixtures/*.b64 so that parse tests
 * work even when the generate quota is exhausted.
 */
import * as fs from 'fs';
import * as path from 'path';

import * as formats from '../nodes/InvoiceXhub/actions/formats.operation';
import * as generate from '../nodes/InvoiceXhub/actions/generate.operation';
import * as parse from '../nodes/InvoiceXhub/actions/parse.operation';
import * as parseAutoDetect from '../nodes/InvoiceXhub/actions/parseAutoDetect.operation';
import * as validate from '../nodes/InvoiceXhub/actions/validate.operation';

import {
	createLiveExecuteFunctions,
	createLiveItem,
	loadFixture,
	saveFixture,
} from './helpers/liveExecuteFunctions';

const invoiceData = JSON.parse(
	fs.readFileSync(path.resolve(__dirname, 'invoice.json'), 'utf-8'),
);

const invoiceDataRE2026164 = JSON.parse(
	fs.readFileSync(path.resolve(__dirname, 'fixtures', 'invoice-RE-2026-164.json'), 'utf-8'),
);

jest.setTimeout(30_000);

/** Load a file from fixtures/ as base64. */
function loadFileAsBase64(filename: string): string {
	const filePath = path.resolve(__dirname, 'fixtures', filename);
	return fs.readFileSync(filePath).toString('base64');
}

/** Load cached fixture or generate live and cache. Fails if neither works. */
async function requireFixture(fixtureName: string, format: string): Promise<string> {
	const cached = loadFixture(fixtureName);
	if (cached) return cached;

	const ctx = createLiveExecuteFunctions({
		nodeParameters: {
			countryCode: 'DE',
			format,
			invoiceData,
			options: { outputBinary: false },
		},
	});
	const result = await generate.execute.call(ctx, [createLiveItem()]);
	const data = result[0].json.data as string;
	saveFixture(fixtureName, data);
	return data;
}

// ─── GET FORMATS ──────────────────────────────────────────────────────────────

describe('Get Formats', () => {
	it('should return all countries and formats', async () => {
		const ctx = createLiveExecuteFunctions({
			nodeParameters: { scope: 'all' },
		});

		const result = await formats.execute.call(ctx, [createLiveItem()]);

		expect(result).toHaveLength(1);
		expect(Array.isArray(result[0].json.countries)).toBe(true);
		expect((result[0].json.countries as unknown[]).length).toBeGreaterThanOrEqual(14);
		expect(result[0].json.totalCountries).toBeGreaterThanOrEqual(14);
	});

	it('should return formats for Germany (DE)', async () => {
		const ctx = createLiveExecuteFunctions({
			nodeParameters: { scope: 'country', countryCode: 'DE' },
		});

		const result = await formats.execute.call(ctx, [createLiveItem()]);

		expect(result).toHaveLength(1);
		expect(result[0].json.code).toBe('DE');
		expect(result[0].json.name).toBe('Germany');
		expect(result[0].json.formats).toContain('pdf');
		expect(result[0].json.formats).toContain('xrechnung');
		expect(result[0].json.formats).toContain('zugferd');
	});
});

// ─── VALIDATE ─────────────────────────────────────────────────────────────────

describe('Validate Invoice', () => {
	it('should validate a valid German invoice', async () => {
		const ctx = createLiveExecuteFunctions({
			nodeParameters: { countryCode: 'DE', invoiceData, options: {} },
		});

		const result = await validate.execute.call(ctx, [createLiveItem()]);

		expect(result).toHaveLength(1);
		expect(typeof result[0].json.valid).toBe('boolean');
		expect(result[0].json.countryCode).toBe('DE');
	});

	it('should return validation errors for an incomplete invoice', async () => {
		const ctx = createLiveExecuteFunctions({
			nodeParameters: {
				countryCode: 'DE',
				invoiceData: { invoiceNumber: 'EMPTY-001', type: 'invoice' },
				options: {},
			},
			continueOnFail: true,
		});

		const result = await validate.execute.call(ctx, [createLiveItem()]);

		expect(result).toHaveLength(1);
		expect(result[0].json.valid).toBe(false);
	});
});

// ─── GENERATE ─────────────────────────────────────────────────────────────────

describe('Generate Invoice', () => {
	it('should generate a PDF with binary output', async () => {
		const ctx = createLiveExecuteFunctions({
			nodeParameters: {
				countryCode: 'DE',
				format: 'pdf',
				invoiceData,
				options: { outputBinary: true, binaryPropertyName: 'data' },
			},
		});

		const result = await generate.execute.call(ctx, [createLiveItem()]);

		expect(result).toHaveLength(1);
		expect(result[0].json.success).toBe(true);
		expect(result[0].json.format).toBe('pdf');
		expect(result[0].json.mimeType).toBe('application/pdf');
		expect(result[0].json.hash).toBeDefined();
		expect(result[0].binary).toBeDefined();
		expect(result[0].binary!.data).toBeDefined();

		const pdfBuffer = Buffer.from(result[0].binary!.data.data, 'base64');
		expect(pdfBuffer.length).toBeGreaterThan(100);
		expect(pdfBuffer.subarray(0, 5).toString('ascii')).toBe('%PDF-');
	});

	it('should generate XRechnung as base64 XML', async () => {
		const ctx = createLiveExecuteFunctions({
			nodeParameters: {
				countryCode: 'DE',
				format: 'xrechnung',
				invoiceData,
				options: { outputBinary: false },
			},
		});

		const result = await generate.execute.call(ctx, [createLiveItem()]);

		expect(result).toHaveLength(1);
		expect(result[0].json.success).toBe(true);
		expect(result[0].json.format).toBe('xrechnung');
		expect(typeof result[0].json.data).toBe('string');

		const xml = Buffer.from(result[0].json.data as string, 'base64').toString('utf-8');
		expect(xml).toContain('<?xml');

		saveFixture('de-xrechnung', result[0].json.data as string);
	});

	it('should generate ZUGFeRD as base64 PDF', async () => {
		const ctx = createLiveExecuteFunctions({
			nodeParameters: {
				countryCode: 'DE',
				format: 'zugferd',
				invoiceData,
				options: { outputBinary: false },
			},
		});

		const result = await generate.execute.call(ctx, [createLiveItem()]);

		expect(result).toHaveLength(1);
		expect(result[0].json.success).toBe(true);
		expect(result[0].json.format).toBe('zugferd');

		const pdfBuffer = Buffer.from(result[0].json.data as string, 'base64');
		expect(pdfBuffer.subarray(0, 5).toString('ascii')).toBe('%PDF-');

		saveFixture('de-zugferd', result[0].json.data as string);
	});
});

// ─── GENERATE RE-2026-164 ─────────────────────────────────────────────────────

describe('Generate Invoice RE-2026-164', () => {
	it('should generate ZUGFeRD with RE-2026-164 data as base64 PDF', async () => {
		const ctx = createLiveExecuteFunctions({
			nodeParameters: {
				countryCode: 'DE',
				format: 'zugferd',
				invoiceData: invoiceDataRE2026164,
				options: { outputBinary: false },
			},
		});

		const result = await generate.execute.call(ctx, [createLiveItem()]);

		expect(result).toHaveLength(1);
		expect(result[0].json.success).toBe(true);
		expect(result[0].json.format).toBe('zugferd');

		const pdfBuffer = Buffer.from(result[0].json.data as string, 'base64');
		expect(pdfBuffer.subarray(0, 5).toString('ascii')).toBe('%PDF-');

		saveFixture('de-zugferd-RE-2026-164', result[0].json.data as string);
	});
});

// ─── PARSE ────────────────────────────────────────────────────────────────────

describe('Parse Invoice', () => {
	it('should parse XRechnung or return entitlement error', async () => {
		const xrechnungBase64 = await requireFixture('de-xrechnung', 'xrechnung');

		const ctx = createLiveExecuteFunctions({
			nodeParameters: {
				countryCode: 'DE',
				format: 'xrechnung',
				inputType: 'base64',
				base64Data: xrechnungBase64,
				options: { filename: 'invoice.xml', includeWarnings: true },
			},
			continueOnFail: true,
		});

		const result = await parse.execute.call(ctx, [createLiveItem()]);

		expect(result).toHaveLength(1);

		if (result[0].json.success) {
			expect(result[0].json.format).toBeDefined();
			expect(result[0].json.hash).toBeDefined();
			expect(result[0].json.invoice).toBeDefined();

			const invoice = result[0].json.invoice as Record<string, unknown>;
			expect(invoice.invoiceNumber).toBe('RE-2025-001');
			expect(invoice.currency).toBe('EUR');
			expect(invoice.total).toBe(2378.81);
		} else {
			expect(result[0].json.error).toContain('entitlement');
		}
	});

	it('should parse ZUGFeRD or return entitlement error', async () => {
		const zugferdBase64 = await requireFixture('de-zugferd', 'zugferd');

		const ctx = createLiveExecuteFunctions({
			nodeParameters: {
				countryCode: 'DE',
				format: 'zugferd',
				inputType: 'base64',
				base64Data: zugferdBase64,
				options: { filename: 'invoice.pdf', includeWarnings: true },
			},
			continueOnFail: true,
		});

		const result = await parse.execute.call(ctx, [createLiveItem()]);

		expect(result).toHaveLength(1);

		if (result[0].json.success) {
			expect(result[0].json.format).toBeDefined();
			expect(result[0].json.hash).toBeDefined();
			expect(result[0].json.invoice).toBeDefined();

			const invoice = result[0].json.invoice as Record<string, unknown>;
			expect(invoice.invoiceNumber).toBe('RE-2025-001');
			expect(invoice.currency).toBe('EUR');
			expect(invoice.total).toBe(2378.81);
		} else {
			expect(result[0].json.error).toContain('entitlement');
		}
	});
});

describe('Parse Auto-Detect', () => {
	it('should auto-detect XRechnung or return entitlement error', async () => {
		const xrechnungBase64 = await requireFixture('de-xrechnung', 'xrechnung');

		const ctx = createLiveExecuteFunctions({
			nodeParameters: {
				inputType: 'base64',
				base64Data: xrechnungBase64,
				options: { filename: 'invoice.xml', includeWarnings: true },
			},
			continueOnFail: true,
		});

		const result = await parseAutoDetect.execute.call(ctx, [createLiveItem()]);

		expect(result).toHaveLength(1);

		if (result[0].json.success) {
			expect(result[0].json.invoice).toBeDefined();
			expect(result[0].json.detectedFormat).toBeDefined();
			expect(result[0].json.detectedCountry).toBe('DE');
			expect(result[0].json.confidence).toBeGreaterThan(0);

			const invoice = result[0].json.invoice as Record<string, unknown>;
			expect(invoice.invoiceNumber).toBe('RE-2025-001');
		} else {
			expect(result[0].json.error).toContain('entitlement');
		}
	});
});

// ─── PARSE REAL FACTUR-X DOCUMENT ─────────────────────────────────────────────

describe('Parse with real Factur-X document', () => {
	it('should parse real Factur-X PDF (format=zugferd) or return entitlement error', async () => {
		const pdfBase64 = loadFileAsBase64('zugferd-RE-2026-164.pdf');

		const ctx = createLiveExecuteFunctions({
			nodeParameters: {
				countryCode: 'DE',
				format: 'zugferd',
				inputType: 'base64',
				base64Data: pdfBase64,
				options: { filename: 'zugferd-RE-2026-164.pdf', includeWarnings: true },
			},
			continueOnFail: true,
		});

		const result = await parse.execute.call(ctx, [createLiveItem()]);

		expect(result).toHaveLength(1);

		if (result[0].json.success) {
			expect(result[0].json.format).toBeDefined();
			expect(result[0].json.invoice).toBeDefined();

			const invoice = result[0].json.invoice as Record<string, unknown>;
			expect(invoice.invoiceNumber).toBe('RE-2026-164');
			expect(invoice.currency).toBe('EUR');
			expect(invoice.total).toBe(14299.04);
		} else {
			expect(result[0].json.error).toContain('entitlement');
		}
	});

	it('should auto-detect real Factur-X PDF or return entitlement error', async () => {
		const pdfBase64 = loadFileAsBase64('zugferd-RE-2026-164.pdf');

		const ctx = createLiveExecuteFunctions({
			nodeParameters: {
				inputType: 'base64',
				base64Data: pdfBase64,
				options: { filename: 'zugferd-RE-2026-164.pdf', includeWarnings: true },
			},
			continueOnFail: true,
		});

		const result = await parseAutoDetect.execute.call(ctx, [createLiveItem()]);

		expect(result).toHaveLength(1);

		if (result[0].json.success) {
			expect(result[0].json.invoice).toBeDefined();
			expect(result[0].json.detectedCountry).toBe('DE');
			expect(result[0].json.detectedFormat).toBeDefined();
			expect(result[0].json.confidence).toBeGreaterThan(0);

			const invoice = result[0].json.invoice as Record<string, unknown>;
			expect(invoice.invoiceNumber).toBe('RE-2026-164');
		} else {
			expect(result[0].json.error).toContain('entitlement');
		}
	});

	it('should parse real Factur-X XML (format=zugferd) or return entitlement error', async () => {
		const xmlBase64 = loadFileAsBase64('zugferd-RE-2026-164.xml');

		const ctx = createLiveExecuteFunctions({
			nodeParameters: {
				countryCode: 'DE',
				format: 'zugferd',
				inputType: 'base64',
				base64Data: xmlBase64,
				options: { filename: 'zugferd-RE-2026-164.xml', includeWarnings: true },
			},
			continueOnFail: true,
		});

		const result = await parse.execute.call(ctx, [createLiveItem()]);

		expect(result).toHaveLength(1);

		if (result[0].json.success) {
			expect(result[0].json.format).toBeDefined();
			expect(result[0].json.invoice).toBeDefined();

			const invoice = result[0].json.invoice as Record<string, unknown>;
			expect(invoice.invoiceNumber).toBe('RE-2026-164');
			expect(invoice.currency).toBe('EUR');
			expect(invoice.total).toBe(14299.04);
		} else {
			expect(result[0].json.error).toContain('entitlement');
		}
	});

	it('should auto-detect real Factur-X XML or return entitlement error', async () => {
		const xmlBase64 = loadFileAsBase64('zugferd-RE-2026-164.xml');

		const ctx = createLiveExecuteFunctions({
			nodeParameters: {
				inputType: 'base64',
				base64Data: xmlBase64,
				options: { filename: 'zugferd-RE-2026-164.xml', includeWarnings: true },
			},
			continueOnFail: true,
		});

		const result = await parseAutoDetect.execute.call(ctx, [createLiveItem()]);

		expect(result).toHaveLength(1);

		if (result[0].json.success) {
			expect(result[0].json.invoice).toBeDefined();
			expect(result[0].json.detectedCountry).toBe('DE');
			expect(result[0].json.detectedFormat).toBeDefined();
			expect(result[0].json.confidence).toBeGreaterThan(0);

			const invoice = result[0].json.invoice as Record<string, unknown>;
			expect(invoice.invoiceNumber).toBe('RE-2026-164');
		} else {
			expect(result[0].json.error).toContain('entitlement');
		}
	});
});

// ─── ERROR HANDLING ───────────────────────────────────────────────────────────

describe('Error Handling', () => {
	it('should return error item for invalid country with continueOnFail', async () => {
		const ctx = createLiveExecuteFunctions({
			nodeParameters: {
				countryCode: 'XX',
				format: 'pdf',
				invoiceData,
				options: {},
			},
			continueOnFail: true,
		});

		const result = await generate.execute.call(ctx, [createLiveItem()]);

		expect(result).toHaveLength(1);
		expect(result[0].json.success).toBe(false);
		expect(result[0].json.error).toBeDefined();
	});

	it('should return error item for empty invoice with continueOnFail', async () => {
		const ctx = createLiveExecuteFunctions({
			nodeParameters: { countryCode: 'DE', invoiceData: {}, options: {} },
			continueOnFail: true,
		});

		const result = await validate.execute.call(ctx, [createLiveItem()]);

		expect(result).toHaveLength(1);
		expect(result[0].json.valid).toBe(false);
	});

	it('should throw for invalid country without continueOnFail', async () => {
		const ctx = createLiveExecuteFunctions({
			nodeParameters: {
				countryCode: 'XX',
				format: 'pdf',
				invoiceData,
				options: {},
			},
			continueOnFail: false,
		});

		await expect(generate.execute.call(ctx, [createLiveItem()])).rejects.toThrow();
	});
});
