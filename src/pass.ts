// Imports
import * as env from "./env";
import * as except from "./except";
import * as log from "./log";

// Creates download passer
export function download(request: Request, file: Bun.BunFile, name: string): Response {
    // Creates response
    const response = new Response(file, {
        headers: {
            "Content-Disposition": `attachment; filename="${name}"`,
            "Content-Type": "application/octet-stream"
        }
    });

    // Returns response
    return route(request, response);
}

// Creates error passer
export function error(request: Request, error: any): Response {
    // Returns response
    return error instanceof except.Exception ?
        exception(request, error) :
        json(request, {
            code: except.Code.SERVER_EXCEPTION,
            message: env.debug ?
                (error instanceof Error ? error.message : String(error)) :
                except.Message.SERVER_EXCEPTION
        }, except.Status.SERVER_EXCEPTION);
}

// Creates exception passer
export function exception(request: Request, exception: except.Exception): Response {
    // Returns response
    return json(request, {
        code: exception.code,
        message: exception.message
    }, exception.status);
}

// Creates file passer
export function file(request: Request, file: Bun.BunFile, mime: string): Response {
    // Creates response
    const response = new Response(file, {
        headers: {
            "Content-Type": mime
        }
    });

    // Returns response
    return route(request, response);
}

// Creates json passer
export function json(request: Request, data: any, status: number = 200): Response {
    // Creates response
    const response = Response.json(data, { status: status });

    // Returns response
    return route(request, response);
}

// Creates message passer
export function message(request: Request, content: string, status: number = 200): Response {
    // Creates response
    const response = new Response(content, { status: status });

    // Returns response
    return route(request, response);
}

// Creates route passer
export function route(request: Request, response: Response): Response {
    // Logs response
    log.route(request, response);

    // Returns response
    return response;
}
