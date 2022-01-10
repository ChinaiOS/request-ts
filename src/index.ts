import Request from './core';
import asPromise from './as-promise';

export default function request(options) {
    if (!options) {
        throw new Error('options不能为空');
    } else
    if (!options.url) {
        throw new Error('options.url不能为空');
    }
    // else if (!callback || typeof callback !== 'function') {
    //     throw new Error('callback不能为空且必须是函数类型');
    // }
    if (options.isStream) {
        return new Request(options);
    } else {
        return asPromise(options);
    }
}
