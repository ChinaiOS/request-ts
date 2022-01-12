import Request from '../core';
import * as fse from 'fs-extra';

export default function asPromise<T>(options: any= {} ): Promise<T>  {
	const promise = new Promise<T>((resolve, reject) => {
        const request = new Request(options);
        console.log('Mark 44444444');
        let body = '';
        // request.on('data', (data) => {
        //     body += data;
        //     // resolve(response);
        // });
        request.on('response', (response) => {
            console.log('Mark 11111111111111111111111111111111111');
            // resolve(response);
            console.log(response.headers['content-type']);

            const contentType = response.headers['content-type'].toString();
            console.log(contentType);
            response.on('end', () => {
                // body += data;
                // resolve(response);
                console.log('Mark 555555555555555');
                // console.log(response);
                Object.assign(response, { body });
                resolve(response);
            });
            if (contentType.indexOf('text/plain') != -1 || contentType.indexOf('text/html') != -1 ) {
                console.log('Mark 222222222222222222222222');
                response.on('data', (data) => {
                    body += data;
                    // resolve(response);
                });
            } else if (contentType.indexOf('image/jpeg') != -1 || contentType.indexOf('application/pdf') != -1) {
                console.log('22222');


                // const date = Date.now();

                // const path = `C:\\Users\\Pete\\Pictures\\${date}-2.pdf`;

                const path = options.myPath;

                fse.ensureFileSync(path);
                const writeStream = fse.createWriteStream(path, {
                    start: 0,
                    flags: 'a+',
                    autoDestroy: true,
                });

                response.pipe(writeStream);


                // resolve(response);
            }
        });
        request.on('error',  (error) => {
            reject(error);
        });
	});

	return promise;
}
