// Defines exception codes enum
export enum Code {
    BAD_FILE = "BAD_FILE",
    BAD_JSON = "BAD_JSON",
    INVALID_DATA = "INVALID_DATA",
    INVALID_NAME = "INVALID_NAME",
    INVALID_TAGS = "INVALID_TAGS",
    INVALID_TIME = "INVALID_TOKEN",
    INVALID_TOKEN = "INVALID_TOKEN",
    INVALID_UUID = "INVALID_UUID",
    LARGE_SOURCE = "LARGE_SOURCE",
    MISSING_ASSET = "MISSING_ASSET",
    MISSING_CONTENT = "MISSING_CONTENT",
    MISSING_RESOURCE = "MISSING_RESOURCE",
    SERVER_ERROR = "SERVER_ERROR",
    UNAUTHORIZED_TOKEN = "UNAUTHORIZED_TOKEN",
    UNKNOWN_EXCEPTION = "UNKNOWN_EXCEPTION",
    UNSUPPORTED_MIME = "UNSUPPORTED_MIME"
}

// Defines exception messages enum
export enum Message {
    BAD_FILE = "File is not a valid blob.",
    BAD_JSON = "JSON is structurely invalid or contains missing fields.",
    INVALID_DATA = "Invalid or missing 'data' field in JSON.",
    INVALID_NAME = "Invalid or missing 'name' field in JSON.",
    INVALID_TAGS = "Invalid or missing 'tags' field in JSON.",
    INVALID_TIME = "Invalid or missing 'time' field in JSON.",
    INVALID_TOKEN = "Invalid or missing 'token' field in JSON.",
    INVALID_UUID = "Invalid or missing 'uuid' field in JSON.",
    LARGE_SOURCE = "Source file exceeds limit.",
    MISSING_ASSET = "Asset not found.",
    MISSING_CONTENT = "Content not found.",
    MISSING_RESOURCE = "Resource not found.",
    SERVER_ERROR = "Internal server error.",
    UNAUTHORIZED_TOKEN = "Accesss unauthorized.",
    UNKNOWN_EXCEPTION = "Unknown exception. Please alert the developer.",
    UNSUPPORTED_MIME = "Source file MIME type is not accepted."
}

// Defines exception statuses enum
export enum Status {
    BAD_FILE = 400,
    BAD_JSON = 400,
    INVALID_DATA = 400,
    INVALID_NAME = 400,
    INVALID_TAGS = 400,
    INVALID_TIME = 400,
    INVALID_TOKEN = 400,
    INVALID_UUID = 400,
    LARGE_SOURCE = 413,
    MISSING_ASSET = 404,
    MISSING_CONTENT = 404,
    MISSING_RESOURCE = 404,
    SERVER_ERROR = 500,
    UNAUTHORIZED_TOKEN = 401,
    UNKNOWN_EXCEPTION = 500,
    UNSUPPORTED_MIME = 415
}

// Defines exception class
export class Exception extends Error {
    // Declares fields
    code: string;
    status: number;

    // Defines constructor
    constructor(code: Code) {
        // Supers
        super(
            code in Message ?
                Message[code as keyof typeof Message] :
                Message.UNKNOWN_EXCEPTION
        );

        // Initializes fields
        this.code = code;
        this.status = code in Status ?
            Status[code as keyof typeof Status] :
            Status.UNKNOWN_EXCEPTION;
    }
}
