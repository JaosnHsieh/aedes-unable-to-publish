const Socket = require('net');
const Http = require('http');
const WSServer = require('websocket-stream');
const mqemitter = require('mqemitter');
// mqemitter options same as aedes default but added console.log to this._messageQueue.length
const mq = mqemitter({
  concurrency: 1,
  matchEmptyLevels: true, // [MQTT-4.7.1-3]
});

const aedes = require('aedes')({
  mq,
});
const MQTT_PORT = 1800;
const WS_PORT = 3030;

aedes.on('publish', (publishPacket, client) => {
  console.log(`$ on publish`, publishPacket.topic, publishPacket.payload);
});

aedes.on('subscribe', (subscriptions, client) => {
  console.log(`$on subscribe from ${client.id}`, subscriptions);
  const topic = `test/${client.id}`;
  aedes.publish(
    {
      cmd: 'publish',
      qos: 0,
      topic: topic,
      payload: `${Math.random()}`,
      retain: false,
    },
    () => {},
  );
});

aedes.on('clientError', (...args) => {
  console.log(`$ clientError`, args);
});

aedes.on('connectionError', (...args) => {
  console.log(`$ connectionError`, args);
});

serverInit();

function serverInit() {
  const server = Socket.createServer(aedes.handle);
  const httpServer = Http.createServer();
  const ws = WSServer;

  server.listen(MQTT_PORT, () => {
    console.log(`MQTT Server is on port ${MQTT_PORT}`);
  });

  ws.createServer({ server: httpServer }, aedes.handle);

  httpServer.listen(WS_PORT, () => {
    console.log(`Websocket server is on ${WS_PORT}`);
  });
}
