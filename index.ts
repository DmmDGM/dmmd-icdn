// Imports
import * as env from "./src/env";
import * as log from "./src/log";
import * as router from "./src/router";

// Creates server
Bun.serve({
    // Handles fallback requests
    fetch: router.error(),
    port: env.port,
    routes: {
        // Handles assets or resources requests
        "/assets/:asset": router.asset(),
        "/favicon.ico": router.resource("favicon.ico"),
        "/robots.txt": router.resource("robots.txt"),
        "/": router.resource("index.html"),

        // Handles store-related api requests
        "/details": router.details(),

        // Handles single-query api requests
        "/download/:uuid": router.download(),
        "/file/:uuid": router.file(),
        "/preview/:uuid": router.preview(),
        "/query/:uuid": router.query(),

        // Handles multi-query api requests
        "/list": router.list(),
        "/search": router.search(),

        // Handles post api requests
        "/add": { POST: router.add() },
        "/update": { POST: router.update() },
        "/remove": { POST: router.remove() }
    }
});

// Logs status
log.listen(env.port);
