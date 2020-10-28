const mqtt = require('mqtt');

const MQTT_URL = `ws://localhost:3030`;
const clientNumber = 10;

go();

function go(number) {
  // let count = 0;
  for (let i = 0; i < (number || clientNumber); ++i) {
    const random6 = `${Math.random()}`.slice(2, 8);
    const randomId = `${random6}`;
    const client = mqtt.connect(MQTT_URL, {
      clientId: `${randomId}`,
      username: `${randomId}-username`,
      password: `${randomId}-password`,
    });
    client.on('connect', (connack) => {
      const topic = `test/${randomId}`;
      client.subscribe(topic, { qos: 0 }, function (err, granted) {
        if (err) {
          console.log('$ subscribe err', err);
        }
        console.log(`$ subscribed to ${topic}`);
      });
    });
    let isReceivedMsg = false;
    client.on('message', function (topic, payload) {
      console.log(`$ on message`, topic, payload);
      go(1);
    });
    setTimeout(() => {
      console.log(`$ didn't receive message, unable to publish`);
    }, 2000);
  }
}
