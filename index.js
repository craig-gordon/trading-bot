const WebSocket = require('ws');
const tulind = require('tulind');

console.log(tulind.indicators.rsi);

const ws = new WebSocket("wss://stream.bybit.com/realtime");

const opens = [];
const highs = [];
const lows = [];
const closes = [];
const volumes = [];
const ends = [];

ws.on(
    'open',
    () => ws.send(
        '{"op":"subscribe", "args": ["klineV2.1.BTCUSD"]}',
        () => console.log('connected')
    )
);

ws.on(
    'message',
    (msg) => {
        const message = JSON.parse(msg);
        if (message.topic && message.topic.includes('klineV2.1')) {
            const data = message.data[0];

            if (data.confirm) {
                const start = new Date(data.start * 1000);
                const end = new Date(data.end * 1000);
                const open = data.open;
                const close = data.close;
                const high = data.high;
                const low = data.low;
                const volume = data.volume;

                console.log('start:', start);
                console.log('end:', end);
                console.log('open:', open);
                console.log('close:', close);
                console.log('high:', high);
                console.log('low:', low);
                console.log('volume:', volume);

                if (ends.length === 0 || end > ends[ends.length - 1])
                {
                    ends.push(end);
                    opens.push(open);
                    highs.push(high);
                    lows.push(low);
                    closes.push(close);
                    volumes.push(volume);

                    tulind.indicators.rsi.indicator([closes], [14], (err, results) => console.log('RSI value:', results[0], results[1]))
                }
            }
        }
    }
);