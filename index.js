const WebSocket = require('ws');

const ws = new WebSocket("wss://stream.bybit.com/realtime");

ws.on(
    'open',
    () => ws.send(
        '{"op":"subscribe", "args": ["klineV2.1.BTCUSD"]}',
        () => console.log('connected')
    )
);

ws.on('message', (data) => console.log('message received:', data));