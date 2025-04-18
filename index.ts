// Imports
import nodePath from "node:path";
import chalk from "chalk";
import * as data from "./src/data";
import * as env from "./src/env";
import * as log from "./src/log";

// Serves
Bun.serve({
    port: env.port,
    fetch: () => {
        return new Response(Bun.file(nodePath.resolve(env.rootPath, "./index.html")))
    }
});

// Logs
log.info("Server now online on port " + env.port);
