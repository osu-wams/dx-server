import winston, { createLogger, format, transports, config as winstonConfig } from 'winston'; // eslint-disable-line no-unused-vars
import expressWinston, { LoggerOptionsWithTransports } from 'express-winston'; // eslint-disable-line no-unused-vars
import path from 'path';
import fs from 'fs';
import config from 'config';
import { Format } from 'logform'; // eslint-disable-line no-unused-vars
import { Request, Response, NextFunction } from 'express'; // eslint-disable-line no-unused-vars

const ENV = config.get('env');
const LOG_LEVEL: string = config.get('logLevel');
const LOG_DIR = path.join(__dirname, '../logs');
const { combine, timestamp, json } = format;

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR);
}

interface LoggerOptions {
  level: string;
  levels: winstonConfig.NpmConfigSetLevels;
  format: Format;
  transports?: Array<any>;
  dynamicMeta?: any;
}

/* eslint-disable no-unused-vars */
const loggerOptions: LoggerOptions = {
  level: LOG_LEVEL,
  levels: winstonConfig.npm.levels,
  format: combine(timestamp(), json()),
  dynamicMeta: (req, res, err) => ({ sessionID: req.session.id }),
};
/* eslint-enable no-unused-vars */

if (ENV === 'test') {
  loggerOptions.transports = [
    new transports.File({ level: LOG_LEVEL, filename: `${LOG_DIR}/test.log` }),
  ];
} else {
  loggerOptions.transports = [
    new transports.Console({ level: LOG_LEVEL }),
    new transports.File({ level: LOG_LEVEL, filename: `${LOG_DIR}/${ENV}.log` }),
  ];
}

/**
 * A simple Logger class to handle providing an applicaton-wide session child logger.
 */
class Logger {
  parentLogger: winston.Logger;

  sessionLogger: winston.Logger;

  /**
   * Initialize a new instance of the Logger class
   * @param {winston.Logger} l The parent logger
   */
  constructor(l: winston.Logger) {
    this.parentLogger = l;
  }

  /**
   * Create a child logger that includes the requests session id in its meta data
   *
   * @memberof Logger
   * @param {Request} req The current HTTP request with a session
   */
  setSessionLogger = (req: Request) => {
    this.sessionLogger = this.parentLogger.child({ sessionID: req.session?.id });
  };
}

// A logger to use by the Express middleware for basic request/response logging
export const expressLogger = expressWinston.logger(loggerOptions as LoggerOptionsWithTransports);

const myLogger = new Logger(createLogger(loggerOptions as winston.LoggerOptions));

/**
 * Create and set the session logger for this request.
 * @param {Request} req The current HTTP request
 * @param {Response} res The current HTTP response
 * @param {NextFunction} next Express middleware pass execution to the next function
 */
export const sessionLogger = (req: Request, res: Response, next: NextFunction) => {
  myLogger.setSessionLogger(req);
  next();
};

/**
 * Return the current logger for the application to use, defaulting to the
 * parent logger if a session logger hasn't been set yet.
 */
export const appLogger = () => {
  if (!myLogger.sessionLogger) return myLogger.parentLogger;
  return myLogger.sessionLogger;
};

export default appLogger;
