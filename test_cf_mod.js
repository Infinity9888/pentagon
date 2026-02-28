const https = require('https');
const options = {
    hostname: 'api.curseforge.com',
    path: '/v1/mods/1455485',
    headers: {
        'x-api-key': '$2a$10$ziByhBa8u9swU3XwBfWe9OGmtVx7vTFiWlM56Ja2fm8WUuE4m9xY2',
        'Accept': 'application/json'
    }
};
https.get(options, (res) => {
    let d = '';
    res.on('data', c => d += c);
    res.on('end', () => console.log(res.statusCode, d));
});
