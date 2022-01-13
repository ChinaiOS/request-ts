"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
const fse = require("fs-extra");
const node_util_1 = require("node:util");
const stream = require("node:stream");
const options = {
    headers: {
        'Content-Type': 'application/json',
    },
    myPath: `C:\\Users\\Pete\\Pictures\\111-3-${Date.now()}.exe`,
    timeout: 50000,
    isStream: true,
    json: {
        gray_id: "sadasdghjasdhjgasdhjas",
        pkgs: ["v2"],
        channel: "qa"
    }
};
const pipeline = (0, node_util_1.promisify)(stream.pipeline);
const req = (0, index_1.default)(options);
const path = `C:\\Users\\Pete\\Pictures\\1122-1636780.exe`;
fse.ensureFileSync(path);
const writeStream = fse.createWriteStream(path, {
    start: 0,
    flags: 'a+',
    autoDestroy: true,
});
pipeline(req, writeStream);
req.on('downloadProgress', (progress) => {
    console.log(progress.percent);
    console.log(progress.transferred);
    console.log(progress.total);
});
req.on('response', (response) => {
    console.log('Promise Mark ~~~~~~~~~~~~~~~~~~~~~~~~~~~');
    console.log(response.body);
    console.log('app run end!');
});
console.log('request run end!');
//# sourceMappingURL=test1-stream.js.map