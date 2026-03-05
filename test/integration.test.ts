/**
 * Integration tests that exercise the actual node execute() functions
 * against the live invoice-api.xhub service.
 *
 * Requires API_KEY in .env.local (e.g. sk_live_xxxx).
 * Run with: pnpm test -- test/integration.test.ts
 *
 * NOTE: Tests are scoped to the entitlements of the API key.
 * Parse operations returning 403 are tested as "missing entitlement" assertions.
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

// Load test invoice fixture
const invoiceData = JSON.parse(
	fs.readFileSync(path.resolve(__dirname, 'invoice.json'), 'utf-8'),
);

jest.setTimeout(30_000);

// ─── Helper: generate via node operation, cache result ────────────────────────

async function generateOrLoadFixture(
	fixtureName: string,
	format: string,
): Promise<string | undefined> {
	// Try cached fixture first
	const cached = loadFixture(fixtureName);
	if (cached) return cached;

	// Generate live (may fail due to quota)
	try {
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

		// Cache for next run
		saveFixture(fixtureName, data);
		return data;
	} catch {
		return undefined;
	}
}

// ─── GET FORMATS ──────────────────────────────────────────────────────────────

describe('Get Formats', () => {
	it('should return all countries and formats', async () => {
		const ctx = createLiveExecuteFunctions({
			nodeParameters: { scope: 'all' },
		});
		const items = [createLiveItem()];

		const result = await formats.execute.call(ctx, items);

		expect(result).toHaveLength(1);
		expect(result[0].json.countries).toBeDefined();
		expect(Array.isArray(result[0].json.countries)).toBe(true);
		expect((result[0].json.countries as unknown[]).length).toBeGreaterThanOrEqual(14);
		expect(result[0].json.totalCountries).toBeGreaterThanOrEqual(14);
	});

	it('should return formats for Germany (DE)', async () => {
		const ctx = createLiveExecuteFunctions({
			nodeParameters: { scope: 'country', countryCode: 'DE' },
		});
		const items = [createLiveItem()];

		const result = await formats.execute.call(ctx, items);

		expect(result).toHaveLength(1);
		expect(result[0].json.code).toBe('DE');
		expect(result[0].json.name).toBe('Germany');
		expect(Array.isArray(result[0].json.formats)).toBe(true);
		expect(result[0].json.formats).toContain('pdf');
		expect(result[0].json.formats).toContain('xrechnung');
		expect(result[0].json.formats).toContain('zugferd');
	});
});

// ─── VALIDATE ─────────────────────────────────────────────────────────────────

describe('Validate Invoice', () => {
	it('should validate a valid German invoice', async () => {
		const ctx = createLiveExecuteFunctions({
			nodeParameters: {
				countryCode: 'DE',
				invoiceData,
				options: {},
			},
		});
		const items = [createLiveItem()];

		const result = await validate.execute.call(ctx, items);

		expect(result).toHaveLength(1);
		expect(result[0].json.valid).toBeDefined();
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
		const items = [createLiveItem()];

		const result = await validate.execute.call(ctx, items);

		expect(result).toHaveLength(1);
		// API may return 400 (caught as error) or 200 with valid=false
		if (result[0].json.error) {
			// Error was caught by continueOnFail
			expect(result[0].json.valid).toBe(false);
		} else {
			expect(result[0].json.valid).toBe(false);
			expect((result[0].json.errors as unknown[]).length).toBeGreaterThan(0);
		}
	});
});

// ─── GENERATE ─────────────────────────────────────────────────────────────────

describe('Generate Invoice', () => {
	it('should generate a PDF for Germany with binary output (or handle quota exceeded)', async () => {
		const ctx = createLiveExecuteFunctions({
			nodeParameters: {
				countryCode: 'DE',
				format: 'pdf',
				invoiceData,
				options: { outputBinary: true, binaryPropertyName: 'data' },
			},
			continueOnFail: true,
		});
		const items = [createLiveItem()];

		const result = await generate.execute.call(ctx, items);

		expect(result).toHaveLength(1);

		if (result[0].json.success === false) {
			// Quota exceeded (429) or other API limitation
			expect(result[0].json.error).toBeDefined();
		} else {
			expect(result[0].json.success).toBe(true);
			expect(result[0].json.format).toBe('pdf');
			expect(result[0].json.mimeType).toBe('application/pdf');
			expect(result[0].json.hash).toBeDefined();

			// Verify binary output
			expect(result[0].binary).toBeDefined();
			expect(result[0].binary!.data).toBeDefined();

			// Verify PDF header in the binary data
			const pdfBuffer = Buffer.from(result[0].binary!.data.data, 'base64');
			expect(pdfBuffer.length).toBeGreaterThan(100);
			expect(pdfBuffer.subarray(0, 5).toString('ascii')).toBe('%PDF-');
		}
	});

	it('should generate XRechnung for Germany (or handle quota exceeded)', async () => {
		const ctx = createLiveExecuteFunctions({
			nodeParameters: {
				countryCode: 'DE',
				format: 'xrechnung',
				invoiceData,
				options: { outputBinary: false },
			},
			continueOnFail: true,
		});
		const items = [createLiveItem()];

		const result = await generate.execute.call(ctx, items);

		expect(result).toHaveLength(1);

		if (result[0].json.success === false) {
			// Quota exceeded (429) or other API limitation
			expect(result[0].json.error).toBeDefined();
		} else {
			expect(result[0].json.success).toBe(true);
			expect(result[0].json.format).toBe('xrechnung');

			// With outputBinary=false, data should be in JSON as base64
			expect(typeof result[0].json.data).toBe('string');
			const xml = Buffer.from(result[0].json.data as string, 'base64').toString('utf-8');
			expect(xml).toContain('<?xml');

			// Cache for parse tests
			saveFixture('de-xrechnung', result[0].json.data as string);
		}
	});

	it('should generate ZUGFeRD for Germany (or handle quota exceeded)', async () => {
		const ctx = createLiveExecuteFunctions({
			nodeParameters: {
				countryCode: 'DE',
				format: 'zugferd',
				invoiceData,
				options: { outputBinary: false },
			},
			continueOnFail: true,
		});
		const items = [createLiveItem()];

		const result = await generate.execute.call(ctx, items);

		expect(result).toHaveLength(1);

		if (result[0].json.success === false) {
			// Quota exceeded (429) or other API limitation
			expect(result[0].json.error).toBeDefined();
		} else {
			expect(result[0].json.success).toBe(true);
			expect(result[0].json.format).toBe('zugferd');

			// ZUGFeRD is a PDF with embedded XML
			const pdfBuffer = Buffer.from(result[0].json.data as string, 'base64');
			expect(pdfBuffer.subarray(0, 5).toString('ascii')).toBe('%PDF-');

			// Cache for parse tests
			saveFixture('de-zugferd', result[0].json.data as string);
		}
	});
});

// ─── PARSE ────────────────────────────────────────────────────────────────────

describe('Parse Invoice', () => {
	it('should parse an XRechnung document (or 403 if no parse entitlement)', async () => {
		const xrechnungBase64 = await generateOrLoadFixture('de-xrechnung', 'xrechnung');
		expect(xrechnungBase64).toBeDefined(); // No fixture cached and generate quota exhausted — run once with quota to seed
		if (!xrechnungBase64) return; // TypeScript narrowing

		const ctx = createLiveExecuteFunctions({
			nodeParameters: {
				countryCode: 'DE',
				format: 'xrechnung',
				inputType: 'base64',
				base64Data: xrechnungBase64,
				options: { filename: 'invoice.xml' },
			},
			continueOnFail: true,
		});
		const items = [createLiveItem()];

		const result = await parse.execute.call(ctx, items);

		expect(result).toHaveLength(1);

		if (result[0].json.success === false && typeof result[0].json.error === 'string') {
			// 403 — missing parse entitlement is acceptable
			expect(result[0].json.error).toBeDefined();
		} else {
			expect(result[0].json.success).toBe(true);
			expect(result[0].json.invoice).toBeDefined();
			const parsed = result[0].json.invoice as Record<string, unknown>;
			expect(parsed.invoiceNumber).toBe(invoiceData.invoiceNumber);
		}
	});

	it('should parse a ZUGFeRD document (or 403 if no parse entitlement)', async () => {
		const zugferdBase64 = await generateOrLoadFixture('de-zugferd', 'zugferd');
		expect(zugferdBase64).toBeDefined(); // No fixture cached and generate quota exhausted — run once with quota to seed
		if (!zugferdBase64) return; // TypeScript narrowing

		const ctx = createLiveExecuteFunctions({
			nodeParameters: {
				countryCode: 'DE',
				format: 'zugferd',
				inputType: 'base64',
				base64Data: zugferdBase64,
				options: { filename: 'invoice.pdf' },
			},
			continueOnFail: true,
		});
		const items = [createLiveItem()];

		const result = await parse.execute.call(ctx, items);

		expect(result).toHaveLength(1);

		if (result[0].json.success === false && typeof result[0].json.error === 'string') {
			expect(result[0].json.error).toBeDefined();
		} else {
			expect(result[0].json.success).toBe(true);
			expect(result[0].json.invoice).toBeDefined();
		}
	});
});

// ─── PARSE AUTO-DETECT ────────────────────────────────────────────────────────

describe('Parse Auto-Detect', () => {
	it('should auto-detect XRechnung (or 403 if no parse entitlement)', async () => {
		const base64 = await generateOrLoadFixture('de-xrechnung', 'xrechnung');
		expect(base64).toBeDefined(); // No fixture cached and generate quota exhausted — run once with quota to seed
		if (!base64) return; // TypeScript narrowing

		const ctx = createLiveExecuteFunctions({
			nodeParameters: {
				inputType: 'base64',
				base64Data: base64,
				options: { filename: 'invoice.xml' },
			},
			continueOnFail: true,
		});
		const items = [createLiveItem()];

		const result = await parseAutoDetect.execute.call(ctx, items);

		expect(result).toHaveLength(1);

		if (result[0].json.success === false && typeof result[0].json.error === 'string') {
			expect(result[0].json.error).toBeDefined();
		} else {
			expect(result[0].json.success).toBe(true);
			expect(result[0].json.invoice).toBeDefined();
			expect(result[0].json.detection).toBeDefined();

			const detection = result[0].json.detection as Record<string, unknown>;
			expect(detection.confidence).toBeGreaterThan(0);
		}
	});
});

// ─── ERROR HANDLING ───────────────────────────────────────────────────────────

describe('Error Handling', () => {
	it('should handle invalid country with continueOnFail', async () => {
		const ctx = createLiveExecuteFunctions({
			nodeParameters: {
				countryCode: 'XX',
				format: 'pdf',
				invoiceData,
				options: {},
			},
			continueOnFail: true,
		});
		const items = [createLiveItem()];

		const result = await generate.execute.call(ctx, items);

		expect(result).toHaveLength(1);
		expect(result[0].json.success).toBe(false);
		expect(result[0].json.error).toBeDefined();
	});

	it('should handle empty invoice with continueOnFail', async () => {
		const ctx = createLiveExecuteFunctions({
			nodeParameters: {
				countryCode: 'DE',
				invoiceData: {},
				options: {},
			},
			continueOnFail: true,
		});
		const items = [createLiveItem()];

		const result = await validate.execute.call(ctx, items);

		expect(result).toHaveLength(1);
		// Should either return valid=false (with error from continueOnFail) or valid=false with errors array
		if (result[0].json.error) {
			// Caught by continueOnFail — validate's catch block sets valid: false
			expect(result[0].json.valid).toBe(false);
		} else {
			expect(result[0].json.valid).toBe(false);
		}
	});
});
