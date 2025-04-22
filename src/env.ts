// Imports
import nodePath from "node:path";

// Defines constants
export const rootPath = nodePath.resolve(import.meta.dir, "../");
export const assetsPath = nodePath.resolve(rootPath, "assets/");

// Defines environment variables
export const debug = (process.env.DEBUG ?? "false").toLowerCase() === "true";
export const ffmpegPath = nodePath.resolve("/", process.env.FFMPEG_PATH ?? "ffmpeg/");
export const fileLimit = +(process.env.FILE_LIMIT ?? "10485760"); // Note: 10 MiB
export const filesPath = nodePath.resolve(rootPath, process.env.FILES_PATH ?? "files/");
export const port = +(process.env.PORT ?? "1364");
export const previewsPath = nodePath.resolve(rootPath, process.env.PREVIEWS_PATH ?? "previews/");
export const storeLimit = +(process.env.STORE_LIMIT ?? "53687091200"); // Note: 50 GiB
export const storePath = nodePath.resolve(rootPath, process.env.STORE_PATH ?? "store.sqlite");
export const token = process.env.TOKEN ?? "";
