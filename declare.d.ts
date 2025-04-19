// Declares
declare global {
    // Declares environment variables
    namespace NodeJS {
        interface ProcessEnv {
            CONTENTS_PATH?: string;
            FILE_LIMIT?: string;
            PORT?: string;
            STORE_LIMIT?: string;
            STORE_PATH?: string;
            TOKEN?: string;
        }
    }
}

// Exports
export {};
