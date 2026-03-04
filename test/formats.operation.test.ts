import { execute } from '../nodes/InvoiceXhub/actions/formats.operation';
import { createMockExecuteFunctions, createMockItem } from './helpers/mockExecuteFunctions';
import type { InvoiceXhubApiResponse } from '../shared/GenericFunctions';

// Mock the GenericFunctions module
jest.mock('../shared/GenericFunctions', () => {
	const actual = jest.requireActual('../shared/GenericFunctions');
	return {
		...actual,
		getAllFormats: jest.fn(),
		getCountryFormats: jest.fn(),
	};
});

import { getAllFormats, getCountryFormats } from '../shared/GenericFunctions';
const mockGetAllFormats = getAllFormats as jest.MockedFunction<typeof getAllFormats>;
const mockGetCountryFormats = getCountryFormats as jest.MockedFunction<typeof getCountryFormats>;

describe('formats.operation', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('scope=all', () => {
		it('should return all countries and formats', async () => {
			const countries = [
				{ code: 'DE', name: 'Germany', formats: ['xrechnung', 'zugferd'] },
				{ code: 'AT', name: 'Austria', formats: ['ebinterface'] },
			];
			mockGetAllFormats.mockResolvedValue({
				success: true,
				countries: countries as any,
			});

			const mockFn = createMockExecuteFunctions({
				nodeParameters: { scope: 'all' },
			});

			const result = await execute.call(mockFn, [createMockItem()]);

			expect(result).toHaveLength(1);
			expect(result[0].json.countries).toEqual(countries);
			expect(result[0].json.totalCountries).toBe(2);
		});

		it('should throw when countries is missing', async () => {
			mockGetAllFormats.mockResolvedValue({
				success: false,
				error: 'Unauthorized',
			} as InvoiceXhubApiResponse);

			const mockFn = createMockExecuteFunctions({
				nodeParameters: { scope: 'all' },
			});

			await expect(execute.call(mockFn, [createMockItem()])).rejects.toThrow('Unauthorized');
		});
	});

	describe('scope=country', () => {
		it('should return formats for a specific country', async () => {
			const countryResponse: InvoiceXhubApiResponse = {
				success: true,
				countries: [
					{ code: 'DE', name: 'Germany', formats: ['xrechnung', 'zugferd'] } as any,
				],
			};
			mockGetCountryFormats.mockResolvedValue(countryResponse);

			const mockFn = createMockExecuteFunctions({
				nodeParameters: { scope: 'country', countryCode: 'DE' },
			});

			const result = await execute.call(mockFn, [createMockItem()]);

			expect(result).toHaveLength(1);
			expect(result[0].json.success).toBe(true);
		});

		it('should throw when API returns error for country (Phase 2a fix)', async () => {
			mockGetCountryFormats.mockResolvedValue({
				success: false,
				error: 'Country not supported',
			});

			const mockFn = createMockExecuteFunctions({
				nodeParameters: { scope: 'country', countryCode: 'XX' },
			});

			await expect(execute.call(mockFn, [createMockItem()])).rejects.toThrow(
				'Country not supported',
			);
		});
	});

	it('should continue on fail when enabled', async () => {
		mockGetAllFormats.mockResolvedValue({
			success: false,
			error: 'Server error',
		} as InvoiceXhubApiResponse);

		const mockFn = createMockExecuteFunctions({
			nodeParameters: { scope: 'all' },
			continueOnFail: true,
		});

		const result = await execute.call(mockFn, [createMockItem()]);

		expect(result).toHaveLength(1);
		expect(result[0].json.success).toBe(false);
		expect(result[0].json.error).toBeDefined();
	});
});
