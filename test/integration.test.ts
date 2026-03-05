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

jest.setTimeout(30_000);

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

// ─── PARSE (requires parse entitlement — tests error handling if missing) ─────

describe('Parse Invoice (no parse entitlement)', () => {
	it('should propagate 403 as error item via continueOnFail', async () => {
		const xrechnungBase64 = await requireFixture('de-xrechnung', 'xrechnung');

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

		const result = await parse.execute.call(ctx, [createLiveItem()]);

		expect(result).toHaveLength(1);
		expect(result[0].json.success).toBe(false);
		expect(result[0].json.error).toContain('Missing entitlement');
	});

	it('should throw NodeApiError without continueOnFail', async () => {
		const xrechnungBase64 = await requireFixture('de-xrechnung', 'xrechnung');

		const ctx = createLiveExecuteFunctions({
			nodeParameters: {
				countryCode: 'DE',
				format: 'xrechnung',
				inputType: 'base64',
				base64Data: xrechnungBase64,
				options: { filename: 'invoice.xml' },
			},
			continueOnFail: false,
		});

		await expect(parse.execute.call(ctx, [createLiveItem()])).rejects.toThrow();
	});
});

describe('Parse Auto-Detect (no parse entitlement)', () => {
	it('should propagate 403 as error item via continueOnFail', async () => {
		const base64 = await requireFixture('de-xrechnung', 'xrechnung');

		const ctx = createLiveExecuteFunctions({
			nodeParameters: {
				inputType: 'base64',
				base64Data: base64,
				options: { filename: 'invoice.xml' },
			},
			continueOnFail: true,
		});

		const result = await parseAutoDetect.execute.call(ctx, [createLiveItem()]);

		expect(result).toHaveLength(1);
		expect(result[0].json.success).toBe(false);
		expect(result[0].json.error).toContain('Missing entitlement');
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
