import * as fs from 'fs';
import * as mkdirp from 'mkdirp';
import * as path from 'path';

export const pathConfigServer = path.join(
  __dirname,
  '/euruspro/config/config-server.json',
); // Path for the file static config
export const pathConfigDevice = path.join(
  __dirname,
  '/euruspro/config/config-device.json',
); // Path for the file static config
export const pathResetServer = path.join(
  __dirname,
  '/config/reset/reset.json',
); // Path for the file static config

// export const pathConfigApp = path.join(
//   __dirname,
//   '/euruspro/config/config-app.json',
// ); // Path for the file static config
export const pathConfigInit = path.join(
  __dirname,
  '/euruspro/config/init-config.json',
); // Path for the file static config
// let existConfigFile = false

// read the config-app.json file in the path assets/config and load the setting
/*export function configApp() {
  if (!fs.existsSync(this.pathConfigApp)) {
    this.valFolder(this.pathConfigApp);
    fs.copyFileSync(
      path.join(__dirname, '/default-config-app.json'),
      this.pathConfigApp,
    );
  }
  return JSON.parse(fs.readFileSync(this.pathConfigApp, 'utf-8'));
}*/

// read the config-app.json file in the path assets/config and load the setting
export function configServer() {
  if (!fs.existsSync(this.pathConfigServer)) {
    this.valFolder(this.pathConfigServer);
    fs.copyFileSync(
      path.join(__dirname, '/config/default-config-server.json'),
      this.pathConfigServer,
    );
  }
  return JSON.parse(fs.readFileSync(this.pathConfigServer, 'utf-8'));
}

// read the config-app.json file in the path assets/config and load the setting
export function configDevice(): any {
  if (!fs.existsSync(this.pathConfigDevice)) {
    this.valFolder(this.pathConfigDevice);
    fs.copyFileSync(
      path.join(__dirname, '/config/default-config-device.json'),
      this.pathConfigDevice,
    );
  }
  return JSON.parse(fs.readFileSync(this.pathConfigDevice, 'utf-8'));
}

// Load Initial config defined in the file assets/config/init-config.json file
export function configInit() {
  if (!fs.existsSync(this.pathConfigInit)) {
    this.valFolder(this.pathConfigInit);
    fs.copyFileSync(
      path.join(__dirname, '/config/default-init-config.json'),
      this.pathConfigInit,
    );
  }

  return JSON.parse(fs.readFileSync(this.pathConfigInit, 'utf-8'));
}

export function restartServer() {
  if (!fs.existsSync(this.pathResetServer)) return 0;

  return JSON.parse(fs.readFileSync(this.pathResetServer, 'utf-8'));
}

// Refresh the config-app.json file from the Cloud server with app setting defined for this app
export function saveAsyncFileToJSON(data: any, pathFile: string) {
  fs.writeFileSync(pathFile, data);
}

// Refresh the config-app.json file from the Cloud server with app setting defined for this app
export function saveFileToJSON(data: any, pathFile: string) {
  fs.writeFile(pathFile, data, (e: any) => {
    if (e) {
      console.error(e);
    }
  });
}

export function valFolder(fileName: string) {
  let pathFile: string = '';
  const dir = path.parse(fileName);
  dir.dir.split(path.sep).forEach(item => {
    if (item.length > 0) {
      pathFile += pathFile.length > 0 ? path.sep + item : item;
      if (!fs.existsSync(pathFile)) {
        mkdirp(pathFile, err => {
          if (err) {
            console.error('FATAL ERROR TO TRY CREATED THE FOLDER:::', err);
          }
        });
      }
    }
  });
}
