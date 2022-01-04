
import http from 'http';
import https from 'https';

export default class Request {
    // 协议 http或者https
    httpModule;
    private _started;
    private method;
    // 是否记录耗时
    private timing;
    // 耗时集合
    private timings;
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
        const myURL = new URL(this.options.url);
        const defaultModules = {'http:': http, 'https:': https}
        this.httpModule = defaultModules[myURL.protocol];

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
            // All timings will be relative to this request's startTime.  In order to do this,
            // we need to capture the wall-clock start time (via Date), immediately followed
            // by the high-resolution timer (via now()).  While these two won't be set
            // at the _exact_ same time, they should be close enough to be able to calculate
            // high-resolution, monotonically non-decreasing timestamps relative to startTime.
            var startTime = new Date().getTime()
            var startTimeNow = now()
        }

        this._started = true;
        this.method = this.options.method || 'GET';

        try {
            this.req = this.httpModule.request(this.options);
        } catch (err) {
            // self.emit('error', err)
            return;
        }

        if (this.timing) {
            this.startTime = startTime
            self.startTimeNow = startTimeNow

            // Timing values will all be relative to startTime (by comparing to startTimeNow
            // so we have an accurate clock)
            self.timings = {}
        }



        this.req.on('response', this.onRequestResponse)
        this.req.on('error', this.onRequestError)
        this.req.on('drain', function () {
        //   self.emit('drain')
        })
    }

    onRequestResponse = function (response) {
        if (this.timing) {
          this.timings.response = Date.now() - self.startTimeNow
        }

        debug('onRequestResponse', self.uri.href, response.statusCode, response.headers)
        response.on('end', function () {
          if (self.timing) {
            self.timings.end = now() - self.startTimeNow
            response.timingStart = self.startTime

            // fill in the blanks for any periods that didn't trigger, such as
            // no lookup or connect due to keep alive
            if (!self.timings.socket) {
              self.timings.socket = 0
            }
            if (!self.timings.lookup) {
              self.timings.lookup = self.timings.socket
            }
            if (!self.timings.connect) {
              self.timings.connect = self.timings.lookup
            }
            if (!self.timings.response) {
              self.timings.response = self.timings.connect
            }

            debug('elapsed time', self.timings.end)

            // elapsedTime includes all redirects
            self.elapsedTime += Math.round(self.timings.end)

            // NOTE: elapsedTime is deprecated in favor of .timings
            response.elapsedTime = self.elapsedTime

            // timings is just for the final fetch
            response.timings = self.timings

            // pre-calculate phase timings as well
            response.timingPhases = {
              wait: self.timings.socket,
              dns: self.timings.lookup - self.timings.socket,
              tcp: self.timings.connect - self.timings.lookup,
              firstByte: self.timings.response - self.timings.connect,
              download: self.timings.end - self.timings.response,
              total: self.timings.end
            }
          }
          debug('response end', self.uri.href, response.statusCode, response.headers)
        })

        if (self._aborted) {
          debug('aborted', self.uri.href)
          response.resume()
          return
        }

        self.response = response
        response.request = self
        response.toJSON = responseToJSON

        // XXX This is different on 0.10, because SSL is strict by default
        if (self.httpModule === https &&
          self.strictSSL && (!response.hasOwnProperty('socket') ||
          !response.socket.authorized)) {
          debug('strict ssl error', self.uri.href)
          var sslErr = response.hasOwnProperty('socket') ? response.socket.authorizationError : self.uri.href + ' does not support SSL'
          self.emit('error', new Error('SSL Error: ' + sslErr))
          return
        }

        // Save the original host before any redirect (if it changes, we need to
        // remove any authorization headers).  Also remember the case of the header
        // name because lots of broken servers expect Host instead of host and we
        // want the caller to be able to specify this.
        self.originalHost = self.getHeader('host')
        if (!self.originalHostHeaderName) {
          self.originalHostHeaderName = self.hasHeader('host')
        }
        if (self.setHost) {
          self.removeHeader('host')
        }
        self.clearTimeout()

        var targetCookieJar = (self._jar && self._jar.setCookie) ? self._jar : globalCookieJar
        var addCookie = function (cookie) {
          // set the cookie if it's domain in the href's domain.
          try {
            targetCookieJar.setCookie(cookie, self.uri.href, {ignoreError: true})
          } catch (e) {
            self.emit('error', e)
          }
        }

        response.caseless = caseless(response.headers)

        if (response.caseless.has('set-cookie') && (!self._disableCookies)) {
          var headerName = response.caseless.has('set-cookie')
          if (Array.isArray(response.headers[headerName])) {
            response.headers[headerName].forEach(addCookie)
          } else {
            addCookie(response.headers[headerName])
          }
        }

        if (self._redirect.onResponse(response)) {
          return // Ignore the rest of the response
        } else {
          // Be a good stream and emit end when the response is finished.
          // Hack to emit end on close because of a core bug that never fires end
          response.on('close', function () {
            if (!self._ended) {
              self.response.emit('end')
            }
          })

          response.once('end', function () {
            self._ended = true
          })

          var noBody = function (code) {
            return (
              self.method === 'HEAD' ||
              // Informational
              (code >= 100 && code < 200) ||
              // No Content
              code === 204 ||
              // Not Modified
              code === 304
            )
          }

          var responseContent
          if (self.gzip && !noBody(response.statusCode)) {
            var contentEncoding = response.headers['content-encoding'] || 'identity'
            contentEncoding = contentEncoding.trim().toLowerCase()

            // Be more lenient with decoding compressed responses, since (very rarely)
            // servers send slightly invalid gzip responses that are still accepted
            // by common browsers.
            // Always using Z_SYNC_FLUSH is what cURL does.
            var zlibOptions = {
              flush: zlib.Z_SYNC_FLUSH,
              finishFlush: zlib.Z_SYNC_FLUSH
            }

            if (contentEncoding === 'gzip') {
              responseContent = zlib.createGunzip(zlibOptions)
              response.pipe(responseContent)
            } else if (contentEncoding === 'deflate') {
              responseContent = zlib.createInflate(zlibOptions)
              response.pipe(responseContent)
            } else {
              // Since previous versions didn't check for Content-Encoding header,
              // ignore any invalid values to preserve backwards-compatibility
              if (contentEncoding !== 'identity') {
                debug('ignoring unrecognized Content-Encoding ' + contentEncoding)
              }
              responseContent = response
            }
          } else {
            responseContent = response
          }

          if (self.encoding) {
            if (self.dests.length !== 0) {
              console.error('Ignoring encoding parameter as this stream is being piped to another stream which makes the encoding option invalid.')
            } else {
              responseContent.setEncoding(self.encoding)
            }
          }

          if (self._paused) {
            responseContent.pause()
          }

          self.responseContent = responseContent

          self.emit('response', response)

          self.dests.forEach(function (dest) {
            self.pipeDest(dest)
          })

          responseContent.on('data', function (chunk) {
            if (self.timing && !self.responseStarted) {
              self.responseStartTime = (new Date()).getTime()

              // NOTE: responseStartTime is deprecated in favor of .timings
              response.responseStartTime = self.responseStartTime
            }
            self._destdata = true
            self.emit('data', chunk)
          })
          responseContent.once('end', function (chunk) {
            self.emit('end', chunk)
          })
          responseContent.on('error', function (error) {
            self.emit('error', error)
          })
          responseContent.on('close', function () { self.emit('close') })

          if (self.callback) {
            self.readResponseBody(response)
          } else { // if no callback
            self.on('end', function () {
              if (self._aborted) {
                debug('aborted', self.uri.href)
                return
              }
              self.emit('complete', response)
            })
          }
        }
        debug('finish init function', self.uri.href)
      }
}
