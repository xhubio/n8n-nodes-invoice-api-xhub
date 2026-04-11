import type { ILoadOptionsFunctions, INodeListSearchResult } from 'n8n-workflow';

import { COUNTRY_OPTIONS, FORMAT_OPTIONS } from '../../../shared/constants';

export const listSearch = {
	async searchCountries(
		this: ILoadOptionsFunctions,
		filter?: string,
	): Promise<INodeListSearchResult> {
		const results = COUNTRY_OPTIONS.filter(
			(o) => !filter || (o.name as string).toLowerCase().includes(filter.toLowerCase()),
		).map((o) => ({ name: o.name as string, value: o.value as string }));
		return { results };
	},

	async searchFormats(
		this: ILoadOptionsFunctions,
		filter?: string,
	): Promise<INodeListSearchResult> {
		const results = FORMAT_OPTIONS.filter(
			(o) => !filter || (o.name as string).toLowerCase().includes(filter.toLowerCase()),
		).map((o) => ({ name: o.name as string, value: o.value as string }));
		return { results };
	},
};
