import { execute } from '../nodes/InvoiceXhub/actions/validate.operation';
import { createMockExecuteFunctions, createMockItem } from './helpers/mockExecuteFunctions';
import type { InvoiceXhubApiResponse } from '../shared/GenericFunctions';

// Mock the GenericFunctions module
jest.mock('../shared/GenericFunctions', () => {
	const actual = jest.requireActual('../shared/GenericFunctions');
	return {
		...actual,
		validateInvoice: jest.fn(),
	};
});

import { validateInvoice } from '../shared/GenericFunctions';
const mockValidateInvoice = validateInvoice as jest.MockedFunction<typeof validateInvoice>;

describe('validate.operation', () => {
	const invoiceData = { invoiceNumber: 'INV-001', total: 100 };

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should validate a valid invoice', async () => {
		mockValidateInvoice.mockResolvedValue({
			success: true,
			valid: true,
			errors: [],
			warnings: [],
		});

		const mockFn = createMockExecuteFunctions({
			nodeParameters: {
				countryCode: 'DE',
				invoiceData,
				options: {},
			},
		});

		const result = await execute.call(mockFn, [createMockItem()]);

		expect(result).toHaveLength(1);
		expect(result[0].json.valid).toBe(true);
		expect(result[0].json.errorCount).toBe(0);
	});

	it('should use valid field fallback to errors count', async () => {
		// No explicit `valid` field — should infer from empty errors array
		mockValidateInvoice.mockResolvedValue({
			success: true,
			errors: [],
			warnings: [],
		});

		const mockFn = createMockExecuteFunctions({
			nodeParameters: {
				countryCode: 'DE',
				invoiceData,
				options: {},
			},
		});

		const result = await execute.call(mockFn, [createMockItem()]);

		expect(result[0].json.valid).toBe(true);
	});

	it('should use valid field fallback to success when no errors array', async () => {
		mockValidateInvoice.mockResolvedValue({
			success: true,
		});

		const mockFn = createMockExecuteFunctions({
			nodeParameters: {
				countryCode: 'DE',
				invoiceData,
				options: {},
			},
		});

		const result = await execute.call(mockFn, [createMockItem()]);

		expect(result[0].json.valid).toBe(true);
	});

	it('should detect invalid invoice with errors', async () => {
		mockValidateInvoice.mockResolvedValue({
			success: false,
			valid: false,
			errors: [
				{ code: 'E001', message: 'Invalid VAT ID', field: 'seller.vatId' },
			],
			warnings: [],
		});

		const mockFn = createMockExecuteFunctions({
			nodeParameters: {
				countryCode: 'DE',
				invoiceData,
				options: {},
			},
		});

		const result = await execute.call(mockFn, [createMockItem()]);

		expect(result[0].json.valid).toBe(false);
		expect(result[0].json.errorCount).toBe(1);
	});

	it('should throw when failOnErrors is true and errors exist', async () => {
		mockValidateInvoice.mockResolvedValue({
			success: false,
			errors: [{ code: 'E001', message: 'Invalid VAT ID' }],
			warnings: [],
		});

		const mockFn = createMockExecuteFunctions({
			nodeParameters: {
				countryCode: 'DE',
				invoiceData,
				options: { failOnErrors: true },
			},
		});

		await expect(execute.call(mockFn, [createMockItem()])).rejects.toThrow(
			'Validation failed with 1 error(s)',
		);
	});

	it('should throw when failOnWarnings is true and warnings exist', async () => {
		mockValidateInvoice.mockResolvedValue({
			success: true,
			valid: true,
			errors: [],
			warnings: [{ code: 'W001', message: 'Due date missing' }],
		});

		const mockFn = createMockExecuteFunctions({
			nodeParameters: {
				countryCode: 'DE',
				invoiceData,
				options: { failOnWarnings: true },
			},
		});

		await expect(execute.call(mockFn, [createMockItem()])).rejects.toThrow(
			'Validation has 1 warning(s)',
		);
	});

	it('should parse string invoiceData as JSON', async () => {
		mockValidateInvoice.mockResolvedValue({
			success: true,
			valid: true,
			errors: [],
			warnings: [],
		});

		const mockFn = createMockExecuteFunctions({
			nodeParameters: {
				countryCode: 'DE',
				invoiceData: JSON.stringify(invoiceData),
				options: {},
			},
		});

		const result = await execute.call(mockFn, [createMockItem()]);

		expect(result[0].json.valid).toBe(true);
	});

	it('should throw on invalid JSON invoiceData', async () => {
		const mockFn = createMockExecuteFunctions({
			nodeParameters: {
				countryCode: 'DE',
				invoiceData: '{bad json',
				options: {},
			},
		});

		await expect(execute.call(mockFn, [createMockItem()])).rejects.toThrow(
			'Invoice data must be valid JSON',
		);
	});

	it('should continue on fail when enabled', async () => {
		mockValidateInvoice.mockResolvedValue({
			success: false,
			errors: [{ code: 'E001', message: 'Invalid VAT ID' }],
			warnings: [],
		});

		const mockFn = createMockExecuteFunctions({
			nodeParameters: {
				countryCode: 'DE',
				invoiceData,
				options: { failOnErrors: true },
			},
			continueOnFail: true,
		});

		const result = await execute.call(mockFn, [createMockItem()]);

		expect(result).toHaveLength(1);
		expect(result[0].json.valid).toBe(false);
		expect(result[0].json.error).toBeDefined();
	});
});
