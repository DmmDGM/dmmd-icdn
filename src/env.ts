// Imports
import nodePath from "node:path";

// Defines constants
export const rootPath = nodePath.resolve(import.meta.dir, "../");

// Defines environment variables
export const contentPath = nodePath.resolve(rootPath, process.env.CONTENT_PATH ?? "content/");
export const dataPath = nodePath.resolve(rootPath, process.env.DATA_PATH ?? "data.sqlite");
export const port = +(process.env.PORT ?? "1364");
