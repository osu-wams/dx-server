import { createLogger, format, transports, config as winstonConfig } from 'winston';
import expressWinston, { LoggerOptionsWithTransports } from 'express-winston'; // eslint-disable-line no-unused-vars
import path from 'path';
import fs from 'fs';
import config from 'config';
import { Format } from 'logform'; // eslint-disable-line no-unused-vars

const ENV = config.get('env');
const LOG_DIR = path.join(__dirname, '../logs');

const { combine, timestamp, json } = format;

interface LoggerOptions {
  levels: winstonConfig.NpmConfigSetLevels;
  format: Format;
  transports?: Array<any>;
}
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR);
}

const loggerOptions: LoggerOptions = {
  levels: winstonConfig.npm.levels,
  format: combine(timestamp(), json())
};

if (ENV === 'development' || ENV === 'production') {
  loggerOptions.transports = [
    new transports.Console(),
    new transports.File({ filename: `${LOG_DIR}/${ENV}.log` })
  ];
} else {
  loggerOptions.transports = [new transports.File({ filename: `${LOG_DIR}/test.log` })];
}

export default createLogger(loggerOptions);

export const expressLogger = expressWinston.logger(loggerOptions as LoggerOptionsWithTransports);
