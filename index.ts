// Imports
import nodePath from "node:path";
import chalk from "chalk";
import { fileTypeFromBuffer } from "file-type";
import * as api from "./src/api";
import * as env from "./src/env";
import * as log from "./src/log";

// Creates server
Bun.serve({
    // Handles fallback requests
    fetch: (request) => {
        // Creates response
        const response = new Response("Not found", { status: 404 });

        // Logs response
        log.route(request, response);

        // Returns resposne
        return response;
    },
    port: env.port,
    routes: {
        // Handles assets requests
        "/assets/:asset": (request) => {
            // Returns file
            const response = new Response(
                Bun.file(nodePath.resolve(env.rootPath, "./assets/", request.params.asset))
            );

            // Logs resposne
            log.route(request, response);

            // Returns response
            return response;
        },

        // Handles api requests
        "/content/:uuid": async (request) => {
            // Creates content
            const content = api.query(request.params.uuid);
            if(content === null) return new Response("Not found", { status: 404 });

            // Fetches type
            const type = await fileTypeFromBuffer(await content.file.arrayBuffer());
            if(typeof type === "undefined") return new Response("Invalid MIME", { status: 500 });

            // Creates response
            const response =  new Response(content.file, {
                headers: {
                    "Content-Type": type.mime
                }
            });

            // Logs resposne
            log.route(request, response);

            // Returns response
            return response;
        },

        "/data/:uuid": async (request) => {
            // Creates content
            const content = api.query(request.params.uuid);
            if(content === null) return new Response("Not found", { status: 404 });

            // Creates response
            const response = Response.json(api.pack(content));

            // Logs resposne
            log.route(request, response);

            // Returns response
            return response;
        },

        "/search/": async (request) => {
            // Creates parameters
            const attributes = new URL(request.url).searchParams;
            const parameters = {
                begin: attributes.get("begin"),
                count: attributes.get("count"),
                end: attributes.get("end"),
                loose: attributes.get("loose"),
                name: attributes.get("name"),
                page: attributes.get("page"),
                sort: attributes.get("sort"),
                tags: attributes.get("tags"),
                uuid: attributes.get("uuid")
            };

            // Creates filter
            const filter = {
                begin: parameters.begin === null ? void 0 : new Date(+parameters.begin),
                end: parameters.end === null ? void 0 : new Date(+parameters.end),
                loose: parameters.loose === null ? void 0 : parameters.loose === "true",
                name: parameters.name === null ? void 0 : parameters.name,
                sort: parameters.sort === null ? void 0 : (
                    parameters.sort === "name" ||
                    parameters.sort === "time" ||
                    parameters.sort === "uuid" ?
                        parameters.sort :
                        void 0
                ),
                tags: parameters.tags === null ? void 0 : parameters.tags.split(","),
                uuid: parameters.uuid === null ? void 0 : parameters.uuid
            } as const;

            // Creates search
            const count = parameters.count === null ? void 0 : +parameters.count;
            const page = parameters.page === null ? void 0 : +parameters.page;
            const uuids = api.search(filter, count, page);

            // Creates response
            const response = Response.json(uuids);
    
            // Logs response
            log.route(request, response);
    
            // Returns resposne
            return response;
        },

        "/all/": async (request) => {
            // Creates parameters
            const attributes = new URL(request.url).searchParams;
            const parameters = {
                count: attributes.get("count"),
                page: attributes.get("page")
            };

            // Creates search
            const count = parameters.count === null ? void 0 : +parameters.count;
            const page = parameters.page === null ? void 0 : +parameters.page;
            const packets = api.list(count, page).map((uuid) => api.pack(api.query(uuid)!));

            // Creates response
            const response = Response.json(packets);
    
            // Logs response
            log.route(request, response);
    
            // Returns resposne
            return response;
        },

        "/list/": async (request) => {
            // Creates parameters
            const attributes = new URL(request.url).searchParams;
            const parameters = {
                count: attributes.get("count"),
                page: attributes.get("page")
            };

            // Creates search
            const count = parameters.count === null ? void 0 : +parameters.count;
            const page = parameters.page === null ? void 0 : +parameters.page;
            const uuids = api.list(count, page);

            // Creates response
            const response = Response.json(uuids);
    
            // Logs response
            log.route(request, response);
    
            // Returns resposne
            return response;
        },  

        "/add/": {
            POST: async (request) => {
                // Creates response
                const response = new Response("Not found", { status: 404 });
        
                // Logs response
                log.route(request, response);
        
                // Returns resposne
                return response;
            }
        },

        "/update/": {
            POST: async (request) => {
                // Creates response
                const response = new Response("Not found", { status: 404 });
        
                // Logs response
                log.route(request, response);
        
                // Returns resposne
                return response;
            }
        },

        "/remove/": {
            POST: async (request) => {
                // Creates response
                const response = new Response("Not found", { status: 404 });
        
                // Logs response
                log.route(request, response);
        
                // Returns resposne
                return response;
            }
        },

        // Handles view requests
        "/": (request) => {
            // Creates response
            const response = new Response(Bun.file(nodePath.resolve(env.rootPath, "./index.html")));

            // Logs resposne
            log.route(request, response);

            // Returns response
            return response;
        }
    }
});

// Logs status
log.listen(env.port);
