import app from './app.js';
import logger from './config/logger.js';
import { Config } from './config/index.js';

const StartServer = async () => {
    try {
        const PORT = Number(Config.PORT);
        app.listen(PORT, () => {
            logger.info(`server is running on port ${PORT}`);
        });
    } catch (error) {
        logger.info(error);
        console.log(error);
        process.exit(1);
    }
};

StartServer()
    .then(() => {
        console.log('Server started successfully');
    })
    .catch((error) => {
        console.log(error);
        throw error;
    });
