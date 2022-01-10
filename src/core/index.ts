
import * as http from 'node:http';
// const https = require('https');
import * as https from 'node:https';
// import * as fse from 'fs-extra';
// import * as eventEmitter from 'node:events';
import { Duplex } from 'node:stream';
import is from '@sindresorhus/is';

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
    private _ended;
    // 响应
    private response;
    private isStream: boolean;
    private options;
    private _request;
    private _uploadedSize: number;


    constructor(options) {
        super();
        console.log('class Request constructor!');
        console.log(options);
        this.isStream = false;
        this.options = options;
        this.body = this.options.body;
        this._uploadedSize = 0;

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
		const {body} = this.options;
		const currentRequest = this.redirectUrls.length === 0 ? this : this._request ?? this;

		if (is.nodeStream(body)) {
			body.pipe(currentRequest);
		} else if (is.generator(body) || is.asyncGenerator(body)) {
			(async () => {
				try {
					for await (const chunk of body) {
						await this._asyncWrite(chunk);
					}

					super.end();
				} catch (error: any) {
					this._beforeError(error);
				}
			})();
		} else {
			this._unlockWrite();

			if (!is.undefined(body)) {
				this._writeRequest(body, undefined, () => {});
				currentRequest.end();

				this._lockWrite();
			} else if (this._cannotHaveBody || this._noPipe) {
				currentRequest.end();

				this._lockWrite();
			}
		}
	}

    override _write(chunk: unknown, encoding: BufferEncoding | undefined, callback: (error?: Error | null) => void): void {
		const write = (): void => {
			this._writeRequest(chunk, encoding, callback);
		};

		if (this._requestInitialized) {
			write();
		} else {
			this._jobs.push(write);
		}
	}

    private _writeRequest(chunk: any, encoding: BufferEncoding | undefined, callback: (error?: Error | null) => void): void {
		if (!this._request || this._request.destroyed) {
			// Probably the `ClientRequest` instance will throw
			return;
		}

		this._request.write(chunk, encoding!, (error?: Error | null) => {
			if (!error) {
				this._uploadedSize += Buffer.byteLength(chunk, encoding);

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

        console.log(`${response.headers}`);

        let body = '';
        // 不断更新数据
        if (!this.isStream) {
            response.on('data', function(data) {
                body += data;
            });

            // debug('onRequestResponse', self.uri.href, response.statusCode, response.headers)
            response.on('end', () => {
                // console.log('88888888888888888888888888');
                // console.log(data);
                if (this._aborted) {
                    //   debug('aborted', self.uri.href)
                    response.resume();
                    return;
                }
                this._ended = true;

                // this.response.body = body;
                // 数据接收完成
                console.log(body);

                this.response = response;


                const now = Date.now();


                Object.assign(this.response, { body } );


                console.log('Mark 333333333333333333333333333333');
                // console.log('Mark 333333333333333333333333333333');

                console.log(Date.now() - now);
//


                this.emit('response', this.response);
                // this.emit('response', body);


                // Be a good stream and emit end when the response is finished.
                // Hack to emit end on close because of a core bug that never fires end
                response.on('close', () => {
                    if (!this._ended) {
                        this.response.emit('end');
                    }
                });

                // response.once('end', () => {
                //     this._ended = true;
                // });

            });
        }
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
}
