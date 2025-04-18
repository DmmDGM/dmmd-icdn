// Declares
declare global {
    // Declares environment variables
    namespace NodeJS {
        interface ProcessEnv {
            CONTENT_PATH?: string;
            STORE_PATH?: string;
            PORT?: string;
        }
    }
}

// Exports
export {};
