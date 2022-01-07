import request from "./index";


const options = {
    // url: 'http://49.232.205.124:8001/v2/signout'
    hostname: '49.232.205.124',
    port: 8001,
    path: '/v2/signout',
    method: 'GET',
    // headers: {
    //     'Content-Type': 'application/json',
    // }
};

request(options, (param) => {
    console.log(param);
});


setTimeout(() => {
    console.log('setTimeout request run end!');
}, 60000);

console.log('request run end!');
