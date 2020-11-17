import { writeLog } from './log-app';

export function normalizeBlock(dataSource: string, config: any, mData: any[] ) {
  const data = dataSource.toString();
  let result = '';
  let pos = 0;

  console.log('Data:', data);
  // Removing Enquiry Code
  if (data.startsWith(config.Enquiry.value)) {
    if (config.Enquiry.omitNext) {
      result += data.substring(config.Enquiry.value.length + 2, data.length);
      pos = pos + 4;
    } else {
      result += data.substring(config.Enquiry.value.length, data.length);
      pos = pos + 2;
    }
  } else {
    result = data;
  }

  // console.log('Result::', result);
  if (result.startsWith(config.StartText.value)) {
    if (config.StartText.omitNext) {
      result = result.substring(config.StartText.value.length + 2, result.length);
      pos = pos + 4;
    } else {
      result = result.substring(config.StartText.value.length, result.length);
      pos = pos + 2;
    }
  }

  // console.log('MAP DATA:', mData);
  console.log(mData.includes(config['EndBlock'].value));
  if (mData.includes(config['EndBlock'].value)) {
    result = result.substring(0, (mData.indexOf(config['EndBlock'].value) * 2) - pos);
  }
  if (mData.includes(config['EndText'].value)) {
    result = result.substring(0, (mData.indexOf(config['EndText'].value) * 2) - pos);
  }
  // if (mData.includes(config.LineFeed.value)) {
    // result = result.substring(0, result.search(config.LineFeed.value));
  // } else {
    // result = result.substring(0, result.length);
  // }

  console.log('FINAL Result::', result);
  return result;
}

export function normalizeTextPlan(dataSource = '', devConfig: any = {}) {
  const data = dataSource.toString();
  let result = '';
  // let pos = 2;

  if (data.startsWith(devConfig.StartText.value)) {
    if (devConfig.StartText.omitNext) {
      result += data.substring(devConfig.StartText.value.length + 2, data.length);
    } else {
      result += data.substring(devConfig.StartText.value.length, data.length);
    }
  }

  return result;
}

export function convertASTMtoJSONOneCollection(key, dataSource = '', devConfig: any = {}, setup) {
  const setupReadDoc = new Map();

  // BACKCODE
  Object.keys(setup).forEach(v => {
    setupReadDoc.set(String(setup[v].key), setup[v]);
  });

  const headMap = new Map();
  const bodyMap = new Map();
  const arrayDoc = [];

  bodyMap.clear();

  // Separar cadena/documento en lineas o parrafos segun configuracion
  // Almacenar la linea en un Array
  dataSource.split(devConfig.CarriageReturn.value).forEach(
    (item) => {
      item.split(devConfig.LineFeed.value).forEach(line => {
        if (line.length > 0) {
          // Convert the String to a MAP of HEX code
          const mapBlock: any[] = mapData(line);
          const msg = normalizeBlock(line, devConfig, mapBlock);
          arrayDoc.push(msg.split(devConfig.LineSeparator.value));
        }
      });
    });

  // Variable to group fields' names and fields' values
  let mainCollection = {};

  // Recorrer Array con cada linea
  arrayDoc.forEach((a, b) => {
    let subCollection = true;
    const param = Object.assign({}, setupReadDoc.get(a[0]));

    if (param.hasOwnProperty('collectionName')) {
      if (param.collectionName !== '') {
        mainCollection = createCollection(key, a, param);
        subCollection = false;
      }
    }

    // If the Row in the Array is not checked as a Collection, then
    // build a sub-document and later is added to Main Collection
    if (subCollection) {
      headMap.set(String().concat(param.name, b.toString()), param.name);

      // Agrupando campos
      const subFields = {};

      a.forEach((v, k) => {
        if (param[k]) {
          const r = convertHexToAscii(v);
          subFields[param[k]] = r.replace('\\', '');
        }
      });

      // console.log('LINE:::', subFields);
      // console.log('NAME PARM:::', param.name, b.toString())
      bodyMap.set(String().concat(param.name, b.toString()), subFields);
    }
  });

  // BUILDING DOCUMENT BODY
  const groupLine = new Map();
  groupLine.clear();
  bodyMap.forEach((a, b) => {
    const objKey = headMap.get(b);
    let value = [];

    if (groupLine.has(objKey)) {
      value = groupLine.get(objKey);
      value.push(a);
    } else {
      value.push(a);
    }

    if (objKey) {
      // console.log('CLAVE:::', objKey, 'VALOR:::', value)
      groupLine.set(objKey, value);
    }
  });

  // BUILDING DOCUMENT & DEFINITION OF RELATIONSHIP BETWEEN PARENT AND CHILD DOC
  groupLine.forEach((v, k) => {
    mainCollection[k] = Object.assign(v);
  });

  return mainCollection;
}

export function convertASTMToJSONManyCollection(dataSource, key, docSetting, setup) {
  const setupReadDoc = new Map();
  Object.keys(setup).forEach(v => {
    setupReadDoc.set(String(setup[v].key), setup[v]);
  });

  // Borrar Cacracteres de inicio y fin de documento
  if (docSetting.clearMsgStart && dataSource.startsWith(docSetting.startMsg)) {
    dataSource = dataSource.slice(docSetting.startMsg.length, (0 - docSetting.startMsg.length));
  }

  if (docSetting.clearMsgEnd && dataSource.endsWith(docSetting.endMsg)) {
    dataSource = dataSource.slice((dataSource.length - 1), (0 - docSetting.endMsg.length));
  }

  const headMap = new Map();
  const bodyMap = new Map();
  const scheme  = new Set();
  const arrayDoc = [];

  // console.log(dataSource)
  // Separar cadena/documento en lineas o parrafallos segun configuracion
  // Almacenar la linea en un Array
  dataSource.split(docSetting.lineBreak).forEach(
    (item) => {
      let line = item;
      if (item.length > 0) {

        if (docSetting.clearLineStart && item.startsWith(String(docSetting.startLine || '---'))) {
          line = item.slice(docSetting.startLine.length, (0 - docSetting.startLine.length));
        }

        if (docSetting.clearLineEnd && item.endsWith(docSetting.endLine)) {
          line = item.slice(item.length, (0 - docSetting.endLine.length));
        }

        arrayDoc.push(line.split(docSetting.lineSplit));
      }
    });

  // Recorrer Array con cada linea
  arrayDoc.forEach((a, b) => {
    try {
      if (setupReadDoc.get(a[0]).collectionName) {
        const param = setupReadDoc.get(a[0]);
        headMap.set(String().concat(param.collectionName, b.toString()), param.collectionName);
        scheme.add(param.collectionName);

        // Agrupando campos
        let subFields = '';
        if (setupReadDoc.get(a[0]).parentId === 'true') {
          subFields = `"id": "${key}",`;
        } else {
          subFields = `"parentId": "${key}",`;
        }
        a.forEach((x, y, z) => {
          if (param[y]) {
            const r = convertHexToAscii(x);
            subFields += ` "${param[y]}": "${r.replace('\\', '')}",`;
          }
        });
        if (subFields.endsWith(',')) {
          subFields = subFields.slice(0, subFields.length - 1);
        }
        subFields = `{${subFields}}`;

        // console.log('LINE:::', subFields)
        bodyMap.set(String().concat(param.collectionName, b.toString()), subFields);

      }
    } catch (e) {
      writeLog(`No fue posible interpretar la linea ${b} porque no se encontro Collection o no esta definida. ERROR: ${e}`);
    }
  });

  // BUILDING DOCUMENT BODY
  const groupLine = new Map();
  bodyMap.forEach((a, b) => {
    const clave = headMap.get(b);
    let valor = '';
    if (groupLine.has(clave)) {
      valor = String().concat(groupLine.get(clave), ',', a);
    } else {
      valor = a;
    }
    groupLine.set(clave, valor);
  });

  // BUILDING DOCUMENT & DEFINITION OF RELATIONSHIP BETWEEN PARENT AND CHILD DOC
  const docBody = new Map();

  groupLine.forEach((a, b) => {
    docBody.set(b, `[${a}]`);
  });

  return docBody;
}

export function convertTextColumnToJSON(key, dataSource = '', devConfig: any = {}, setup) {
  const setupReadDoc = new Map();
  // BACKCODE
  Object.keys(setup).forEach(v => {
    setupReadDoc.set(String(setup[v].key), setup[v]);
  });

  // let headMap = new Map()
  const bodyMap = new Map();
  const arrayDoc = [];

  bodyMap.clear();

  // Separar cadena/documento en lineas o parrafos segun configuracion
  // Almacenar la linea en un Array
  dataSource.split(devConfig.CarriageReturn.value).forEach(
    (item) => {
      if (item.length > 0) {
        arrayDoc.push(item.split(devConfig.LineSeparator.value));
      }
    });

  // Variable to group fields' names and fields' values
  const mainCollection = {};

  // Recorrer Array con cada linea
  arrayDoc.forEach((a, b) => {
    // let subCollection = true;
    // console.log('INDEX::', b, a);
    const param: any = setupReadDoc.get(String(b));
    // console.log('PARAM:::', param);

    if (!param) {
      return;
    }

    if (param) {
      const separator: string = param['separator'] || '|';
      const resultConverted = extractValue(a[0], (param['result'] || '0'), separator);

      if (param.hasOwnProperty('collectionName')) {
        if (param.collectionName === '') {
          mainCollection[param['label']] = resultConverted;
          Object.keys(param).forEach( (label: string) => {
            if (label.startsWith('field_')) {
              const fieldConfig: any[] = String(param[label]).split(separator);
              const fieldName =  fieldConfig[0] || 'unknown';
              const rangeFrom =  fieldConfig[1] || 0;
              const rangeTo =  fieldConfig[2] || 0;
              mainCollection[fieldName] = getValueText(a[0], rangeFrom, rangeTo);
            }
          });
        } else {
          let arrayCol = [];
          if (mainCollection.hasOwnProperty(param.collectionName)) {
            arrayCol = mainCollection[param.collectionName];
          }

          const mapFields = new Map();
          Object.keys(param).forEach( (label: string) => {
            if (label.startsWith('field_')) {
              const fieldConfig: any[] = String(param[label]).split(separator);
              const fieldName =  fieldConfig[0] || 'unknown';
              const rangeFrom =  fieldConfig[1] || 0;
              const rangeTo =  fieldConfig[2] || 0;
              const value = getValueText(a[0], rangeFrom, rangeTo);
              mapFields.set(fieldName, value);
            }
          });
          const record = {};
          mapFields.forEach((v, k) => {
            record[k] = v;
          });

          arrayCol.push(record);
          mainCollection[param.collectionName] = arrayCol;
        }
      }
    }

  });

  mainCollection['createdDate'] = new Date(Date.now()).toISOString();
  mainCollection['lastModifiedDate'] = new Date(Date.now()).toISOString();
  mainCollection['createdBy'] = '';
  // console.log(mainCollection);
  return mainCollection;
}

export function convertToAscii(dataSource: string = '') {
  return convertHexToAscii(dataSource);
}

export function mapData(data) {
  const mdata = [];
  for (let i = 0; i < data.length - 1; i += 2) {
    mdata.push(data.substring(i, i + 2));
  }
  return mdata;
}

function extractValue(data: string, value: string, separator: string): string {
  const v: string = String(value);
  let result: string = '';

  if (v.includes(separator)) {
    const arrayValues: any[] = v.split(separator);
    const newValue: string = data.substring(Number(arrayValues[0]), Number(arrayValues[1]));

    result = String(convertHexToAscii(newValue)).trim();
  }

  return result;
}

function getValueText(data: string, startPos: number, endPos: number): string {
  const newValue: string = data.substring(Number(startPos), Number(endPos));
  return String(convertHexToAscii(newValue)).trim();
}

function createCollection(key: string, data: [], param: any) {
  const collection: any = {};

  // Define id for the Record
  if (key) { collection['id'] = key; }

  // Tour the Array with all value by Line
  // v = Value & k = Key
  // Convert the value to UTF-8 Encoding
  data.forEach((v, k) => {
    if (param[k]) {
      const r = convertHexToAscii(v);
      collection[param[k]] = r.replace('\\', '');
    }
  });

  collection['createdDate'] = new Date(Date.now()).toISOString();
  collection['lastModifiedDate'] = new Date(Date.now()).toISOString();
  collection['createdBy'] = '';

  return collection;
}

function convertHexToUTF8(cadena: string) {
  // console.log('CADENA::', cadena);
  return decodeURIComponent(cadena.toString().replace(/[0-9a-fA-F]{2}/g, '%$&'));
}

function convertHexToAscii(hex: string) {
  let str: string = '';
  for (let n: number = 0; n < hex.length; n += 2) {
    str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
  }
  return str;
}
