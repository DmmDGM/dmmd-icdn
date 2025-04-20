// Imports
import nodePath from "node:path";

// Defines constants
export const rootPath = nodePath.resolve(import.meta.dir, "../");
export const assetsPath = nodePath.resolve(rootPath, "assets/");

// Defines environment variables
export const contentsPath = nodePath.resolve(rootPath, process.env.CONTENTS_PATH ?? "contents/");
export const fileLimit = +(process.env.FILE_LIMIT ?? "10485760"); // Note: 10 mb
export const port = +(process.env.PORT ?? "1364");
export const storeLimit = +(process.env.STORE_LIMIT ?? "53687091200"); // Note: 50 gb
export const storePath = nodePath.resolve(rootPath, process.env.STORE_PATH ?? "store.sqlite");
export const token = process.env.TOKEN ?? "";
