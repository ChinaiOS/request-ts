console.log('Hello World!');
import Request from './Request';



export default function request(options, callback) {
    if (!options) {
        throw new Error('options不能为空');
    }

    // if (!options.url) {
    //     throw new Error('options.url不能为空');
    // }
    else if (!callback || typeof callback !== 'function') {
        throw new Error('callback不能为空且必须是函数类型');
    }
    return new Request(options, callback);
}
