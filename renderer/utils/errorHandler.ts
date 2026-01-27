import type { Plugin } from "vue";
import logger from "./logger";

export const errorHandler: Plugin = function install(app) {
    app.config.errorHandler = (err, instance, info) => {
        logger.error('Vue error:', err, instance, info);
    }

    window.onerror = (msg, url, line, col, error) => {
        logger.error('Global error:', msg, url, line, col, error);
    }

    window.onunhandledrejection = (event) => {
        logger.error('Unhandled Promise Rejection:', event);
    }

}

export default errorHandler;