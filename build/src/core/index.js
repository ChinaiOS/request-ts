"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const http = require("node:http");
const https = require("node:https");
const node_stream_1 = require("node:stream");
const is_1 = require("@sindresorhus/is");
const form_data_encoder_1 = require("form-data-encoder");
class Request extends node_stream_1.Duplex {
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
    start() {
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
            }
            else if (this.httpModule === 'https:') {
                this._request = https.request(this.options.url, this.options);
            }
            else {
                console.error(`Invalid protocol: ${this.httpModule}`);
                this.emit('error', new Error('Invalid protocol: ' + this.httpModule));
            }
        }
        catch (error) {
            console.error(error);
            return;
        }
        if (this.body) {
            this._finalizeBody();
            this._sendBody();
        }
        this._request.on('response', this.onRequestResponse.bind(this));
        this._request.on('error', this.onRequestError.bind(this));
        this._request.on('drain', function () {
        });
        this._request.end();
    }
    _sendBody() {
        const { body } = this.options;
        if (!is_1.default.undefined(body)) {
            this._writeRequest(body, undefined, () => {
                console.log('');
            });
        }
    }
    _finalizeBody() {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
            const { options } = this;
            const { headers } = options;
            const isForm = !is_1.default.undefined(options.form);
            const isJSON = !is_1.default.undefined(options.json);
            const isBody = !is_1.default.undefined(options.body);
            if (isForm || isJSON || isBody) {
                const noContentType = !is_1.default.string(headers['content-type']);
                if (isBody) {
                    if ((0, form_data_encoder_1.isFormData)(options.body)) {
                        const encoder = new form_data_encoder_1.FormDataEncoder(options.body);
                        if (noContentType) {
                            headers['content-type'] = encoder.headers['Content-Type'];
                        }
                        headers['content-length'] = encoder.headers['Content-Length'];
                        options.body = encoder.encode();
                    }
                    if ((0, form_data_encoder_1.isFormData)(options.body) && noContentType) {
                        headers['content-type'] = `multipart/form-data; boundary=${options.body.getBoundary()}`;
                    }
                }
                else if (isForm) {
                    if (noContentType) {
                        headers['content-type'] = 'application/x-www-form-urlencoded';
                    }
                    const { form } = options;
                    options.form = undefined;
                    options.body = (new URLSearchParams(form)).toString();
                }
                else {
                    if (noContentType) {
                        headers['content-type'] = 'application/json';
                    }
                    const { json } = options;
                    options.json = undefined;
                    options.body = options.stringifyJson(json);
                }
            }
            if (options.responseType === 'json' && !('accept' in options.headers)) {
                options.headers.accept = 'application/json';
            }
        });
    }
    _writeRequest(chunk, encoding, callback) {
        if (!this._request || this._request.destroyed) {
            return;
        }
        this._request.write(chunk, encoding, (error) => {
            if (!error) {
            }
            callback(error);
        });
    }
    onRequestResponse(response) {
        if (this.timing) {
            this.timings.response = Date.now() - this.startTimeNow;
        }
        console.log('44444444444444444444');
        console.log(`response ${response}`);
        console.log(`${response.headers}`);
        this._responseSize = Number(response.headers['content-length']) || undefined;
        this.emit('downloadProgress', this.downloadProgress);
        this.emit('response', response);
        this.response = response;
        let num = 0;
        if (this.isStream) {
            response.on('readable', () => {
                if (this._triggerRead) {
                    console.log(num++);
                    this._read();
                }
            });
            response.on('end', () => {
                this._responseSize = this._downloadedSize;
                if (this._aborted) {
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
    }
    flush() {
        var _a;
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
            if (this._flushed) {
                return;
            }
            this._flushed = true;
            try {
                yield this._finalizeBody();
                if (this.destroyed) {
                    return;
                }
                if (this.destroyed) {
                    (_a = this._request) === null || _a === void 0 ? void 0 : _a.destroy();
                    return;
                }
            }
            catch (error) {
            }
        });
    }
    _read() {
        console.log('读取数据');
        this._triggerRead = true;
        const { response } = this;
        if (response && !this._stopReading) {
            if (response.readableLength) {
                this._triggerRead = false;
            }
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
    _destroy(error, callback) {
        this._stopReading = true;
        this.flush = () => (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
            console.log('');
        });
        if (this.options) {
            const { body } = this.options;
            if (is_1.default.nodeStream(body)) {
                body.destroy();
            }
        }
        if (this._request) {
            this._request.destroy();
        }
        callback(error);
    }
    onRequestError(error) {
        if (this._aborted) {
            return;
        }
        console.error(error);
        this.emit('error', error);
    }
    get downloadProgress() {
        let percent;
        if (this._responseSize) {
            percent = this._downloadedSize / this._responseSize;
        }
        else if (this._responseSize === this._downloadedSize) {
            percent = 1;
        }
        else {
            percent = 0;
        }
        return {
            percent,
            transferred: this._downloadedSize,
            total: this._responseSize,
        };
    }
}
exports.default = Request;
//# sourceMappingURL=index.js.map