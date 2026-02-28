const nbt = require('prismarine-nbt');
const fs = require('fs');

async function test() {
    try {
        const parsedNbt = {
            type: 'compound',
            name: '',
            value: {
                servers: {
                    type: 'list',
                    value: {
                        type: 'compound',
                        value: [
                            {
                                name: { type: 'string', value: 'Test Server' },
                                ip: { type: 'string', value: '127.0.0.1' },
                                icon: { type: 'string', value: '' }
                            }
                        ]
                    }
                }
            }
        };

        const outBuffer = nbt.writeUncompressed(parsedNbt);
        fs.writeFileSync('test_servers.dat', outBuffer);

        const readBuf = fs.readFileSync('test_servers.dat');
        const parsed = await nbt.parse(readBuf);
        console.log("Success!", JSON.stringify(parsed, null, 2));
    } catch (e) {
        console.error("Error:", e.message, e);
    }
}

test();
