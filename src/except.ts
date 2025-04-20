// Defines exception codes enum
export enum Codes {
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
    UNAUTHORIZED_TOKEN = "UNAUTHORIZED_TOKEN",
    UNSUPPORTED_MIME = "UNSUPPORTED_MIME"
}

// Defines exception messages enum
export enum Messages {
    BAD_FILE = "File is not a valid blob.",
    BAD_JSON = "JSON is structurely invalid or contains missing fields.",
    INVALID_DATA = "Invalid or missing 'data' field in json.",
    INVALID_NAME = "Invalid or missing 'name' field in json.",
    INVALID_TAGS = "Invalid or missing 'tags' field in json.",
    INVALID_TIME = "Invalid or missing 'time' field in json.",
    INVALID_TOKEN = "Invalid or missing 'token' field in json.",
    INVALID_UUID = "Invalid or missing 'uuid' field in json.",
    LARGE_SOURCE = "Source file exceeds limit.",
    MISSING_ASSET = "Asset not found.",
    MISSING_CONTENT = "Content not found.",
    UNAUTHORIZED_TOKEN = "Accesss unauthorized.",
    UNSUPPORTED_MIME = "Source file MIME is not accepted."
}

// Defines exception statuses enum
export enum Statuses {
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
    UNAUTHORIZED_TOKEN = 401,
    UNSUPPORTED_MIME = 415
}

// Defines exception class
export class Exception extends Error {
    // Declares fields
    code: string;
    status: number;

    // Defines constructor
    constructor(
        code: string,
        message: string = (
            code in Messages ? Messages[code as keyof typeof Messages] : "Bad request"
        ),
        status: number = (
            code in Statuses ? Statuses[code as keyof typeof Statuses] : 400
        )
    ) {
        // Supers
        super(message);

        // Initializes fields
        this.code = code;
        this.status = status;
    }
}
