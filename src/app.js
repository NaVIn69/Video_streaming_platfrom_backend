import express from 'express';
import logger from './config/logger.js';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.send('Health Check Passed');
});

app.use((err, req, res, next) => {
    logger.error(err.message);
    const statusCode = err.statusCode;
    res.status(statusCode).json({
        errors: [
            {
                type: err.name,
                msg: err.message,
                path: '',
                location: '',
            },
        ],
    });
});

export default app;
