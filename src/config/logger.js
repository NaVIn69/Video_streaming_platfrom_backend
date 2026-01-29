import winston from 'winston';
import { Config } from './index.js';

const logger = winston.createLogger({
    level: 'info',
    defaultMeta: {
        serviceName: 'video-streaming-service',
    },
    transports: [
        // adding new logger
        new winston.transports.File({
            level: 'info',
            dirname: 'logs',
            filename: 'combined.log',
            format: winston.format.combine(
                winston.format.timestamp({
                    format: 'DD-MM-YYYY HH:mm:ss',
                }),
                winston.format.json(),
                winston.format.prettyPrint(),
            ),
            silent: Config.NODE_ENV == 'test',
        }),
        new winston.transports.File({
            level: 'error',
            dirname: 'logs',
            filename: 'error.log',
            format: winston.format.combine(
                winston.format.timestamp({
                    format: 'DD-MM-YYYY HH:mm:ss',
                }),
                winston.format.json(),
                winston.format.prettyPrint(),
            ),
            silent: Config.NODE_ENV == 'test',
        }),
        new winston.transports.Console({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp({
                    format: 'DD-MM-YYYY HH:mm:ss',
                }),
                winston.format.json(),
                winston.format.prettyPrint(),
            ),
            silent: Config.NODE_ENV == 'test',
        }),
    ],
});

export default logger;
