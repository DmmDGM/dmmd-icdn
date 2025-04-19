// Imports
import * as log from "./log";

// Creates passers
export const response = (requestTarget: Request, responseTarget: Response) => {
    // Logs response
    log.route(requestTarget, responseTarget);

    // Returns response
    return responseTarget;
};
export const message = (requestTarget: Request, messageText: string, statusCode: number) => {
    // Creates response
    const responseTarget = new Response(messageText, { status: statusCode });

    // Returns response
    return response(requestTarget, responseTarget);
};
