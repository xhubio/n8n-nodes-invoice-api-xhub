import type { ILoadOptionsFunctions } from 'n8n-workflow';

import { listSearch } from '../nodes/InvoiceXhub/methods/loadOptions';
import { COUNTRY_OPTIONS, FORMAT_OPTIONS } from '../shared/constants';

jest.mock('../shared/GenericFunctions', () => {
	const actual = jest.requireActual('../shared/GenericFunctions');
	return {
		...actual,
		getAllFormats: jest.fn(),
	};
});

import { getAllFormats } from '../shared/GenericFunctions';
const mockGetAllFormats = getAllFormats as jest.MockedFunction<typeof getAllFormats>;

const mockCtx = {} as ILoadOptionsFunctions;

const apiFixture = {
	success: true,
	countries: [
		{
			code: 'de',
			name: 'Germany',
			formats: [
				{ id: 'pdf', name: 'PDF', mimeType: 'application/pdf' },
				{ id: 'xrechnung', name: 'XRechnung', mimeType: 'application/xml' },
				{ id: 'zugferd', name: 'ZUGFeRD', mimeType: 'application/pdf' },
			],
		},
		{
			code: 'at',
			name: 'Austria',
			formats: [
				{ id: 'pdf', name: 'PDF', mimeType: 'application/pdf' },
				{ id: 'ebinterface', name: 'ebInterface', mimeType: 'application/xml' },
			],
		},
	],
};

describe('listSearch (API-backed)', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockGetAllFormats.mockResolvedValue(apiFixture as any);
	});

	describe('searchCountries', () => {
		it('returns countries from API response', async () => {
			const result = await listSearch.searchCountries.call(mockCtx, undefined);
			expect(result.results).toHaveLength(2);
			expect(result.results.map((r) => r.value)).toEqual(['DE', 'AT']);
			expect(result.results[0].name).toBe('Germany (DE)');
		});

		it('filters case-insensitively', async () => {
			const result = await listSearch.searchCountries.call(mockCtx, 'ger');
			expect(result.results).toHaveLength(1);
			expect(result.results[0].value).toBe('DE');
		});

		it('returns empty array for non-matching filter', async () => {
			const result = await listSearch.searchCountries.call(mockCtx, 'zzzzz');
			expect(result.results).toHaveLength(0);
		});

		it('falls back to local constants on API failure', async () => {
			mockGetAllFormats.mockRejectedValueOnce(new Error('network'));
			const result = await listSearch.searchCountries.call(mockCtx, undefined);
			expect(result.results).toHaveLength(COUNTRY_OPTIONS.length);
		});

		it('falls back when API returns no countries', async () => {
			mockGetAllFormats.mockResolvedValueOnce({ success: true, countries: [] } as any);
			const result = await listSearch.searchCountries.call(mockCtx, undefined);
			expect(result.results).toHaveLength(COUNTRY_OPTIONS.length);
		});
	});

	describe('searchFormats', () => {
		it('deduplicates formats across countries and tags with country', async () => {
			const result = await listSearch.searchFormats.call(mockCtx, undefined);
			const values = result.results.map((r) => r.value);
			// pdf appears for DE and AT — should surface with country tags
			expect(values.filter((v) => v === 'pdf').length).toBeGreaterThanOrEqual(1);
			expect(values).toContain('xrechnung');
			expect(values).toContain('ebinterface');
		});

		it('filters by format name', async () => {
			const result = await listSearch.searchFormats.call(mockCtx, 'xrechnung');
			expect(result.results.length).toBeGreaterThan(0);
			expect(result.results.every((r) => r.name.toLowerCase().includes('xrechnung'))).toBe(true);
		});

		it('filters by country tag', async () => {
			const result = await listSearch.searchFormats.call(mockCtx, '(DE)');
			expect(result.results.length).toBeGreaterThan(0);
			expect(result.results.every((r) => r.name.includes('(DE)'))).toBe(true);
		});

		it('falls back to local constants on API failure', async () => {
			mockGetAllFormats.mockRejectedValueOnce(new Error('network'));
			const result = await listSearch.searchFormats.call(mockCtx, undefined);
			expect(result.results).toHaveLength(FORMAT_OPTIONS.length);
		});
	});
});
