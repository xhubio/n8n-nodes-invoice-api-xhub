"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listSearch = void 0;
const GenericFunctions_1 = require("../../../shared/GenericFunctions");
const constants_1 = require("../../../shared/constants");
function applyFilter(items, filter) {
    if (!filter)
        return items;
    const needle = filter.toLowerCase();
    return items.filter((o) => o.name.toLowerCase().includes(needle));
}
/**
 * Decide whether a caught error should be re-thrown (so the n8n UI shows it
 * to the user) or silently absorbed (so we fall back to local constants).
 *
 * Rule: anything with an HTTP status code came from the server and is
 * meaningful — auth failures, forbidden, rate limits, server errors — all
 * must surface. Only errors without an HTTP response (network/DNS/timeout
 * problems) are treated as "API temporarily unreachable" and trigger the
 * static fallback.
 */
function shouldSurfaceError(err) {
    if (!err || typeof err !== 'object')
        return false;
    const e = err;
    if (e.httpCode !== undefined && e.httpCode !== null)
        return true;
    if (typeof e.statusCode === 'number')
        return true;
    if (typeof e.response?.statusCode === 'number')
        return true;
    if (e.cause && (e.cause.statusCode !== undefined || e.cause.httpCode !== undefined)) {
        return true;
    }
    // Node.js network-error codes surface as string .code (ENOTFOUND, ECONNRESET, etc.)
    // Those should NOT surface — they trigger fallback.
    return false;
}
exports.listSearch = {
    async searchCountries(filter) {
        try {
            const response = await GenericFunctions_1.getAllFormats.call(this);
            const countries = response.countries ?? [];
            if (countries.length > 0) {
                const results = applyFilter(countries
                    .filter((c) => typeof c.code === 'string')
                    .map((c) => ({
                    name: c.name ? `${c.name} (${c.code.toUpperCase()})` : c.code.toUpperCase(),
                    value: c.code.toUpperCase(),
                })), filter);
                return { results };
            }
        }
        catch (error) {
            if (shouldSurfaceError(error))
                throw error;
            // Pure network/DNS/timeout — fall through to local constants
        }
        const results = applyFilter(constants_1.COUNTRY_OPTIONS.map((o) => ({ name: o.name, value: o.value })), filter);
        return { results };
    },
    async searchFormats(filter) {
        try {
            const response = await GenericFunctions_1.getAllFormats.call(this);
            const countries = response.countries ?? [];
            if (countries.length > 0) {
                const seen = new Map();
                for (const country of countries) {
                    const countryTag = country.code ? ` (${country.code.toUpperCase()})` : '';
                    for (const format of country.formats ?? []) {
                        if (!format.id)
                            continue;
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
        }
        catch (error) {
            if (shouldSurfaceError(error))
                throw error;
            // Pure network/DNS/timeout — fall through to local constants
        }
        const results = applyFilter(constants_1.FORMAT_OPTIONS.map((o) => ({ name: o.name, value: o.value })), filter);
        return { results };
    },
};
//# sourceMappingURL=loadOptions.js.map