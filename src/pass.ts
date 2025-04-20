// Imports
import { Exception } from "./except";
import * as log from "./log";

// Creates passers
export const response = (requestTarget: Request, responseTarget: Response) => {
    // Logs response
    log.route(requestTarget, responseTarget);

    // Returns response
    return responseTarget;
};
export const except = (requestTarget: Request, exception: Exception) => {
    // Creates response
    const responseTarget = Response.json({
        code: exception.code,
        message: exception.message
    }, { status: exception.status });

    // Returns response
    return response(requestTarget, responseTarget);
};
export const json = (requestTarget: Request, jsonData: any, statusCode: number = 200) => {
    // Creates response
    const responseTarget = Response.json(jsonData, { status: statusCode });

    // Returns response
    return response(requestTarget, responseTarget);
};
export const message = (requestTarget: Request, messageText: string, statusCode: number = 200) => {
    // Creates response
    const responseTarget = new Response(messageText, { status: statusCode });

    // Returns response
    return response(requestTarget, responseTarget);
};
export const error = (requestTarget: Request, error: any) => {
    // Returns response
    return error instanceof Exception ?
        except(requestTarget, error) :
        json(requestTarget, {
            code: "SERVER_ERROR",
            message: error instanceof Error ? error.message : String(error)
        }, 500);
};
