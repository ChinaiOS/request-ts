"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
const options = {
    url: 'https://t7.baidu.com/it/u=3165657288,4248157545&fm=193&f=GIF',
    headers: {
        'Content-Type': 'application/json',
    },
    myPath: `C:\\Users\\Pete\\Pictures\\111-3-${Date.now()}.jpg`,
    timeout: 50000,
    isStream: false,
    json: {
        gray_id: "sadasdghjasdhjgasdhjas",
        pkgs: ["v2"],
        channel: "qa"
    }
};
const req = (0, index_1.default)(options);
req.then((response) => {
    console.log('Promise Mark ~~~~~~~~~~~~~~~~~~~~~~~~~~~');
    console.log(response.body);
    console.log('app run end!');
});
console.log('request run end!');
//# sourceMappingURL=test2.js.map