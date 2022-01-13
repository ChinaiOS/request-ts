import Request from '../core/index.js';
import fse from 'fs-extra';
export default function asPromise(options = {}) {
    const promise = new Promise((resolve, reject) => {
        const request = new Request(options);
        console.log('Mark 44444444');
        let body = '';
        request.on('response', (response) => {
            console.log('Mark 11111111111111111111111111111111111');
            console.log(response.headers['content-type']);
            const contentType = response.headers['content-type'].toString();
            console.log(contentType);
            response.on('end', () => {
                console.log('Mark 555555555555555');
                Object.assign(response, { body });
                resolve(response);
            });
            if (contentType.indexOf('text/plain') != -1 || contentType.indexOf('text/html') != -1) {
                console.log('Mark 222222222222222222222222');
                response.on('data', (data) => {
                    body += data;
                });
            }
            else if (contentType.indexOf('image/jpeg') != -1 || contentType.indexOf('application/pdf') != -1) {
                console.log('22222');
                const path = options.myPath;
                fse.ensureFileSync(path);
                const writeStream = fse.createWriteStream(path, {
                    start: 0,
                    flags: 'a+',
                    autoDestroy: true,
                });
                response.pipe(writeStream);
            }
        });
        request.on('error', (error) => {
            reject(error);
        });
    });
    return promise;
}
//# sourceMappingURL=index.js.map