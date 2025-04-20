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
export function checkSize(
    total: number,
    size: number,
    included: boolean = true
): boolean {
    // Checks file size
    if(size > env.fileLimit) return false;

    // Checks store size
    if(total + (included ? 0 : size) > env.storeLimit) return false;

    // Returns true
    return true;
}
