// Imports
import nodePath from "node:path";

// Defines constants
export const rootPath = nodePath.resolve(import.meta.dir, "../");

// Defines environment variables
export const contentPath = nodePath.resolve(rootPath, process.env.CONTENT_PATH ?? "contents/");
export const storePath = nodePath.resolve(rootPath, process.env.STORE_PATH ?? "store.sqlite");
export const port = +(process.env.PORT ?? "1364");
