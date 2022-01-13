import Request from './core/index.js';
import asPromise from './as-promise/index.js';
export default function request(options) {
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
        return new Request(options);
    }
    else {
        return asPromise(options);
    }
}
//# sourceMappingURL=index.js.map