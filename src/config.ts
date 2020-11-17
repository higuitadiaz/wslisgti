import { firestore, database} from 'firebase-admin';

// MIDDLEWARE
import {
  saveFileToJSON,
  configInit,
  pathConfigServer,
  pathConfigDevice,
  pathResetServer,
  configServer, restartServer, saveAsyncFileToJSON,
} from './config-app';

// VARIABLES
// const pathSite = String().concat(configInit()['sitePath'], configInit().siteId);
// const pathServer = String().concat(configInit()['serverPath'], configInit().siteId, configInit().serverName);
const pathServer = String().concat(configInit()['serverPath']);
const pathDevice = String().concat(configInit()['devicesPath']);
const pathConfig = String().concat(configInit()['configPath']);
const pathSetup = String().concat(configInit()['setupPath']);

const mapDevices = new Map();
// const mapServer = new Map();

export async function refreshData() {
  // REFRESH SERVER INFO

  firestore().collection(pathServer)
    .where('name', '==', configInit().serverName)
    .limit(1)
    .get().then(snap => {
      snap.docs.forEach((d) => {
        const data = d.data();
        const doc = {
            id: d.id,
            extInputFile: data.extInputFile || '',
            extLogFile: data.extLogFile || '',
            ip: data.ip || '',
            name: data.name || '',
            pathDataConfig: data.pathDataConfig || '',
            pathDataInput: data.pathDataInput || '',
            pathDataInputBackup: data.pathDataInputBackup || '',
            pathErrorLog: data.pathErrorLog || '',
          };
          // mapServer.set(d.id, doc);

        saveFileToJSON(JSON.stringify(doc), pathConfigServer);
      });

      // mapServer.forEach(item => {
      //   saveFileToJSON(JSON.stringify(item), pathConfigServer);
      // });
    }).catch((err => {
      console.log(err);
  }));

  // REFRESH DEVICES INFO
  console.log(pathDevice);
  await firestore().collection(pathDevice)
    .onSnapshot((snap: any) => {
      snap.docChanges().forEach((d: any) => {
        if (d.type === 'added' || d.type === 'modified') {
          const data = d.doc.data();
          data.id = d.doc.id;
          mapDevices.set(d.doc.id, data);
        } else if (d.type === 'removed') {
          mapDevices.delete(d.doc.id);
        }
        const timeRestart = restartServer().time || 0;
        const timeNow = Date.now();
        console.log(timeNow, timeRestart, ((timeNow - timeRestart)));
        if ((timeNow - timeRestart) > 100000) {
          console.log('Restart Server');
          saveAsyncFileToJSON(JSON.stringify({time: Date.now()}), pathResetServer);
        }
      });
      const devicesList = {};
      let i = 0;
      mapDevices.forEach(async (item: any, k) => {
        const docRef = firestore().collection(pathDevice).doc(k);
        await firestore().collection(pathConfig)
          .where('deviceId', '==', docRef)
          .get()
          .then(docs => {
            const cnf: any[] = [];
            docs.docs.forEach(d => {
              cnf.push(d.data());
            });

            item['config'] = cnf;
          });

        await firestore().collection(pathSetup)
          .where('deviceId', '==', docRef)
          .get()
          .then(docs => {
            const cnf: any[] = [];
            docs.docs.forEach(d => {
              cnf.push(d.data());
            });
            item['setup'] = cnf;
          });

        i++;
        devicesList[item.port] = item;
        if (i === mapDevices.size) {
          console.log('DEVICES UPDATED');
          saveFileToJSON(JSON.stringify(devicesList), pathConfigDevice);
        }
      });

      // saveFileToJSON(JSON.stringify(devicesList), pathConfigDevice);
    });
}
