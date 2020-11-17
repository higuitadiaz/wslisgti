import * as fs from 'fs';
import * as path from 'path';
import { configServer, valFolder } from './config-app';
let dateNow;
let fileNameSys;

// Save the log in the external file
export function writeLog(message: string) {
  dateNow = new Date();
  fileNameSys = path.join(
    __dirname,
    String().concat(this.getFileNameToMonth(configServer()['pathErrorLog']), configServer()['extLogFile']),
  );

  fs.appendFile(
    fileNameSys,
    `${dateNow.toLocaleDateString()}|${dateNow.toLocaleTimeString()}|${message.toString()}\n`,
    (error) => {
      if (error) {
        console.error(error);
        valFolder(fileNameSys);
      }
    });
}

// Save the log in the external file
export function info(message) {
  dateNow = new Date();
  fileNameSys = 'console.log';

  fs.appendFile(fileNameSys, `${dateNow.toLocaleDateString()}|${dateNow.toLocaleTimeString()}|${message}\n`,
    (error) => {
      if (error) {
        console.log(error);
        valFolder(fileNameSys);
      }
    });
}

// Save log in a Custom Path and Custom extension file
export function writeLogCustom(fileName: string, extFile: string, byMonth: boolean = false, message: string) {
  dateNow = new Date();
  if (byMonth) {
    fileNameSys = String().concat(this.getFileNameToMonth(fileName), extFile);
  } else {
    fileNameSys = String().concat(fileName, extFile);
  }

  fs.appendFile(fileNameSys, `${dateNow.toLocaleDateString()}|${dateNow.toLocaleTimeString()}|${message.toString()}\n`,
    (error) => {
    if (error) {
      console.log(error);
      valFolder(fileNameSys);
    }
  });
}

// Save the data sent to the LIS Server with default setting
export function writeJSONFile(message) {
  fileNameSys =  String().concat(__dirname, this.getFileNameToMonth(configServer()['pathDataInput']));
  const extFile =  configServer()['extInputFile'];

  fs.appendFile(String().concat(fileNameSys, extFile), message, (error) => {
    if (error) {
      console.error(error);
      valFolder(fileNameSys);
    }
  });
}

// Save the data sent to the LIS Server with custom Path and Extension file
export function writeJSONFileCustom(fileName: string, extFile: string, byMonth: boolean = false, message: string) {
  fileNameSys = byMonth ? this.getFileNameToMonth(fileName) : fileName;

  fs.appendFile(String().concat(fileNameSys, extFile), message,
    (error) => {
      if (error) {
        console.error(error);
        valFolder(fileNameSys);
      }
    });
}

// Add to the path the Year and Month number
export function getFileNameToMonth(pathFileName: string): string {
  if (!pathFileName) {
    return '/undefined/server-log.log';
  }

  let fileName: string;
  dateNow = new Date();

  if (pathFileName.includes('.')) {
    const fileDate = String().concat('_', dateNow.getFullYear().toString(), String(dateNow.getMonth() + 1), '.');
    fileName = pathFileName.replace('.', fileDate);
  } else {
    fileName = String().concat(pathFileName, '_', dateNow.getFullYear().toString(), String(dateNow.getMonth() + 1));
  }

  return fileName;
}
