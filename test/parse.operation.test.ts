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
const mockParseAutoDetect = parseInvoiceAutoDetect as jest.MockedFunction<typeof parseInvoiceAutoDetect>;

describe('parse.operation', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should parse from base64 input', async () => {
		const apiResponse: InvoiceXhubApiResponse = {
			success: true,
			format: 'xrechnung',
			hash: 'sha256:abc',
			invoice: { invoiceNumber: 'INV-001' } as any,
		};
		mockParseInvoice.mockResolvedValue(apiResponse);

		const mockFn = createMockExecuteFunctions({
			nodeParameters: {
				countryCode: 'DE',
				format: 'xrechnung',
				inputType: 'base64',
				base64Data: 'PD94bWw+PC94bWw+',
				options: {},
			},
		});

		const result = await execute.call(mockFn, [createMockItem()]);

		expect(result).toHaveLength(1);
		expect(result[0].json.success).toBe(true);
		expect(result[0].json.invoice).toEqual({ invoiceNumber: 'INV-001' });
	});

	it('should parse from binary input', async () => {
		const apiResponse: InvoiceXhubApiResponse = {
			success: true,
			format: 'xrechnung',
			hash: 'sha256:abc',
			invoice: { invoiceNumber: 'INV-002' } as any,
		};
		mockParseInvoice.mockResolvedValue(apiResponse);

		const binaryData: IBinaryData = {
			data: Buffer.from('<xml/>').toString('base64'),
			mimeType: 'application/xml',
			fileName: 'invoice.xml',
		};

		const mockFn = createMockExecuteFunctions({
			nodeParameters: {
				countryCode: 'DE',
				format: 'xrechnung',
				inputType: 'binary',
				binaryPropertyName: 'data',
				options: {},
			},
		});

		const item = createMockItem({}, { data: binaryData });
		const result = await execute.call(mockFn, [item]);

		expect(result).toHaveLength(1);
		expect(result[0].json.success).toBe(true);
	});

	it('should use binary filename as fallback', async () => {
		mockParseInvoice.mockResolvedValue({
			success: true,
			format: 'xrechnung',
			invoice: {} as any,
		});

		const binaryData: IBinaryData = {
			data: Buffer.from('<xml/>').toString('base64'),
			mimeType: 'application/xml',
			fileName: 'my-invoice.xml',
		};

		const mockFn = createMockExecuteFunctions({
			nodeParameters: {
				countryCode: 'DE',
				format: 'xrechnung',
				inputType: 'binary',
				binaryPropertyName: 'data',
				options: {},
			},
		});

		const item = createMockItem({}, { data: binaryData });
		await execute.call(mockFn, [item]);

		// parseInvoice should have been called with the filename from binary data
		expect(mockParseInvoice).toHaveBeenCalled();
	});

	it('should throw when no binary data found', async () => {
		const mockFn = createMockExecuteFunctions({
			nodeParameters: {
				countryCode: 'DE',
				format: 'xrechnung',
				inputType: 'binary',
				binaryPropertyName: 'data',
				options: {},
			},
		});

		await expect(execute.call(mockFn, [createMockItem()])).rejects.toThrow(
			'No binary data found',
		);
	});

	it('should throw when base64 data is empty', async () => {
		const mockFn = createMockExecuteFunctions({
			nodeParameters: {
				countryCode: 'DE',
				format: 'xrechnung',
				inputType: 'base64',
				base64Data: '',
				options: {},
			},
		});

		await expect(execute.call(mockFn, [createMockItem()])).rejects.toThrow(
			'No document data provided',
		);
	});

	it('should throw on API failure', async () => {
		mockParseInvoice.mockResolvedValue({
			success: false,
			error: 'Parse failed',
		});

		const mockFn = createMockExecuteFunctions({
			nodeParameters: {
				countryCode: 'DE',
				format: 'xrechnung',
				inputType: 'base64',
				base64Data: 'PD94bWw+',
				options: {},
			},
		});

		await expect(execute.call(mockFn, [createMockItem()])).rejects.toThrow('Parse failed');
	});
});

describe('parseAutoDetect.operation', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should parse with auto-detection and return detection object', async () => {
		const apiResponse: InvoiceXhubApiResponse = {
			success: true,
			format: 'xrechnung',
			hash: 'sha256:abc',
			invoice: { invoiceNumber: 'INV-001' } as any,
			detection: {
				format: 'xrechnung',
				countryCode: 'DE',
				confidence: 0.95,
				formatMethod: 'xml-analysis',
				countrySource: 'vatId',
				isAmbiguous: false,
			},
		};
		mockParseAutoDetect.mockResolvedValue(apiResponse);

		const mockFn = createMockExecuteFunctions({
			nodeParameters: {
				inputType: 'base64',
				base64Data: 'PD94bWw+',
				options: {},
			},
		});

		const result = await executeAutoDetect.call(mockFn, [createMockItem()]);

		expect(result).toHaveLength(1);
		expect(result[0].json.success).toBe(true);
		expect(result[0].json.detectedFormat).toBe('xrechnung');
		expect(result[0].json.detectedCountry).toBe('DE');
		expect(result[0].json.confidence).toBe(0.95);
		expect(result[0].json.detection).toBeDefined();
	});

	it('should handle response without detection object', async () => {
		mockParseAutoDetect.mockResolvedValue({
			success: true,
			format: 'xrechnung',
			invoice: {} as any,
		});

		const mockFn = createMockExecuteFunctions({
			nodeParameters: {
				inputType: 'base64',
				base64Data: 'PD94bWw+',
				options: {},
			},
		});

		const result = await executeAutoDetect.call(mockFn, [createMockItem()]);

		expect(result).toHaveLength(1);
		expect(result[0].json.success).toBe(true);
		expect(result[0].json.detection).toBeUndefined();
	});

	it('should throw when no data provided', async () => {
		const mockFn = createMockExecuteFunctions({
			nodeParameters: {
				inputType: 'base64',
				base64Data: '',
				options: {},
			},
		});

		await expect(executeAutoDetect.call(mockFn, [createMockItem()])).rejects.toThrow(
			'No document data provided',
		);
	});

	it('should continue on fail when enabled', async () => {
		mockParseAutoDetect.mockResolvedValue({
			success: false,
			error: 'Detection failed',
		});

		const mockFn = createMockExecuteFunctions({
			nodeParameters: {
				inputType: 'base64',
				base64Data: 'PD94bWw+',
				options: {},
			},
			continueOnFail: true,
		});

		const result = await executeAutoDetect.call(mockFn, [createMockItem()]);

		expect(result).toHaveLength(1);
		expect(result[0].json.success).toBe(false);
		expect(result[0].json.error).toBeDefined();
	});
});
