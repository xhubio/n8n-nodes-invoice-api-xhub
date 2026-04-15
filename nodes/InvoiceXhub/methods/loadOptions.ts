import type { ILoadOptionsFunctions, INodeListSearchResult } from 'n8n-workflow';

import { getAllFormats } from '../../../shared/GenericFunctions';
import { COUNTRY_OPTIONS, FORMAT_OPTIONS } from '../../../shared/constants';

interface ApiCountry {
	code?: string;
	name?: string;
	formats?: ApiFormat[];
}

interface ApiFormat {
	id?: string;
	name?: string;
	mimeType?: string;
	description?: string;
}

function applyFilter<T extends { name: string }>(items: T[], filter?: string): T[] {
	if (!filter) return items;
	const needle = filter.toLowerCase();
	return items.filter((o) => o.name.toLowerCase().includes(needle));
}

export const listSearch = {
	async searchCountries(
		this: ILoadOptionsFunctions,
		filter?: string,
	): Promise<INodeListSearchResult> {
		try {
			const response = await getAllFormats.call(this);
			const countries = (response.countries as unknown as ApiCountry[] | undefined) ?? [];
			if (countries.length > 0) {
				const results = applyFilter(
					countries
						.filter((c) => typeof c.code === 'string')
						.map((c) => ({
							name: c.name ? `${c.name} (${c.code!.toUpperCase()})` : c.code!.toUpperCase(),
							value: c.code!.toUpperCase(),
						})),
					filter,
				);
				return { results };
			}
		} catch {
			// fall through to local fallback
		}

		const results = applyFilter(
			COUNTRY_OPTIONS.map((o) => ({ name: o.name as string, value: o.value as string })),
			filter,
		);
		return { results };
	},

	async searchFormats(
		this: ILoadOptionsFunctions,
		filter?: string,
	): Promise<INodeListSearchResult> {
		try {
			const response = await getAllFormats.call(this);
			const countries = (response.countries as unknown as ApiCountry[] | undefined) ?? [];
			if (countries.length > 0) {
				const seen = new Map<string, string>();
				for (const country of countries) {
					const countryTag = country.code ? ` (${country.code.toUpperCase()})` : '';
					for (const format of country.formats ?? []) {
						if (!format.id) continue;
						const id = format.id.toLowerCase();
						const label = format.name ? `${format.name}${countryTag}` : id + countryTag;
						if (!seen.has(`${id}|${label}`)) {
							seen.set(`${id}|${label}`, label);
						}
					}
				}
				const merged = Array.from(seen.entries()).map(([key, name]) => ({
					name,
					value: key.split('|')[0],
				}));
				if (merged.length > 0) {
					return { results: applyFilter(merged, filter) };
				}
			}
		} catch {
			// fall through to local fallback
		}

		const results = applyFilter(
			FORMAT_OPTIONS.map((o) => ({ name: o.name as string, value: o.value as string })),
			filter,
		);
		return { results };
	},
};
