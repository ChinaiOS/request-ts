import Request from '../core';

export default function asPromise<T>(options = {}): Promise<T>  {
	const promise = new Promise<T>((resolve, reject) => {
        const request = new Request(options);
        console.log('Mark 2222222222222222222222222');
        request.on('response', (response) => {
            console.log('Mark 11111111111111111111111111111111111');
            resolve(response);
        });
        request.on('error',  (error) => {
            reject(error);
        });
	});

	return promise;
}
