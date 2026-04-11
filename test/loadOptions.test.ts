import type { ILoadOptionsFunctions } from 'n8n-workflow';

import { listSearch } from '../nodes/InvoiceXhub/methods/loadOptions';
import { COUNTRY_OPTIONS, FORMAT_OPTIONS } from '../shared/constants';

// listSearch methods only filter local constants — no API calls, no context needed
const mockCtx = {} as ILoadOptionsFunctions;

describe('listSearch', () => {
	describe('searchCountries', () => {
		it('returns all countries when filter is undefined', async () => {
			const result = await listSearch.searchCountries.call(mockCtx, undefined);
			expect(result.results).toHaveLength(COUNTRY_OPTIONS.length);
		});

		it('returns all countries when filter is empty string', async () => {
			const result = await listSearch.searchCountries.call(mockCtx, '');
			expect(result.results).toHaveLength(COUNTRY_OPTIONS.length);
		});

		it('filters case-insensitively (lowercase input)', async () => {
			const result = await listSearch.searchCountries.call(mockCtx, 'ger');
			expect(result.results).toHaveLength(1);
			expect(result.results[0].value).toBe('DE');
			expect(result.results[0].name).toContain('Germany');
		});

		it('filters case-insensitively (uppercase input)', async () => {
			const result = await listSearch.searchCountries.call(mockCtx, 'GER');
			expect(result.results).toHaveLength(1);
			expect(result.results[0].value).toBe('DE');
		});

		it('matches country code in parentheses', async () => {
			const result = await listSearch.searchCountries.call(mockCtx, '(AT)');
			expect(result.results).toHaveLength(1);
			expect(result.results[0].value).toBe('AT');
		});

		it('returns empty array for non-matching filter', async () => {
			const result = await listSearch.searchCountries.call(mockCtx, 'zzzzz');
			expect(result.results).toHaveLength(0);
		});

		it('each result has name and value string properties', async () => {
			const result = await listSearch.searchCountries.call(mockCtx, undefined);
			for (const item of result.results) {
				expect(typeof item.name).toBe('string');
				expect(typeof item.value).toBe('string');
				expect(item.name.length).toBeGreaterThan(0);
				expect(String(item.value).length).toBeGreaterThan(0);
			}
		});
	});

	describe('searchFormats', () => {
		it('returns all formats when filter is undefined', async () => {
			const result = await listSearch.searchFormats.call(mockCtx, undefined);
			expect(result.results).toHaveLength(FORMAT_OPTIONS.length);
		});

		it('returns all formats when filter is empty string', async () => {
			const result = await listSearch.searchFormats.call(mockCtx, '');
			expect(result.results).toHaveLength(FORMAT_OPTIONS.length);
		});

		it('filters by format name (xrechnung)', async () => {
			const result = await listSearch.searchFormats.call(mockCtx, 'xrechnung');
			expect(result.results.length).toBeGreaterThan(0);
			expect(result.results.every((r) => r.name.toLowerCase().includes('xrechnung'))).toBe(true);
		});

		it('filters all UBL variants by partial match', async () => {
			const result = await listSearch.searchFormats.call(mockCtx, 'ubl');
			// Expects: UBL Belgium, UBL Netherlands, UBL Bulgaria, UBL (Generic)
			expect(result.results.length).toBeGreaterThanOrEqual(4);
			expect(result.results.every((r) => r.name.toLowerCase().includes('ubl'))).toBe(true);
		});

		it('filters by country code in parentheses', async () => {
			const result = await listSearch.searchFormats.call(mockCtx, '(DE)');
			// Expects: XRechnung (DE), ZUGFeRD (DE)
			expect(result.results.length).toBeGreaterThanOrEqual(2);
			expect(result.results.every((r) => r.name.includes('(DE)'))).toBe(true);
		});

		it('filters case-insensitively', async () => {
			const lower = await listSearch.searchFormats.call(mockCtx, 'facturx');
			const upper = await listSearch.searchFormats.call(mockCtx, 'FACTURX');
			expect(lower.results).toHaveLength(upper.results.length);
		});

		it('returns empty array for non-matching filter', async () => {
			const result = await listSearch.searchFormats.call(mockCtx, 'nonexistent');
			expect(result.results).toHaveLength(0);
		});

		it('each result has name and value string properties', async () => {
			const result = await listSearch.searchFormats.call(mockCtx, undefined);
			for (const item of result.results) {
				expect(typeof item.name).toBe('string');
				expect(typeof item.value).toBe('string');
				expect(item.name.length).toBeGreaterThan(0);
				expect(String(item.value).length).toBeGreaterThan(0);
			}
		});
	});
});
