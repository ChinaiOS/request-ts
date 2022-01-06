
import * as http from 'node:http';
// const https = require('https');
// import * as https from 'https';

export default class Request {
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
    // 取消请求
    private _aborted;
    private _ended;
    // 响应
    private response;
    private options;
    private req;
    constructor(options, callback) {
        console.log('class Request constructor!');
        console.log(options);
        console.log(callback);
        this.options = options;
        this.init();
    }

    init() {
        // if (!this.httpModule) {
        //     return this.emit('error', new Error('Invalid protocol: ' + protocol))
        // }

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
            this.req = http.request(this.options, (response) => {
                    // 不断更新数据
                    let body = '';
                    response.on('data', function(data) {
                        body += data;
                    });

                    response.on('end', function() {
                        // 数据接收完成
                        console.log(body);
                    });
            });
            // const myURL = new URL(this.options);
            // this.httpModule = myURL.protocol;
            // if (this.httpModule === 'http:') {
            //     this.req = http.request(this.options);
            // } else if (this.httpModule === 'https:') {
            //     console.log('222222222222');
            //     this.req = https.request(this.options);
            // } else {
            //     console.error(`Invalid protocol: ${this.httpModule}`);
            //     // self.emit('error', new Error('Invalid protocol: ' + protocol)
            // }
            // console.log(this.httpModule);
            // console.log(this.req);

        } catch (error) {
            // self.emit('error', err)
            console.error(error);

            return;
        }

        this.req.on('response', this.onRequestResponse);
        this.req.on('error', this.onRequestError);
        this.req.on('drain', function () {
            //   self.emit('drain')
        });
        this.req.end();
    }

    onRequestResponse(response) {
        if (this.timing) {
            this.timings.response = Date.now() - this.startTimeNow;
        }

        console.log(`response ${response}`);

        // debug('onRequestResponse', self.uri.href, response.statusCode, response.headers)
        response.on('end', () => {
            if (this._aborted) {
                //   debug('aborted', self.uri.href)
                response.resume();
                return;
            }

            this.response = response;

            // Be a good stream and emit end when the response is finished.
            // Hack to emit end on close because of a core bug that never fires end
            response.on('close', () => {
                if (!this._ended) {
                    this.response.emit('end');
                }
            });

            response.once('end', () => {
                this._ended = true;
            });

        });
    }

    onRequestError(error) {
        if (this._aborted) {
            return;
        }
        console.error(error);
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
