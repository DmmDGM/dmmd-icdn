// Imports
import nodeFile from "node:fs/promises";
import nodePath from "node:path";
import * as cdn from "./cdn";
import * as env from "./env";
import * as except from "./except";
import * as pass from "./pass";

// Defines assets fetcher
export async function asset(file: string): Promise<Bun.BunFile> {
    // Checks path
    const path = nodePath.resolve(env.assetsPath, file);
    if(!path.startsWith(env.assetsPath))
        throw new except.Exception(except.Code.MISSING_ASSET);

    // Checks blob
    const blob = Bun.file(path);
    if(!(await blob.exists()))
        throw new except.Exception(except.Code.MISSING_ASSET);

    // Returns blob
    return blob;
}

// Defines query
export async function query(uuid: string): Promise<cdn.Content> {
    // Queries content
    const content = await cdn.query(uuid);

    // Returns properties
    return content;
}

// Defines resource fetcher
export async function resource(file: string): Promise<Bun.BunFile> {
    // Handles requests
    switch(file) {
        // Handles robots requests
        case "robots.txt": {
            // Creates blob
            const blob = Bun.file(nodePath.resolve(env.rootPath, file));
            if(!(await blob.exists()))
                throw new except.Exception(except.Code.MISSING_RESOURCE);

            // Returns blob
            return blob;
        }

        // Handles fallback requests
        default: {
            // Throws exception
            throw new except.Exception(except.Code.MISSING_RESOURCE)
        }
    }
}

// Defines status fetcher
export async function status(): Promise<cdn.Status> {
    // Returns status
    return await cdn.status();
}
