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

        // Handles api requests for accessing details
        "/details": router.details(),

        // Handles api requests for querying content
        "/download/:uuid": router.download(),
        "/file/:uuid": router.file(),
        "/query/:uuid": router.query(),

        // Handles api requests for polling content
        "/list": router.list(),
        "/search": router.search(),

        // Handles api requests for modifying data
        "/add": { POST: router.add() },
        "/update": { POST: router.update() },
        "/remove": { POST: router.remove() }
    }
});

// Logs status
log.listen(env.port);
