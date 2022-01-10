import request from "./index";

const options = {
    // url: 'https://images.pexels.com/photos/209339/pexels-photo-209339.jpeg?cs=srgb&dl=pexels-pixabay-209339.jpg&fm=jpg',
    url: 'http://49.232.205.124:8001/v2/signout',

    // hostname: '49.232.205.124',
    // port: 8001,
    // path: '/v2/signout',
    method: 'GET',
    // headers: {
    //     'Content-Type': 'application/json',
    // }
    isStream: false,  // true 通过监听data事件获取body内容 false 通过Promise的then返回body内容 默认false
    body: { // 请求体

    }
};

const req = request(options) as Promise<any>;



req.then((response) => {
    console.log('Promise Mark ~~~~~~~~~~~~~~~~~~~~~~~~~~~');
    // console.log(response);
    console.log(response.body);
});


// setTimeout(() => {
//     console.log('setTimeout request run end!');
// }, 60000);

console.log('request run end!');
