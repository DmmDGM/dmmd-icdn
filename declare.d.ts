// Declares
declare global {
    // Declares environment variables
    namespace NodeJS {
        interface ProcessEnv {
            CONTENT_PATH?: string;
            FILE_LIMIT?: string;
            PORT?: string;
            STORE_PATH?: string;
            TOKEN?: string;
        }
    }
}

// Exports
export {};
