// Imports
import { fileTypeFromBuffer } from "file-type";
import nodeFile from "node:fs/promises";
import nodePath from "node:path";
import * as env from "./env";

// Defines mime fetcher function
export async function getMime(buffer: ArrayBuffer): Promise<string> {
    // Checks type
    const type = await fileTypeFromBuffer(buffer);
    
    // Returns mime
    return typeof type === "undefined" || !checkMime(type.mime) ? "text/plain" : type.mime;
}

// Defines mime checker function
export function checkMime(mime: string): boolean {
    // Checks mime
    return mime.startsWith("image/") || mime.startsWith("video/");
}

// Defines size checker function
export async function checkSize(uuid: string, buffer: ArrayBuffer): Promise<boolean> {
    // Checks file size
    if(buffer.byteLength > env.fileLimit) return false;

    // Checks store size
    let included = false;
    const total = (await nodeFile.readdir(env.filesPath))
        .map((file) => {
            included = included || file === uuid;
            return Bun.file(nodePath.resolve(env.filesPath, file)).size;
        })
        .reduce((accumulator, current) => accumulator + current, 0);
    if(!included && total + buffer.byteLength > env.storeLimit) return false;

    // Returns true
    return true;
}
