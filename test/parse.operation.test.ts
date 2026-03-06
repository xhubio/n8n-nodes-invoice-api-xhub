import { execute } from '../nodes/InvoiceXhub/actions/parse.operation';
import { execute as executeAutoDetect } from '../nodes/InvoiceXhub/actions/parseAutoDetect.operation';
import { createMockExecuteFunctions, createMockItem } from './helpers/mockExecuteFunctions';
import type { InvoiceXhubApiResponse } from '../shared/GenericFunctions';
import type { IBinaryData } from 'n8n-workflow';

// Mock the GenericFunctions module
jest.mock('../shared/GenericFunctions', () => {
	const actual = jest.requireActual('../shared/GenericFunctions');
	return {
		...actual,
		parseInvoice: jest.fn(),
		parseInvoiceAutoDetect: jest.fn(),
	};
});

import { parseInvoice, parseInvoiceAutoDetect } from '../shared/GenericFunctions';
const mockParseInvoice = parseInvoice as jest.MockedFunction<typeof parseInvoice>;
const mockParseAutoDetect = parseInvoiceAutoDetect as jest.MockedFunction<
	typeof parseInvoiceAutoDetect
>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SAMPLE_BASE64 = Buffer.from('<?xml version="1.0"?><invoice/>').toString('base64');

function makeSuccessResponse(overrides?: Partial<InvoiceXhubApiResponse>): InvoiceXhubApiResponse {
	return {
		success: true,
		format: 'xrechnung',
		hash: 'sha256:abc123',
		invoice: {
			invoiceNumber: 'INV-001',
			currency: 'EUR',
			total: 1234.56,
		},
		...overrides,
	};
}

function makeBinaryData(overrides?: Partial<IBinaryData>): IBinaryData {
	return {
		data: Buffer.from('<xml/>').toString('base64'),
		mimeType: 'application/xml',
		fileName: 'invoice.xml',
		...overrides,
	};
}

// ═══════════════════════════════════════════════════════════════════════════════
// parse.operation
// ═══════════════════════════════════════════════════════════════════════════════

describe('parse.operation', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	// ─── Base64 Input ─────────────────────────────────────────────────────────

	describe('base64 input', () => {
		it('should parse from base64 and return invoice data', async () => {
			const apiResponse = makeSuccessResponse();
			mockParseInvoice.mockResolvedValue(apiResponse);

			const ctx = createMockExecuteFunctions({
				nodeParameters: {
					countryCode: 'DE',
					format: 'xrechnung',
					inputType: 'base64',
					base64Data: SAMPLE_BASE64,
					options: {},
				},
			});

			const result = await execute.call(ctx, [createMockItem()]);

			expect(result).toHaveLength(1);
			expect(result[0].json).toEqual({
				success: true,
				format: 'xrechnung',
				hash: 'sha256:abc123',
				invoice: { invoiceNumber: 'INV-001', currency: 'EUR', total: 1234.56 },
			});
			expect(result[0].pairedItem).toEqual({ item: 0 });
		});

		it('should pass filename from options to API', async () => {
			mockParseInvoice.mockResolvedValue(makeSuccessResponse());

			const ctx = createMockExecuteFunctions({
				nodeParameters: {
					countryCode: 'DE',
					format: 'xrechnung',
					inputType: 'base64',
					base64Data: SAMPLE_BASE64,
					options: { filename: 'custom-name.xml' },
				},
			});

			await execute.call(ctx, [createMockItem()]);

			expect(mockParseInvoice).toHaveBeenCalledTimes(1);
			// 4th arg = filename
			const callArgs = mockParseInvoice.mock.calls[0];
			expect(callArgs[3]).toBe('custom-name.xml');
		});

		it('should throw when base64Data is empty', async () => {
			const ctx = createMockExecuteFunctions({
				nodeParameters: {
					countryCode: 'DE',
					format: 'xrechnung',
					inputType: 'base64',
					base64Data: '',
					options: {},
				},
			});

			await expect(execute.call(ctx, [createMockItem()])).rejects.toThrow(
				'No document data provided',
			);
		});
	});

	// ─── Binary Input ─────────────────────────────────────────────────────────

	describe('binary input', () => {
		it('should parse from binary data', async () => {
			mockParseInvoice.mockResolvedValue(makeSuccessResponse());

			const ctx = createMockExecuteFunctions({
				nodeParameters: {
					countryCode: 'DE',
					format: 'xrechnung',
					inputType: 'binary',
					binaryPropertyName: 'data',
					options: {},
				},
			});

			const item = createMockItem({}, { data: makeBinaryData() });
			const result = await execute.call(ctx, [item]);

			expect(result).toHaveLength(1);
			expect(result[0].json.success).toBe(true);
		});

		it('should use binary fileName as fallback when no options.filename', async () => {
			mockParseInvoice.mockResolvedValue(makeSuccessResponse());

			const ctx = createMockExecuteFunctions({
				nodeParameters: {
					countryCode: 'DE',
					format: 'xrechnung',
					inputType: 'binary',
					binaryPropertyName: 'data',
					options: {},
				},
			});

			const item = createMockItem({}, { data: makeBinaryData({ fileName: 'from-binary.xml' }) });
			await execute.call(ctx, [item]);

			const callArgs = mockParseInvoice.mock.calls[0];
			expect(callArgs[3]).toBe('from-binary.xml');
		});

		it('should prefer options.filename over binary fileName', async () => {
			mockParseInvoice.mockResolvedValue(makeSuccessResponse());

			const ctx = createMockExecuteFunctions({
				nodeParameters: {
					countryCode: 'DE',
					format: 'xrechnung',
					inputType: 'binary',
					binaryPropertyName: 'data',
					options: { filename: 'from-options.xml' },
				},
			});

			const item = createMockItem({}, { data: makeBinaryData({ fileName: 'from-binary.xml' }) });
			await execute.call(ctx, [item]);

			const callArgs = mockParseInvoice.mock.calls[0];
			expect(callArgs[3]).toBe('from-options.xml');
		});

		it('should throw when binary property does not exist', async () => {
			const ctx = createMockExecuteFunctions({
				nodeParameters: {
					countryCode: 'DE',
					format: 'xrechnung',
					inputType: 'binary',
					binaryPropertyName: 'data',
					options: {},
				},
			});

			await expect(execute.call(ctx, [createMockItem()])).rejects.toThrow(
				'No binary data found in property "data"',
			);
		});

		it('should throw when binary property has wrong name', async () => {
			const ctx = createMockExecuteFunctions({
				nodeParameters: {
					countryCode: 'DE',
					format: 'xrechnung',
					inputType: 'binary',
					binaryPropertyName: 'attachment',
					options: {},
				},
			});

			const item = createMockItem({}, { data: makeBinaryData() });
			await expect(execute.call(ctx, [item])).rejects.toThrow(
				'No binary data found in property "attachment"',
			);
		});

		it('should read from custom binary property name', async () => {
			mockParseInvoice.mockResolvedValue(makeSuccessResponse());

			const ctx = createMockExecuteFunctions({
				nodeParameters: {
					countryCode: 'DE',
					format: 'xrechnung',
					inputType: 'binary',
					binaryPropertyName: 'invoice_file',
					options: {},
				},
			});

			const item = createMockItem({}, { invoice_file: makeBinaryData() });
			const result = await execute.call(ctx, [item]);

			expect(result).toHaveLength(1);
			expect(result[0].json.success).toBe(true);
		});
	});

	// ─── Warnings ─────────────────────────────────────────────────────────────

	describe('warnings', () => {
		const warningResponse = makeSuccessResponse({
			warnings: [
				{ code: 'W001', message: 'Missing optional field' },
				{ code: 'W002', message: 'Deprecated format version' },
			],
		});

		it('should include warnings by default (includeWarnings=true)', async () => {
			mockParseInvoice.mockResolvedValue(warningResponse);

			const ctx = createMockExecuteFunctions({
				nodeParameters: {
					countryCode: 'DE',
					format: 'xrechnung',
					inputType: 'base64',
					base64Data: SAMPLE_BASE64,
					options: { includeWarnings: true },
				},
			});

			const result = await execute.call(ctx, [createMockItem()]);

			expect(result[0].json.warnings).toHaveLength(2);
			expect(result[0].json.warnings).toEqual(warningResponse.warnings);
		});

		it('should include warnings when option is omitted (default)', async () => {
			mockParseInvoice.mockResolvedValue(warningResponse);

			const ctx = createMockExecuteFunctions({
				nodeParameters: {
					countryCode: 'DE',
					format: 'xrechnung',
					inputType: 'base64',
					base64Data: SAMPLE_BASE64,
					options: {},
				},
			});

			const result = await execute.call(ctx, [createMockItem()]);

			expect(result[0].json.warnings).toHaveLength(2);
		});

		it('should exclude warnings when includeWarnings=false', async () => {
			mockParseInvoice.mockResolvedValue(warningResponse);

			const ctx = createMockExecuteFunctions({
				nodeParameters: {
					countryCode: 'DE',
					format: 'xrechnung',
					inputType: 'base64',
					base64Data: SAMPLE_BASE64,
					options: { includeWarnings: false },
				},
			});

			const result = await execute.call(ctx, [createMockItem()]);

			expect(result[0].json.warnings).toBeUndefined();
		});

		it('should not add warnings key when response has no warnings', async () => {
			mockParseInvoice.mockResolvedValue(makeSuccessResponse());

			const ctx = createMockExecuteFunctions({
				nodeParameters: {
					countryCode: 'DE',
					format: 'xrechnung',
					inputType: 'base64',
					base64Data: SAMPLE_BASE64,
					options: {},
				},
			});

			const result = await execute.call(ctx, [createMockItem()]);

			expect(result[0].json.warnings).toBeUndefined();
		});

		it('should not add warnings key when warnings array is empty', async () => {
			mockParseInvoice.mockResolvedValue(makeSuccessResponse({ warnings: [] }));

			const ctx = createMockExecuteFunctions({
				nodeParameters: {
					countryCode: 'DE',
					format: 'xrechnung',
					inputType: 'base64',
					base64Data: SAMPLE_BASE64,
					options: {},
				},
			});

			const result = await execute.call(ctx, [createMockItem()]);

			expect(result[0].json.warnings).toBeUndefined();
		});
	});

	// ─── API Failure ──────────────────────────────────────────────────────────

	describe('API failure', () => {
		it('should throw with error message from API', async () => {
			mockParseInvoice.mockResolvedValue({
				success: false,
				error: 'PARSE_ERROR',
				message: 'Could not parse document',
			});

			const ctx = createMockExecuteFunctions({
				nodeParameters: {
					countryCode: 'DE',
					format: 'xrechnung',
					inputType: 'base64',
					base64Data: SAMPLE_BASE64,
					options: {},
				},
			});

			await expect(execute.call(ctx, [createMockItem()])).rejects.toThrow('PARSE_ERROR');
		});

		it('should include detailed errors array in message', async () => {
			mockParseInvoice.mockResolvedValue({
				success: false,
				errors: [
					{ code: 'E001', message: 'Invalid XML structure' },
					{ code: 'E002', message: 'Missing root element', field: 'invoice' },
				],
			});

			const ctx = createMockExecuteFunctions({
				nodeParameters: {
					countryCode: 'DE',
					format: 'xrechnung',
					inputType: 'base64',
					base64Data: SAMPLE_BASE64,
					options: {},
				},
			});

			await expect(execute.call(ctx, [createMockItem()])).rejects.toThrow(
				/Invalid XML structure/,
			);
		});
	});

	// ─── continueOnFail ───────────────────────────────────────────────────────

	describe('continueOnFail', () => {
		it('should return error item on API failure', async () => {
			mockParseInvoice.mockResolvedValue({
				success: false,
				error: 'PARSE_ERROR',
			});

			const ctx = createMockExecuteFunctions({
				nodeParameters: {
					countryCode: 'DE',
					format: 'xrechnung',
					inputType: 'base64',
					base64Data: SAMPLE_BASE64,
					options: {},
				},
				continueOnFail: true,
			});

			const result = await execute.call(ctx, [createMockItem()]);

			expect(result).toHaveLength(1);
			expect(result[0].json.success).toBe(false);
			expect(result[0].json.error).toContain('PARSE_ERROR');
			expect(result[0].pairedItem).toEqual({ item: 0 });
		});

		it('should return error item on missing binary data', async () => {
			const ctx = createMockExecuteFunctions({
				nodeParameters: {
					countryCode: 'DE',
					format: 'xrechnung',
					inputType: 'binary',
					binaryPropertyName: 'data',
					options: {},
				},
				continueOnFail: true,
			});

			const result = await execute.call(ctx, [createMockItem()]);

			expect(result).toHaveLength(1);
			expect(result[0].json.success).toBe(false);
			expect(result[0].json.error).toContain('No binary data found');
		});

		it('should return error item on empty base64', async () => {
			const ctx = createMockExecuteFunctions({
				nodeParameters: {
					countryCode: 'DE',
					format: 'xrechnung',
					inputType: 'base64',
					base64Data: '',
					options: {},
				},
				continueOnFail: true,
			});

			const result = await execute.call(ctx, [createMockItem()]);

			expect(result).toHaveLength(1);
			expect(result[0].json.success).toBe(false);
			expect(result[0].json.error).toContain('No document data provided');
		});

		it('should include errorDescription when error has description', async () => {
			const errorWithDescription = Object.assign(new Error('API Error'), {
				description: 'Missing entitlement: e-invoice:de:xrechnung:parse',
			});
			mockParseInvoice.mockRejectedValue(errorWithDescription);

			const ctx = createMockExecuteFunctions({
				nodeParameters: {
					countryCode: 'DE',
					format: 'xrechnung',
					inputType: 'base64',
					base64Data: SAMPLE_BASE64,
					options: {},
				},
				continueOnFail: true,
			});

			const result = await execute.call(ctx, [createMockItem()]);

			expect(result).toHaveLength(1);
			expect(result[0].json.success).toBe(false);
			expect(result[0].json.error).toBe('API Error');
			expect(result[0].json.errorDescription).toBe(
				'Missing entitlement: e-invoice:de:xrechnung:parse',
			);
		});

		it('should not include errorDescription when error has no description', async () => {
			mockParseInvoice.mockResolvedValue({
				success: false,
				error: 'PARSE_ERROR',
			});

			const ctx = createMockExecuteFunctions({
				nodeParameters: {
					countryCode: 'DE',
					format: 'xrechnung',
					inputType: 'base64',
					base64Data: SAMPLE_BASE64,
					options: {},
				},
				continueOnFail: true,
			});

			const result = await execute.call(ctx, [createMockItem()]);

			expect(result[0].json.errorDescription).toBeUndefined();
		});

		it('should handle non-Error throws gracefully', async () => {
			mockParseInvoice.mockRejectedValue('string error');

			const ctx = createMockExecuteFunctions({
				nodeParameters: {
					countryCode: 'DE',
					format: 'xrechnung',
					inputType: 'base64',
					base64Data: SAMPLE_BASE64,
					options: {},
				},
				continueOnFail: true,
			});

			const result = await execute.call(ctx, [createMockItem()]);

			expect(result).toHaveLength(1);
			expect(result[0].json.success).toBe(false);
			expect(result[0].json.error).toBe('Unknown error');
		});
	});

	// ─── Multiple Items ───────────────────────────────────────────────────────

	describe('multiple items', () => {
		it('should process multiple items independently', async () => {
			mockParseInvoice
				.mockResolvedValueOnce(makeSuccessResponse({ invoice: { invoiceNumber: 'INV-001' } }))
				.mockResolvedValueOnce(
					makeSuccessResponse({
						format: 'zugferd',
						invoice: { invoiceNumber: 'INV-002' },
					}),
				);

			const ctx = createMockExecuteFunctions({
				nodeParameters: {
					countryCode: 'DE',
					format: 'xrechnung',
					inputType: 'base64',
					base64Data: SAMPLE_BASE64,
					options: {},
				},
			});

			const result = await execute.call(ctx, [createMockItem(), createMockItem()]);

			expect(result).toHaveLength(2);
			expect((result[0].json.invoice as Record<string, unknown>).invoiceNumber).toBe('INV-001');
			expect((result[1].json.invoice as Record<string, unknown>).invoiceNumber).toBe('INV-002');
			expect(result[0].pairedItem).toEqual({ item: 0 });
			expect(result[1].pairedItem).toEqual({ item: 1 });
		});

		it('should continue processing after error with continueOnFail', async () => {
			mockParseInvoice
				.mockResolvedValueOnce({ success: false, error: 'FAILED' })
				.mockResolvedValueOnce(makeSuccessResponse({ invoice: { invoiceNumber: 'INV-002' } }));

			const ctx = createMockExecuteFunctions({
				nodeParameters: {
					countryCode: 'DE',
					format: 'xrechnung',
					inputType: 'base64',
					base64Data: SAMPLE_BASE64,
					options: {},
				},
				continueOnFail: true,
			});

			const result = await execute.call(ctx, [createMockItem(), createMockItem()]);

			expect(result).toHaveLength(2);
			expect(result[0].json.success).toBe(false);
			expect(result[0].json.error).toContain('FAILED');
			expect(result[1].json.success).toBe(true);
			expect((result[1].json.invoice as Record<string, unknown>).invoiceNumber).toBe('INV-002');
		});

		it('should stop on first error without continueOnFail', async () => {
			mockParseInvoice
				.mockResolvedValueOnce({ success: false, error: 'FAILED' })
				.mockResolvedValueOnce(makeSuccessResponse());

			const ctx = createMockExecuteFunctions({
				nodeParameters: {
					countryCode: 'DE',
					format: 'xrechnung',
					inputType: 'base64',
					base64Data: SAMPLE_BASE64,
					options: {},
				},
			});

			await expect(execute.call(ctx, [createMockItem(), createMockItem()])).rejects.toThrow(
				'FAILED',
			);
			// Second item should never have been called
			expect(mockParseInvoice).toHaveBeenCalledTimes(1);
		});
	});

	// ─── Country / Format Routing ─────────────────────────────────────────────

	describe('country and format routing', () => {
		it('should pass country and format to API', async () => {
			mockParseInvoice.mockResolvedValue(makeSuccessResponse());

			const ctx = createMockExecuteFunctions({
				nodeParameters: {
					countryCode: 'IT',
					format: 'fatturapa',
					inputType: 'base64',
					base64Data: SAMPLE_BASE64,
					options: {},
				},
			});

			await execute.call(ctx, [createMockItem()]);

			const callArgs = mockParseInvoice.mock.calls[0];
			expect(callArgs[0]).toBe('IT');
			expect(callArgs[1]).toBe('fatturapa');
		});

		it('should pass base64 data to API', async () => {
			mockParseInvoice.mockResolvedValue(makeSuccessResponse());

			const ctx = createMockExecuteFunctions({
				nodeParameters: {
					countryCode: 'DE',
					format: 'xrechnung',
					inputType: 'base64',
					base64Data: SAMPLE_BASE64,
					options: {},
				},
			});

			await execute.call(ctx, [createMockItem()]);

			const callArgs = mockParseInvoice.mock.calls[0];
			expect(callArgs[2]).toBe(SAMPLE_BASE64);
		});
	});
});

// ═══════════════════════════════════════════════════════════════════════════════
// parseAutoDetect.operation
// ═══════════════════════════════════════════════════════════════════════════════

describe('parseAutoDetect.operation', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	// ─── Base64 Input ─────────────────────────────────────────────────────────

	describe('base64 input', () => {
		it('should parse and return detection fields', async () => {
			const apiResponse = makeSuccessResponse({
				detection: {
					format: 'XRECHNUNG_UBL',
					countryCode: 'DE',
					confidence: 0.95,
					formatMethod: 'xml-analysis',
					countrySource: 'vatId',
					isAmbiguous: false,
				},
			});
			mockParseAutoDetect.mockResolvedValue(apiResponse);

			const ctx = createMockExecuteFunctions({
				nodeParameters: {
					inputType: 'base64',
					base64Data: SAMPLE_BASE64,
					options: {},
				},
			});

			const result = await executeAutoDetect.call(ctx, [createMockItem()]);

			expect(result).toHaveLength(1);
			expect(result[0].json.success).toBe(true);
			expect(result[0].json.detectedFormat).toBe('XRECHNUNG_UBL');
			expect(result[0].json.detectedCountry).toBe('DE');
			expect(result[0].json.confidence).toBe(0.95);
			expect(result[0].json.detection).toBeDefined();
			expect(result[0].json.invoice).toBeDefined();
			expect(result[0].pairedItem).toEqual({ item: 0 });
		});

		it('should pass filename from options to API', async () => {
			mockParseAutoDetect.mockResolvedValue(makeSuccessResponse());

			const ctx = createMockExecuteFunctions({
				nodeParameters: {
					inputType: 'base64',
					base64Data: SAMPLE_BASE64,
					options: { filename: 'test.xml' },
				},
			});

			await executeAutoDetect.call(ctx, [createMockItem()]);

			const callArgs = mockParseAutoDetect.mock.calls[0];
			expect(callArgs[1]).toBe('test.xml');
		});

		it('should throw when base64Data is empty', async () => {
			const ctx = createMockExecuteFunctions({
				nodeParameters: {
					inputType: 'base64',
					base64Data: '',
					options: {},
				},
			});

			await expect(executeAutoDetect.call(ctx, [createMockItem()])).rejects.toThrow(
				'No document data provided',
			);
		});
	});

	// ─── Binary Input ─────────────────────────────────────────────────────────

	describe('binary input', () => {
		it('should parse from binary data', async () => {
			mockParseAutoDetect.mockResolvedValue(makeSuccessResponse());

			const ctx = createMockExecuteFunctions({
				nodeParameters: {
					inputType: 'binary',
					binaryPropertyName: 'data',
					options: {},
				},
			});

			const item = createMockItem({}, { data: makeBinaryData() });
			const result = await executeAutoDetect.call(ctx, [item]);

			expect(result).toHaveLength(1);
			expect(result[0].json.success).toBe(true);
		});

		it('should use binary fileName as fallback', async () => {
			mockParseAutoDetect.mockResolvedValue(makeSuccessResponse());

			const ctx = createMockExecuteFunctions({
				nodeParameters: {
					inputType: 'binary',
					binaryPropertyName: 'data',
					options: {},
				},
			});

			const item = createMockItem(
				{},
				{ data: makeBinaryData({ fileName: 'detected-name.pdf' }) },
			);
			await executeAutoDetect.call(ctx, [item]);

			const callArgs = mockParseAutoDetect.mock.calls[0];
			expect(callArgs[1]).toBe('detected-name.pdf');
		});

		it('should prefer options.filename over binary fileName', async () => {
			mockParseAutoDetect.mockResolvedValue(makeSuccessResponse());

			const ctx = createMockExecuteFunctions({
				nodeParameters: {
					inputType: 'binary',
					binaryPropertyName: 'data',
					options: { filename: 'override.xml' },
				},
			});

			const item = createMockItem({}, { data: makeBinaryData({ fileName: 'original.xml' }) });
			await executeAutoDetect.call(ctx, [item]);

			const callArgs = mockParseAutoDetect.mock.calls[0];
			expect(callArgs[1]).toBe('override.xml');
		});

		it('should throw when binary property does not exist', async () => {
			const ctx = createMockExecuteFunctions({
				nodeParameters: {
					inputType: 'binary',
					binaryPropertyName: 'data',
					options: {},
				},
			});

			await expect(executeAutoDetect.call(ctx, [createMockItem()])).rejects.toThrow(
				'No binary data found in property "data"',
			);
		});
	});

	// ─── Detection Object ─────────────────────────────────────────────────────

	describe('detection object', () => {
		it('should handle response without detection object', async () => {
			mockParseAutoDetect.mockResolvedValue(makeSuccessResponse());

			const ctx = createMockExecuteFunctions({
				nodeParameters: {
					inputType: 'base64',
					base64Data: SAMPLE_BASE64,
					options: {},
				},
			});

			const result = await executeAutoDetect.call(ctx, [createMockItem()]);

			expect(result[0].json.detection).toBeUndefined();
			expect(result[0].json.detectedFormat).toBeUndefined();
			expect(result[0].json.detectedCountry).toBeUndefined();
			expect(result[0].json.confidence).toBeUndefined();
		});

		it('should expose ambiguous detection with alternative countries', async () => {
			mockParseAutoDetect.mockResolvedValue(
				makeSuccessResponse({
					detection: {
						format: 'CII',
						countryCode: 'DE',
						confidence: 0.6,
						formatMethod: 'xml-analysis',
						countrySource: 'heuristic',
						isAmbiguous: true,
						alternativeCountries: ['AT', 'CH'],
					},
				}),
			);

			const ctx = createMockExecuteFunctions({
				nodeParameters: {
					inputType: 'base64',
					base64Data: SAMPLE_BASE64,
					options: {},
				},
			});

			const result = await executeAutoDetect.call(ctx, [createMockItem()]);

			const detection = result[0].json.detection as Record<string, unknown>;
			expect(detection.isAmbiguous).toBe(true);
			expect(detection.alternativeCountries).toEqual(['AT', 'CH']);
			expect(result[0].json.confidence).toBe(0.6);
		});
	});

	// ─── Warnings ─────────────────────────────────────────────────────────────

	describe('warnings', () => {
		const warningResponse = makeSuccessResponse({
			warnings: [{ code: 'W001', message: 'Deprecated format' }],
		});

		it('should include warnings by default', async () => {
			mockParseAutoDetect.mockResolvedValue(warningResponse);

			const ctx = createMockExecuteFunctions({
				nodeParameters: {
					inputType: 'base64',
					base64Data: SAMPLE_BASE64,
					options: {},
				},
			});

			const result = await executeAutoDetect.call(ctx, [createMockItem()]);
			expect(result[0].json.warnings).toHaveLength(1);
		});

		it('should exclude warnings when includeWarnings=false', async () => {
			mockParseAutoDetect.mockResolvedValue(warningResponse);

			const ctx = createMockExecuteFunctions({
				nodeParameters: {
					inputType: 'base64',
					base64Data: SAMPLE_BASE64,
					options: { includeWarnings: false },
				},
			});

			const result = await executeAutoDetect.call(ctx, [createMockItem()]);
			expect(result[0].json.warnings).toBeUndefined();
		});

		it('should not add warnings key when response has none', async () => {
			mockParseAutoDetect.mockResolvedValue(makeSuccessResponse());

			const ctx = createMockExecuteFunctions({
				nodeParameters: {
					inputType: 'base64',
					base64Data: SAMPLE_BASE64,
					options: {},
				},
			});

			const result = await executeAutoDetect.call(ctx, [createMockItem()]);
			expect(result[0].json.warnings).toBeUndefined();
		});
	});

	// ─── API Failure ──────────────────────────────────────────────────────────

	describe('API failure', () => {
		it('should throw with error message from API', async () => {
			mockParseAutoDetect.mockResolvedValue({
				success: false,
				error: 'DETECTION_FAILED',
				message: 'Could not detect format',
			});

			const ctx = createMockExecuteFunctions({
				nodeParameters: {
					inputType: 'base64',
					base64Data: SAMPLE_BASE64,
					options: {},
				},
			});

			await expect(executeAutoDetect.call(ctx, [createMockItem()])).rejects.toThrow(
				'DETECTION_FAILED',
			);
		});
	});

	// ─── continueOnFail ───────────────────────────────────────────────────────

	describe('continueOnFail', () => {
		it('should return error item on API failure', async () => {
			mockParseAutoDetect.mockResolvedValue({
				success: false,
				error: 'Detection failed',
			});

			const ctx = createMockExecuteFunctions({
				nodeParameters: {
					inputType: 'base64',
					base64Data: SAMPLE_BASE64,
					options: {},
				},
				continueOnFail: true,
			});

			const result = await executeAutoDetect.call(ctx, [createMockItem()]);

			expect(result).toHaveLength(1);
			expect(result[0].json.success).toBe(false);
			expect(result[0].json.error).toBeDefined();
		});

		it('should return error item on missing binary data', async () => {
			const ctx = createMockExecuteFunctions({
				nodeParameters: {
					inputType: 'binary',
					binaryPropertyName: 'data',
					options: {},
				},
				continueOnFail: true,
			});

			const result = await executeAutoDetect.call(ctx, [createMockItem()]);

			expect(result).toHaveLength(1);
			expect(result[0].json.success).toBe(false);
			expect(result[0].json.error).toContain('No binary data found');
		});

		it('should return error item on empty base64', async () => {
			const ctx = createMockExecuteFunctions({
				nodeParameters: {
					inputType: 'base64',
					base64Data: '',
					options: {},
				},
				continueOnFail: true,
			});

			const result = await executeAutoDetect.call(ctx, [createMockItem()]);

			expect(result).toHaveLength(1);
			expect(result[0].json.success).toBe(false);
			expect(result[0].json.error).toContain('No document data provided');
		});

		it('should include errorDescription when available', async () => {
			const errorWithDescription = Object.assign(new Error('Forbidden'), {
				description: 'Missing entitlement: e-invoice:parse',
			});
			mockParseAutoDetect.mockRejectedValue(errorWithDescription);

			const ctx = createMockExecuteFunctions({
				nodeParameters: {
					inputType: 'base64',
					base64Data: SAMPLE_BASE64,
					options: {},
				},
				continueOnFail: true,
			});

			const result = await executeAutoDetect.call(ctx, [createMockItem()]);

			expect(result[0].json.error).toBe('Forbidden');
			expect(result[0].json.errorDescription).toBe('Missing entitlement: e-invoice:parse');
		});

		it('should handle non-Error throws gracefully', async () => {
			mockParseAutoDetect.mockRejectedValue(42);

			const ctx = createMockExecuteFunctions({
				nodeParameters: {
					inputType: 'base64',
					base64Data: SAMPLE_BASE64,
					options: {},
				},
				continueOnFail: true,
			});

			const result = await executeAutoDetect.call(ctx, [createMockItem()]);

			expect(result[0].json.error).toBe('Unknown error');
		});
	});

	// ─── Multiple Items ───────────────────────────────────────────────────────

	describe('multiple items', () => {
		it('should process multiple items independently', async () => {
			mockParseAutoDetect
				.mockResolvedValueOnce(
					makeSuccessResponse({
						invoice: { invoiceNumber: 'INV-001' },
						detection: {
							format: 'XRECHNUNG_UBL',
							countryCode: 'DE',
							confidence: 0.95,
							formatMethod: 'xml-analysis',
							countrySource: 'vatId',
							isAmbiguous: false,
						},
					}),
				)
				.mockResolvedValueOnce(
					makeSuccessResponse({
						invoice: { invoiceNumber: 'INV-002' },
						detection: {
							format: 'CII',
							countryCode: 'FR',
							confidence: 0.8,
							formatMethod: 'xml-analysis',
							countrySource: 'heuristic',
							isAmbiguous: false,
						},
					}),
				);

			const ctx = createMockExecuteFunctions({
				nodeParameters: {
					inputType: 'base64',
					base64Data: SAMPLE_BASE64,
					options: {},
				},
			});

			const result = await executeAutoDetect.call(ctx, [createMockItem(), createMockItem()]);

			expect(result).toHaveLength(2);
			expect(result[0].json.detectedCountry).toBe('DE');
			expect(result[1].json.detectedCountry).toBe('FR');
			expect(result[0].pairedItem).toEqual({ item: 0 });
			expect(result[1].pairedItem).toEqual({ item: 1 });
		});

		it('should continue after error with continueOnFail', async () => {
			mockParseAutoDetect
				.mockRejectedValueOnce(new Error('Timeout'))
				.mockResolvedValueOnce(makeSuccessResponse({ invoice: { invoiceNumber: 'INV-002' } }));

			const ctx = createMockExecuteFunctions({
				nodeParameters: {
					inputType: 'base64',
					base64Data: SAMPLE_BASE64,
					options: {},
				},
				continueOnFail: true,
			});

			const result = await executeAutoDetect.call(ctx, [createMockItem(), createMockItem()]);

			expect(result).toHaveLength(2);
			expect(result[0].json.success).toBe(false);
			expect(result[0].json.error).toBe('Timeout');
			expect(result[1].json.success).toBe(true);
		});

		it('should stop on first error without continueOnFail', async () => {
			mockParseAutoDetect
				.mockResolvedValueOnce({ success: false, error: 'FAILED' })
				.mockResolvedValueOnce(makeSuccessResponse());

			const ctx = createMockExecuteFunctions({
				nodeParameters: {
					inputType: 'base64',
					base64Data: SAMPLE_BASE64,
					options: {},
				},
			});

			await expect(
				executeAutoDetect.call(ctx, [createMockItem(), createMockItem()]),
			).rejects.toThrow('FAILED');
			expect(mockParseAutoDetect).toHaveBeenCalledTimes(1);
		});
	});
});
