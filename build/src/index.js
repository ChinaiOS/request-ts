"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("./core");
const as_promise_1 = require("./as-promise");
function request(options) {
    if (!options) {
        throw new Error('options不能为空');
    }
    else if (!options.url) {
        throw new Error('options.url不能为空');
    }
    if (!options.headers) {
        options.headers = {};
    }
    if (options.isStream) {
        return new core_1.default(options);
    }
    else {
        return (0, as_promise_1.default)(options);
    }
}
exports.default = request;
//# sourceMappingURL=index.js.map