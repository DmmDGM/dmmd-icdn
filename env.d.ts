// Declares
declare global {
    namespace NodeJS {
        interface ProcessEnv {
            CONTENT_PATH?: string;
            DATA_PATH?: string;
            PORT?: string;
        }
    }
}

// Exports
export {};
