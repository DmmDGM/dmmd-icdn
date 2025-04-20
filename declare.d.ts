// Declares
declare global {
    // Declares environment variables
    namespace NodeJS {
        interface ProcessEnv {
            DEBUG?: string;
            FILE_LIMIT?: string;
            FILES_PATH?: string;
            PORT?: string;
            STORE_LIMIT?: string;
            STORE_PATH?: string;
            TOKEN?: string;
        }
    }
}

// Exports
export {};
