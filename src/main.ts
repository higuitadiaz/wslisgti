import * as net from 'net';
import { initializeApp, credential, firestore } from 'firebase-admin';

// File support and help to app
import { configServer, configDevice, configInit, valFolder } from './config-app';
import { writeLog, writeJSONFile, writeJSONFileCustom, getFileNameToMonth } from './log-app';
import { convertTextColumnToJSON, convertASTMtoJSONOneCollection} from './convertEncoding';

// INITIAL FIREBASE CONFIG
import * as serviceAccount from '../sdk/euruspro-pro.json';
const sAccount = Object.create(serviceAccount, {});

initializeApp({
  credential: credential.cert(sAccount),
  databaseURL: 'https://euruspro.firebaseio.com',
});

// Starting config and refresh data from DB Remote
import { refreshData } from './config';
const sockets = [];

async function startServer() {

  valFolder('euruspro/config');
  valFolder('euruspro/data');
  valFolder('euruspro/log');
  // refreshData().then(() => {
  Object.keys(configDevice()).forEach( p => {
      console.log('Init port:', p);
      try {
        net.createServer(connHandler).listen(p, configServer().ip, () => {
          console.log(`START SERVER: TCP Server is listing with hostname ${configServer().ip} and Port ${p}`);
          writeLog(`START SERVER: TCP Server is listing with hostname ${configServer().ip} and Port ${p}`);
        });
      } catch (e) {
        console.log('ERROR:::', e);
      }
    });
  // });
}

function connHandler(socket) {
  writeLog(`CONNECTED|REMOTE ADDRESS: ${socket.remoteAddress}|REMOTEPORT:  ${socket.remotePort}`);
  console.log(`CONNECTED|REMOTE ADDRESS: ${socket.remoteAddress}|REMOTEPORT:  ${socket.remotePort}`);

  sockets.push(socket);
  socket.setEncoding('hex');
  socket.setMaxListeners(10);

  let buf = '';
  let msg = '';

  socket.on('data', (sock) => {
    const data = sock.toString().toUpperCase();

    // LOG of data sent by remote devices
    const fileNameSys =  String().concat(__dirname, getFileNameToMonth(configServer()['pathDataInputBackup']));
    writeJSONFileCustom(fileNameSys, '.log', false, data + '\n');

    // Key: unique value for each connection started with a remote device
    const key: string = String().concat(socket.localPort, firestore.Timestamp.now().seconds.toString());
    const deviceInfo: any = configDevice()[String(socket.localPort)];

    const record = {};
    let devConfig: any = {};

    // Configure the Devices Config Schema and load the structure in a const
    if (deviceInfo) {
      const config: any = deviceInfo.config;
      const cnfDev: any = {};
      config.forEach((v: any) => {
        cnfDev[String(v.title)] = v;
      });
      devConfig = cnfDev;
    }

    record[key.toString()] = {
      id: key,
      local: { address: socket.address(), port: socket.localPort},
      remote: { address: socket.remoteAddress, family: socket.remoteFamily, port: socket.remotePort},
      data: {},
    };

    if (data.startsWith(devConfig.Enquiry.value) || buf.startsWith(devConfig.Enquiry.value)) {
      buf += data;
      // console.log('BUF:::', buf);

      // Convert the String to a MAP of HEX code
      // const mapBlock: any[] = mapData(data);

      // Group all msg blocks in a just variable and first normalize the block
      // removing the all characters not ASCII

      console.log('Normalizing data...');
      // msg += normalizeBlock(data, devConfig, mapBlock);
      // console.log(msg);
      // console.log(data);

      if (buf.endsWith(devConfig.EndTransmission.value)) {
        console.log('End Transmition...');
        // const records = []
        record[key.toString()].data = buf;

        // BACKCODE - cnf_firebase.saveInRealtime(_datos, cnf_app.configInit().dataRootName)
        writeJSONFile(`${JSON.stringify(record)},\n`);

        let collection = {};
        if (devConfig.Protocol.value === 'ASTM') {
          collection = convertASTMtoJSONOneCollection(key, buf, devConfig, deviceInfo.setup);
        } else if (devConfig.Protocol.value === 'TEXT_COLUMN') {
          collection = convertTextColumnToJSON(key, buf, devConfig, deviceInfo.setup);
        }

        collection['remoteId'] = { address: socket.remoteAddress, family: socket.remoteFamily, port: socket.remotePort};
        collection['localId'] = { address: socket.localAddress, port: socket.localPort};
        // console.log(collection);

        // Save the data in the DataBase
        firestore()
          .collection(configInit().siteId + configInit().dataRootName)
          .doc(key)
          .set(collection)
          .catch(e => {
            writeLog(e);
          });

        buf = '';
        msg = '';
      }
    }

    const ackRequired: boolean = devConfig['AckRequired'].value || true;
    // console.log('AckReq:::', ackRequired);
    if (ackRequired) {
      const reply: string = devConfig['Acknowledge'].value || '06';
      const encoding: string = devConfig['Encoding'].value || 'HEX';
      // console.log('Ack info:', reply, encoding);
      socket.write(reply, encoding);
      // socket.pipe(socket);
    }
  });

  // socket.write('06');
  // socket.pipe(socket);
}

startServer().catch((e) => console.log('ERROR:', e));
