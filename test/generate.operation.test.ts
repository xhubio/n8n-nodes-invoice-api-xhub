import { execute } from '../nodes/InvoiceXhub/actions/generate.operation';
import { createMockExecuteFunctions, createMockItem } from './helpers/mockExecuteFunctions';
import type { InvoiceXhubApiResponse } from '../shared/GenericFunctions';

// Mock the GenericFunctions module
jest.mock('../shared/GenericFunctions', () => {
	const actual = jest.requireActual('../shared/GenericFunctions');
	return {
		...actual,
		generateInvoice: jest.fn(),
	};
});

import { generateInvoice } from '../shared/GenericFunctions';
const mockGenerateInvoice = generateInvoice as jest.MockedFunction<typeof generateInvoice>;

describe('generate.operation', () => {
	const invoiceData = { invoiceNumber: 'INV-001', total: 100 };

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should generate invoice with binary output', async () => {
		const apiResponse: InvoiceXhubApiResponse = {
			success: true,
			format: 'xrechnung',
			filename: 'invoice.xml',
			mimeType: 'application/xml',
			hash: 'sha256:abc',
			data: Buffer.from('<xml>invoice</xml>').toString('base64'),
		};
		mockGenerateInvoice.mockResolvedValue(apiResponse);

		const mockFn = createMockExecuteFunctions({
			nodeParameters: {
				countryCode: 'DE',
				format: 'xrechnung',
				invoiceData,
				options: { outputBinary: true, binaryPropertyName: 'data' },
			},
		});

		const result = await execute.call(mockFn, [createMockItem()]);

		expect(result).toHaveLength(1);
		expect(result[0].json.success).toBe(true);
		expect(result[0].json.format).toBe('xrechnung');
		expect(result[0].binary).toBeDefined();
		expect(result[0].binary!.data).toBeDefined();
	});

	it('should generate invoice with JSON output when binary disabled', async () => {
		const base64Data = Buffer.from('<xml>invoice</xml>').toString('base64');
		const apiResponse: InvoiceXhubApiResponse = {
			success: true,
			format: 'xrechnung',
			filename: 'invoice.xml',
			mimeType: 'application/xml',
			hash: 'sha256:abc',
			data: base64Data,
		};
		mockGenerateInvoice.mockResolvedValue(apiResponse);

		const mockFn = createMockExecuteFunctions({
			nodeParameters: {
				countryCode: 'DE',
				format: 'xrechnung',
				invoiceData,
				options: { outputBinary: false },
			},
		});

		const result = await execute.call(mockFn, [createMockItem()]);

		expect(result).toHaveLength(1);
		expect(result[0].json.data).toBe(base64Data);
		expect(result[0].binary).toBeUndefined();
	});

	it('should parse string invoiceData as JSON', async () => {
		mockGenerateInvoice.mockResolvedValue({
			success: true,
			format: 'xrechnung',
			filename: 'invoice.xml',
		});

		const mockFn = createMockExecuteFunctions({
			nodeParameters: {
				countryCode: 'DE',
				format: 'xrechnung',
				invoiceData: JSON.stringify(invoiceData),
				options: { outputBinary: false },
			},
		});

		const result = await execute.call(mockFn, [createMockItem()]);

		expect(result).toHaveLength(1);
		expect(result[0].json.success).toBe(true);
	});

	it('should throw on invalid JSON invoiceData', async () => {
		const mockFn = createMockExecuteFunctions({
			nodeParameters: {
				countryCode: 'DE',
				format: 'xrechnung',
				invoiceData: '{invalid json',
				options: {},
			},
		});

		await expect(execute.call(mockFn, [createMockItem()])).rejects.toThrow(
			'Invoice data must be valid JSON',
		);
	});

	it('should throw on API failure', async () => {
		mockGenerateInvoice.mockResolvedValue({
			success: false,
			error: 'Generation failed',
		});

		const mockFn = createMockExecuteFunctions({
			nodeParameters: {
				countryCode: 'DE',
				format: 'xrechnung',
				invoiceData,
				options: {},
			},
		});

		await expect(execute.call(mockFn, [createMockItem()])).rejects.toThrow('Generation failed');
	});

	it('should continue on fail when enabled', async () => {
		mockGenerateInvoice.mockResolvedValue({
			success: false,
			error: 'Generation failed',
		});

		const mockFn = createMockExecuteFunctions({
			nodeParameters: {
				countryCode: 'DE',
				format: 'xrechnung',
				invoiceData,
				options: {},
			},
			continueOnFail: true,
		});

		const result = await execute.call(mockFn, [createMockItem()]);

		expect(result).toHaveLength(1);
		expect(result[0].json.success).toBe(false);
		expect(result[0].json.error).toBeDefined();
	});
});
