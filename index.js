require('dotenv').config();
const crypto = require('crypto');
const WebSocket = require('ws');
const axios = require('axios');
const tulind = require('tulind');

const ws = new WebSocket('wss://stream.bybit.com/realtime');

const opens = [];
const highs = [];
const lows = [];
const closes = [];
const volumes = [];
const ends = [];

(async () => {
    let timestamp;

    const res = await axios.get('https://api.bybit.com/v2/public/time');
    console.log('res.data.time_now:', res.data.time_now);
    timestamp = Number(res.data.time_now.split('.').join('').slice(0, -3));

    console.log('timestamp:', timestamp);

    const apiKey = process.env.ApiApiPrivateKey;
    const secret = process.env.ApiPrivateKey;
    const baseParams = {
        timestamp,
        api_key: apiKey,
    };

    const getSignature = (parameters, secret) => {
        let orderedParams = '';
        
        Object.keys(parameters).sort().forEach(function(key) {
        orderedParams += key + '=' + parameters[key] + '&';
        });
        
        orderedParams = orderedParams.substring(0, orderedParams.length - 1);

        return crypto.createHmac('sha256', secret).update(orderedParams).digest('hex');
    };

    const walletBalanceParams = JSON.parse(JSON.stringify(baseParams));
    walletBalanceParams.coin = 'BTC';
    const walletBalanceSignature = getSignature(walletBalanceParams, secret);

    axios.get(`https://api.bybit.com/v2/private/wallet/balance?api_key=${apiKey}&coin=BTC&timestamp=${timestamp}&sign=${walletBalanceSignature}`)
        .then(res => console.log('wallet data:', res.data));
        
    axios.get(`https://api.bybit.com/v2/public/kline/list?symbol=BTCUSD&interval=240&from=1584734400`)
        .then(res => console.log('4h kline data:', res.data));

    // const createOrderParams = JSON.parse(JSON.stringify(baseParams));
    // createOrderParams.symbol = 'BTCUSD';
    // createOrderParams.side = 'Buy';
    // createOrderParams.order_type = 'Market';
    // createOrderParams.qty = 1;
    // createOrderParams.time_in_force = 'GoodTillCancel';
    // // createOrderParams.price = 10000;
    // createOrderParams.sign = getSignature(createOrderParams, secret);

    // axios.post(
    //     `https://api.bybit.com/v2/private/order/create`,
    //     createOrderParams
    // )
    //     .then(res => console.log('submit order data:', res.data))
    //     .catch(err => console.log('submit order error:', err));

    // const createStopOrderParams = JSON.parse(JSON.stringify(baseParams));
    // createStopOrderParams.symbol = 'BTCUSD';
    // createStopOrderParams.side = 'Sell';
    // createStopOrderParams.order_type = 'Market';
    // createStopOrderParams.qty = 1;
    // createStopOrderParams.base_price = 20000;
    // createStopOrderParams.stop_px = 19999;
    // createStopOrderParams.time_in_force = 'GoodTillCancel';
    // createStopOrderParams.close_on_trigger = true;
    // createStopOrderParams.sign = getSignature(createStopOrderParams, secret);

    // axios.post(
    //     `https://api.bybit.com/v2/private/stop-order/create`,
    //     createStopOrderParams
    // )
    //     .then(res => console.log('submit order data:', res.data))
    //     .catch(err => console.log('submit order error:', err));

    ws.on(
        'open',
        () => {
            console.log('websocket connected');

            pingInterval = setInterval(() => ws.send('{"op":"ping"}'), 30000);

            // const expires = Date.now() + 1000;

            // const klineSocketParams = JSON.parse(JSON.stringify(baseParams));
            // klineSocketParams.symbol = 'BTCUSD';
            // const klineSocketSignature = getSignature(klineSocketParams, secret);

            // ws.send(`{"op":"auth","args":["${process.env.ApiPrivateKey}","${expires}","${klineSocketSignature}"]}`);

            ws.send('{"op":"subscribe", "args": ["klineV2.1.BTCUSD"]}');
        }
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
            } else {
                console.log('message:', message);
            }
        }
    );
})();