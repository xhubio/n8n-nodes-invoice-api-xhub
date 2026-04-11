"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listSearch = void 0;
const constants_1 = require("../../../shared/constants");
exports.listSearch = {
    async searchCountries(filter) {
        const results = constants_1.COUNTRY_OPTIONS.filter((o) => !filter || o.name.toLowerCase().includes(filter.toLowerCase())).map((o) => ({ name: o.name, value: o.value }));
        return { results };
    },
    async searchFormats(filter) {
        const results = constants_1.FORMAT_OPTIONS.filter((o) => !filter || o.name.toLowerCase().includes(filter.toLowerCase())).map((o) => ({ name: o.name, value: o.value }));
        return { results };
    },
};
//# sourceMappingURL=loadOptions.js.map