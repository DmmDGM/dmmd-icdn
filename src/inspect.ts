// Imports
import { fileTypeFromBuffer, type FileTypeResult } from "file-type";
import * as env from "./env";

// Defines type fetcher function
export async function getType(buffer: ArrayBuffer): Promise<FileTypeResult> {
    // Checks type
    const type = await fileTypeFromBuffer(buffer);
    
    // Returns mime
    return typeof type === "undefined" || !checkMime(type.mime) ? {
        ext: "txt",
        mime: "text/plain"
    } : type;
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
    existing: number = 0,
): boolean {
    // Checks file size
    if(size > env.fileLimit) return false;

    // Checks store size
    if(total + size - existing > env.storeLimit) return false;

    // Returns true
    return true;
}
