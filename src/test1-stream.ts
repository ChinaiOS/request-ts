import request from "./index";
import * as fse from 'fs-extra';
import { promisify } from 'node:util';
import * as stream from 'node:stream';


const options = {
    // url: 'https://images.pexels.com/photos/209339/pexels-photo-209339.jpeg?cs=srgb&dl=pexels-pixabay-209339.jpg&fm=jpg',
    // url: 'https://t7.baidu.com/it/u=2604797219,1573897854&fm=193&f=GIF',
    // url: 'https://t7.baidu.com/it/u=3165657288,4248157545&fm=193&f=GIF',

    // url: 'https://11111-1252105172.cos.ap-shanghai.myqcloud.com/Libuv%E6%BA%90%E7%A0%81%E5%88%86%E6%9E%90v0.0.1.pdf',
    // url:'https://11111-1252105172.cos.ap-shanghai.myqcloud.com/understand-nodejs%EF%BC%88%E5%B8%A6%E6%A0%87%E7%AD%BE%E7%89%88%EF%BC%89.pdf',
    // url: 'http://49.232.205.124:8001/v2/signout',

    // hostname: '49.232.205.124',
    // port: 8001,
    // path: '/v2/signout',
    // method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    myPath:`C:\\Users\\Pete\\Pictures\\111-3-${Date.now()}.exe`,
    timeout: 50000,
    isStream: true,  // true 通过监听data事件获取body内容 false 通过Promise的then返回body内容 默认false
    json: { // 请求体
        gray_id: "sadasdghjasdhjgasdhjas",
        pkgs: ["v2"],
        channel: "qa"
    }
};

const pipeline = promisify(stream.pipeline);

const req: any = request(options);

// const date = Date.now();

const path = `C:\\Users\\Pete\\Pictures\\1122-1636780.exe`;

fse.ensureFileSync(path);
const writeStream = fse.createWriteStream(path, {
    start: 0,
    flags: 'a+',
    autoDestroy: true,
});

pipeline(
	req,
	writeStream
);

// req.pipe(writeStream);

req.on('downloadProgress', (progress) => {
    // console.log('qqqqqqqqqqqqq');
    console.log(progress.percent);

    console.log(progress.transferred);
    console.log(progress.total);

    // transferred: this._downloadedSize,
    // total: this._responseSize,
});

req.on('response', (response) => {
    console.log('Promise Mark ~~~~~~~~~~~~~~~~~~~~~~~~~~~');

    console.log(response.body);

    // console.log(response);
    // console.log(response);
    // console.log(`~~~~~~~~~~~ ${response.body} ~~~~~~~~~~~~~`);

    // response.on('response', (res) => {

    // });


    console.log('app run end!');

    // console.log(response.body);

    // const body = JSON.parse(response.body);
    // console.log('444444422333');
    // console.log(body);

    // console.log(response.start_time);

});
console.log('request run end!');
