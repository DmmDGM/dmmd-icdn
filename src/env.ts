// Defines environment variables
export const contentPath = process.env.CONTENT_PATH ?? "content/";
export const dataPath = process.env.DATA_PATH ?? "data.sqlite";
export const port = +(process.env.PORT ?? "1364");
