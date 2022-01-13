
import * as http from 'node:http';
// const https = require('https');
import * as https from 'node:https';
// import * as fse from 'fs-extra';
// import * as eventEmitter from 'node:events';
import { Duplex } from 'node:stream';
import is from '@sindresorhus/is';
import { FormDataEncoder, isFormData } from 'form-data-encoder';

export interface Progress {
	percent: number;
	transferred: number;
	total?: number;
}

export default class Request extends Duplex {
    // 协议 http或者https
    httpModule;
    private _started;
    // 请求的方式
    private method: string;
    // 是否记录耗时
    private timing;
    // 耗时集合
    private timings;
    // 开始的时间戳
    private startTimeNow;
    // 请求体
    private body;
    // 取消请求
    private _aborted;
    // private _ended;
    // 响应
    private response;
    private isStream: boolean;
    private options;
    private _request;
    // private _uploadedSize: number;
    private _stopReading: boolean;
    private _triggerRead: boolean;
    private _downloadedSize: number;
    private _responseSize?: number;
    private _flushed: boolean;


    constructor(options) {
        super();
        console.log('class Request constructor!');
        console.log(options);
        this.isStream = false;
        this.options = options;
        this.body = this.options.body;
        this._stopReading = false;
        this._triggerRead = false;
        this._downloadedSize = 0;
        this._flushed = false;

        // this._uploadedSize = 0;

        if (this.options.isStream) {
            this.isStream = this.options.isStream;
        }

        this.init();
    }

    init() {
        if (!this._started) {
            this.start();
        }

     }

    start(): void {
        console.log('Request function satrt!');

        if (this.timing) {
            this.startTimeNow = Date.now();
            this.timings = {};
        }

        this._started = true;
        this.method = this.options.method || 'GET';
        console.log(this.method);

        try {
            const myURL = new URL(this.options.url);
            this.httpModule = myURL.protocol;
            if (this.httpModule === 'http:') {
                this._request = http.request(this.options.url, this.options);
            } else if (this.httpModule === 'https:') {
                this._request = https.request(this.options.url, this.options);
            } else {
                console.error(`Invalid protocol: ${this.httpModule}`);
                this.emit('error', new Error('Invalid protocol: ' + this.httpModule));
            }

            //     const date = Date.now();

            //     const path = `C:\\Users\\Pete\\Pictures\\${date}.jpg`;

            //     fse.ensureFileSync(path);
            //     const writeStream = fse.createWriteStream(path, {
            //         start: 0,
            //         flags: 'a+',
            //         autoDestroy: true,
            //     });
            //     response.pipe(writeStream);

            // }

            // console.log(this.httpModule);
            // console.log(this.req);

        } catch (error) {
            // self.emit('error', err)
            console.error(error);

            return;
        }

        // 组装请求体
        if (this.body) {
            // this.setContentLength();
            // if (Array.isArray(this.body)) {
            //   self.body.forEach(function (part) {
            //     self.write(part)
            //   })
            // } else {
            //   self.write(self.body)
            // }
            // self.end()
            this._finalizeBody();
            this._sendBody();
        }

        this._request.on('response', this.onRequestResponse.bind(this));
        this._request.on('error', this.onRequestError.bind(this));
        this._request.on('drain', function () {
            //   self.emit('drain')
        });
        this._request.end();
    }
    // 如果请求有请求体，那么请求头中需要设置content-length
    // setContentLength(): void {
    //     if (isTypedArray(this.body)) {
    //         self.body = Buffer.from(this.body);
    //     }

    //     if (!self.hasHeader('content-length')) {
    //       var length
    //       if (typeof self.body === 'string') {
    //         length = Buffer.byteLength(self.body)
    //       } else if (Array.isArray(self.body)) {
    //         length = self.body.reduce(function (a, b) { return a + b.length }, 0)
    //       } else {
    //         length = self.body.length
    //       }

    //       if (length) {
    //         self.setHeader('content-length', length)
    //       } else {
    //         self.emit('error', new Error('Argument error, options.body.'))
    //       }
    //     }
    // }
    private _sendBody() {
		// Send body
		const { body } = this.options;
		// const currentRequest = this.redirectUrls.length === 0 ? this : this._request ?? this;

		// if (is.nodeStream(body)) {
		// 	body.pipe(currentRequest);
		// } else if (is.generator(body) || is.asyncGenerator(body)) {
		// 	(async () => {
		// 		try {
		// 			for await (const chunk of body) {
		// 				await this._asyncWrite(chunk);
		// 			}

		// 			super.end();
		// 		} catch (error: any) {
		// 			this._beforeError(error);
		// 		}
		// 	})();
		// } else {
			// this._unlockWrite();

        if (!is.undefined(body)) {
            this._writeRequest(body, undefined, () => {
                console.log('');
            });
            // currentRequest.end();

            // this._lockWrite();
        }
    }

    private async _finalizeBody(): Promise<void> {
		const { options } = this;
		const { headers } = options;

		const isForm = !is.undefined(options.form);
		// eslint-disable-next-line @typescript-eslint/naming-convention
		const isJSON = !is.undefined(options.json);
		const isBody = !is.undefined(options.body);
		// const cannotHaveBody = methodsWithoutBody.has(options.method) && !(options.method === 'GET' && options.allowGetBody);

		// this._cannotHaveBody = cannotHaveBody;

		if (isForm || isJSON || isBody) {
			// if (cannotHaveBody) {
			// 	throw new TypeError(`The \`${options.method}\` method cannot be used with a body`);
			// }

			// Serialize body
			const noContentType = !is.string(headers['content-type']);

			if (isBody) {
				// Body is spec-compliant FormData
				if (isFormData(options.body)) {
					const encoder = new FormDataEncoder(options.body);

					if (noContentType) {
						headers['content-type'] = encoder.headers['Content-Type'];
					}

					headers['content-length'] = encoder.headers['Content-Length'];

					options.body = encoder.encode();
				}

				// Special case for https://github.com/form-data/form-data
				if (isFormData(options.body) && noContentType) {
					headers['content-type'] = `multipart/form-data; boundary=${options.body.getBoundary()}`;
				}
			} else if (isForm) {
				if (noContentType) {
					headers['content-type'] = 'application/x-www-form-urlencoded';
				}

				const {form} = options;
				options.form = undefined;

				options.body = (new URLSearchParams(form as Record<string, string>)).toString();
			} else {
				if (noContentType) {
					headers['content-type'] = 'application/json';
				}

				const { json } = options;
				options.json = undefined;

				options.body = options.stringifyJson(json);
			}

			// const uploadBodySize = await getBodySize(options.body, options.headers);

			// // See https://tools.ietf.org/html/rfc7230#section-3.3.2
			// // A user agent SHOULD send a Content-Length in a request message when
			// // no Transfer-Encoding is sent and the request method defines a meaning
			// // for an enclosed payload body.  For example, a Content-Length header
			// // field is normally sent in a POST request even when the value is 0
			// // (indicating an empty payload body).  A user agent SHOULD NOT send a
			// // Content-Length header field when the request message does not contain
			// // a payload body and the method semantics do not anticipate such a
			// // body.
			// if (is.undefined(headers['content-length']) && is.undefined(headers['transfer-encoding']) && !cannotHaveBody && !is.undefined(uploadBodySize)) {
			// 	headers['content-length'] = String(uploadBodySize);
			// }
        }
        // else if (cannotHaveBody) {
		// 	this._lockWrite();
		// } else {
		// 	this._unlockWrite();
		// }

		if (options.responseType === 'json' && !('accept' in options.headers)) {
			options.headers.accept = 'application/json';
		}

		// this._bodySize = Number(headers['content-length']) || undefined;
	}

    // override _write(chunk: unknown, encoding: BufferEncoding | undefined, callback: (error?: Error | null) => void): void {
	// 	const write = (): void => {
	// 		this._writeRequest(chunk, encoding, callback);
	// 	};

	// 	if (this._requestInitialized) {
	// 		write();
	// 	} else {
	// 		this._jobs.push(write);
	// 	}
	// }

    private _writeRequest(chunk: any, encoding: BufferEncoding | undefined, callback: (error?: Error | null) => void): void {
		if (!this._request || this._request.destroyed) {
			// Probably the `ClientRequest` instance will throw
			return;
		}

		this._request.write(chunk, encoding!, (error?: Error | null) => {
			if (!error) {
				// this._uploadedSize += Buffer.byteLength(chunk, encoding);

				// const progress = this.uploadProgress;

				// if (progress.percent < 1) {
				// 	this.emit('uploadProgress', progress);
				// }
			}

			callback(error);
		});
	}

    onRequestResponse(response) {
        if (this.timing) {
            this.timings.response = Date.now() - this.startTimeNow;
        }
        console.log('44444444444444444444');
        // console.log(this.test2);

        console.log(`response ${response}`);

        // response.setEncoding(this.readableEncoding!);

        console.log(`${response.headers}`);

        this._responseSize = Number(response.headers['content-length']) || undefined;
        this.emit('downloadProgress', this.downloadProgress);

        this.emit('response', response);

        this.response = response;

        // this._triggerRead = true;



        // const date = Date.now();

        // const path = `C:\\Users\\Pete\\Pictures\\${date}.pdf`;

        // fse.ensureFileSync(path);
        // const writeStream = fse.createWriteStream(path, {
        //     start: 0,
        //     flags: 'a+',
        //     autoDestroy: true,
        // });

        // response.pipe(writeStream);

        // let body = '';
        // 不断更新数据

        let num = 0;
        if (this.isStream) {
            response.on('readable', () => {
                // console.log('454545454545');
                if (this._triggerRead) {
                    // console.log('88888888');
                    console.log(num++);

                    this._read();
                }
            });

            // response.on('data', (data) => {
            //     this.emit('data', data);
            //     // body += data;
            // });

            //             // debug('onRequestResponse', self.uri.href, response.statusCode, response.headers)
            response.on('end', () => {
                this._responseSize = this._downloadedSize;
                // console.log('88888888888888888888888888');
                // console.log(data);
                if (this._aborted) {
                    //   debug('aborted', self.uri.href)
                    response.resume();
                    return;
                }
                this.emit('end', null);
            });

            response.once('end', () => {
                this.push(null);
                this._responseSize = this._downloadedSize;
                this.emit('downloadProgress', this.downloadProgress);
            });
        }
                // this._ended = true;

//                 // this.response.body = body;
//                 // 数据接收完成
//                 // console.log(body);

//                 this.response = response;


//                 // const now = Date.now();


//                 // Object.assign(this.response, { body } );


//                 console.log('Mark 333333333333333333333333333333');
//                 // console.log('Mark 333333333333333333333333333333');

//                 // console.log(Date.now() - now);
// //


//                 // this.emit('response', this.response);
//                 this.emit('end', this.response);
//                 // this.emit('response', body);


//                 // Be a good stream and emit end when the response is finished.
//                 // Hack to emit end on close because of a core bug that never fires end
//                 // response.on('close', () => {
//                 //     if (!this._ended) {
//                 //         this.response.emit('end');
//                 //     }
//                 // });

//                 // response.once('end', () => {
//                 //     this._ended = true;
//                 // });

        //         });
        // }
    }

    async flush() {
		if (this._flushed) {
			return;
		}

		this._flushed = true;

		try {
			await this._finalizeBody();

			if (this.destroyed) {
				return;
			}

			// await this._makeRequest();

			if (this.destroyed) {
				this._request?.destroy();
				return;
			}

			// // Queued writes etc.
			// for (const job of this._jobs) {
			// 	job();
			// }

			// Prevent memory leak
			// this._jobs.length = 0;

			// this._requestInitialized = true;
		} catch (error: any) {
			// this._beforeError(error);
		}
	}

    override _read(): void {
        console.log('读取数据');
        this._triggerRead = true;




        const { response } = this;

		if (response && !this._stopReading) {
			// We cannot put this in the `if` above
			// because `.read()` also triggers the `end` event
			if (response.readableLength) {
				this._triggerRead = false;
			}

            // const data = response.read();


            // // data = ;

            // if (data) {
            //     this._downloadedSize += data.length;

            //     const progress = this.downloadProgress;

            //     if (progress.percent < 1) {
            //         this.emit('downloadProgress', progress);
            //     }

            //     this.push(data);

            // }

            let data;
            while ((data = response.read()) !== null) {

				this._downloadedSize += data.length;

				const progress = this.downloadProgress;

				if (progress.percent < 1) {
                    this.emit('downloadProgress', progress);
				}

				this.push(data);
			}
		}
    }

    override _destroy(error: Error | null, callback: (error: Error | null) => void): void {
		this._stopReading = true;
        this.flush = async () => {
            console.log('');
        };

		// Prevent further retries
		// this._stopRetry();
		// this._cancelTimeouts();

		if (this.options) {
			const { body } = this.options;
			if (is.nodeStream(body)) {
				(body as any).destroy();
			}
		}

		if (this._request) {
			this._request.destroy();
		}

		// if (error !== null && !is.undefined(error) && !(error instanceof RequestError)) {
		// 	error = new RequestError(error.message, error, this);
		// }

		callback(error);
	}

    onRequestError(error) {
        if (this._aborted) {
            return;
        }
        console.error(error);
        this.emit('error', error);
        // if (self.req && self.req._reusedSocket && error.code === 'ECONNRESET' &&
        //   self.agent.addRequestNoreuse) {
        //   self.agent = { addRequest: self.agent.addRequestNoreuse.bind(self.agent) }
        //   self.start()
        //   self.req.end()
        //   return
        // }
        // self.clearTimeout()
        // self.emit('error', error)
    }

    /**
	Progress event for downloading (receiving a response).
	*/
	get downloadProgress(): Progress {
		let percent;
		if (this._responseSize) {
			percent = this._downloadedSize / this._responseSize;
		} else if (this._responseSize === this._downloadedSize) {
			percent = 1;
		} else {
			percent = 0;
		}

		return {
			percent,
			transferred: this._downloadedSize,
			total: this._responseSize,
		};
	}
}
