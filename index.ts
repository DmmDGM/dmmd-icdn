// Imports
import nodePath from "node:path";
import { fileTypeFromBuffer } from "file-type";
import * as api from "./src/api";
import * as env from "./src/env";
import * as log from "./src/log";
import * as pass from "./src/pass";

// Creates server
Bun.serve({
    // Handles fallback requests
    fetch: (request) => {
        // Returns resposne
        return pass.message(request, "Not found", 404);
    },
    port: env.port,
    routes: {
        // Handles api requests for accessing assets
        "/assets/:asset": async (request: Bun.BunRequest<"/assets/:asset">) => {            
            // Creates file
            const path = nodePath.resolve(env.assetsPath, request.params.asset);
            if(!path.startsWith(env.assetsPath)) return pass.message(request, "Asset not found", 404);
            const file = Bun.file(path);
            if(!(await file.exists())) return pass.message(request, "Asset not found", 404);

            // Returns response
            return pass.response(request, new Response(file));
        },

        // Handles api requests for accessing data
        "/content/:uuid": async (request: Bun.BunRequest<"/content/:uuid">) => {
            // Creates content
            const content = api.query(request.params.uuid);
            if(content === null) return pass.message(request, "Content not found", 404);

            // Returns response
            const type = await fileTypeFromBuffer(await content.file.arrayBuffer());
            return pass.response(request, new Response(content.file, {
                headers: {
                    "Content-Type": typeof type === "undefined" ? "text/plain" : type.mime
                }
            }));
        },
        "/data/:uuid": async (request: Bun.BunRequest<"/data/:uuid">) => {
            // Creates content
            const content = api.query(request.params.uuid);
            if(content === null) return pass.message(request, "Not found", 404);

            // Returns response
            return pass.response(request, Response.json(api.pack(content)));
        },

        // Handles api requests for searching data
        "/search": async (request: Bun.BunRequest<"/search">) => {
            // Creates parameters
            const attributes = new URL(request.url).searchParams;
            const parameters = {
                begin: attributes.get("begin"),
                count: attributes.get("count"),
                end: attributes.get("end"),
                loose: attributes.get("loose"),
                name: attributes.get("name"),
                order: attributes.get("order"),
                page: attributes.get("page"),
                sort: attributes.get("sort"),
                tags: attributes.get("tags"),
                uuid: attributes.get("uuid")
            };

            // Creates filter
            const filter = {
                begin: parameters.begin === null || isNaN(+parameters.begin) ?
                    void 0 : new Date(+parameters.begin),
                end: parameters.end === null || isNaN(+parameters.end) ?
                    void 0 : new Date(+parameters.end),
                loose: parameters.loose === null ? void 0 : parameters.loose === "true",
                name: parameters.name === null ? void 0 : parameters.name,
                order: parameters.order === null ? void 0 : (
                    parameters.order === "ascending" ?
                        "ascending" :
                        "descending"
                ),
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
            const count = parameters.count === null || isNaN(+parameters.count) ?
                void 0 : parseInt(parameters.count);
            const page = parameters.page === null || isNaN(+parameters.page) ?
                void 0 : parseInt(parameters.page);
            const uuids = api.search(filter, count, page);

            // Returns response
            return pass.response(request, Response.json(uuids));
        },

        // Handles api requests for polling data
        "/all": async (request: Bun.BunRequest<"/all">) => {
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

            // Returns response
            return pass.response(request, Response.json(packets));
        },
        "/list": async (request: Bun.BunRequest<"/list">) => {
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

            // Returns response
            return pass.response(request, Response.json(uuids));
        },

        // Handles api requests for modifying data
        "/add": {
            POST: async (request: Bun.BunRequest<"/add">) => {
                // Adds content
                try {
                    // Parses form data
                    const formData = await request.formData();
                    const json = formData.get("json") as Bun.FormDataEntryValue | null;
                    const file = formData.get("file") as Bun.FormDataEntryValue | null;
                    
                    // Creates parsed
                    if(typeof json !== "string") return pass.message(request, "Invalid JSON", 400);
                    const parsed = JSON.parse(json) as unknown;
                    if(
                        typeof parsed !== "object" ||
                        parsed === null
                    ) return pass.message(request, "Invalid json", 400);
                    
                    // Validates token
                    if(env.token.length > 0) {
                        // Parses token
                        if(
                            !("token" in parsed) ||
                            typeof parsed.token !== "string"
                        ) return pass.message(request, "Invalid or missing 'token' field in json", 400);
                        const token = parsed.token;
                        
                        // Checks token
                        if(token !== env.token) return pass.message(request, "Token does not match", 400);
                    }

                    // Parses json
                    if(
                        !("data" in parsed) ||
                        typeof parsed.data !== "object" || parsed.data === null
                    ) return pass.message(request, "Invalid or missing 'data' field in json", 400);
                    if(
                        !("name" in parsed) ||
                        typeof parsed.name !== "string"
                    ) return pass.message(request, "Invalid or missing 'name' field in json", 400);
                    if(
                        !("tags" in parsed) ||
                        !Array.isArray(parsed.tags) ||
                        parsed.tags.some((tag) => typeof tag !== "string")
                    ) return pass.message(request, "Invalid or missing 'tags' field in json", 400);
                    if(
                        !("time" in parsed) ||
                        typeof parsed.time !== "number"
                    ) return pass.message(request, "Invalid or missing 'time' field in json", 400);
                    
                    // Parses file
                    if(!(file instanceof Blob)) return pass.message(request, "Invalid file", 400);

                    // Creates source
                    const source: api.Source<object> = {
                        data: parsed.data,
                        file: file as Bun.BunFile,
                        name: parsed.name,
                        tags: parsed.tags as string[],
                        time: new Date(parsed.time)
                    };

                    // Adds source
                    await api.add(source);
            
                    // Returns resposne
                    return pass.message(request, "OK", 200);
                }
                catch(error) {
                    return pass.message(
                        request,
                        error instanceof Error ?
                        error.message : String(error),
                        400
                    );
                }
            }
        },
        "/update": {
            POST: async (request: Bun.BunRequest<"/update">) => {
                // Updates content
                try {
                    // Parses form data
                    const formData = await request.formData();
                    const json = formData.get("json") as Bun.FormDataEntryValue | null;
                    const file = formData.get("file") as Bun.FormDataEntryValue | null;
                    
                    // Creates source
                    const source: Partial<api.Source<object>> = {};
                    
                    // Creates parsed
                    const parsed = (typeof json === "string" ? JSON.parse(json) : {}) as unknown;
                    if(
                        typeof parsed !== "object" ||
                        parsed === null
                    ) return pass.message(request, "Invalid json", 400);

                    // Validates token
                    if(env.token.length > 0) {
                        // Parses token
                        if(
                            !("token" in parsed) ||
                            typeof parsed.token !== "string"
                        ) return pass.message(request, "Invalid or missing 'token' field in json", 400);
                        const token = parsed.token;

                        // Checks token
                        if(token !== env.token) return pass.message(request, "Token does not match", 400);
                    }

                    // Parses uuid
                    if(
                        !("uuid" in parsed) ||
                        typeof parsed.uuid !== "string"
                    ) return pass.message(request, "Invalid or missing 'uuid' field in json", 400);
                    const uuid = parsed.uuid;

                    // Parses parsed
                    if("data" in parsed) {
                        if(
                            typeof parsed.data !== "object" ||
                            parsed.data === null
                        ) return pass.message(request, "Invalid 'data' field in json", 400);
                        source.data = parsed.data;
                    }
                    if("name" in parsed) {
                        if(
                            typeof parsed.name !== "string"
                        ) return pass.message(request, "Invalid 'name' field in json", 400);
                        source.name = parsed.name;
                    }
                    if("tags" in parsed) {
                        if(
                            !Array.isArray(parsed.tags) ||
                            parsed.tags.some((tag) => typeof tag !== "string")
                        ) return pass.message(request, "Invalid 'tags' field in json", 400);
                        source.tags = parsed.tags as string[];
                    }
                    if("time" in parsed) {
                        if(
                            typeof parsed.time !== "number"
                        ) return pass.message(request, "Invalid 'time' field in json", 400);
                        source.time = new Date(parsed.time);
                    }

                    // Parses file
                    if(file !== null) {
                        if(!(file instanceof Blob)) return pass.message(request, "Invalid file", 400);
                        source.file = file as Bun.BunFile;
                    }

                    // Updates source
                    await api.update(uuid, source);
            
                    // Returns resposne
                    return pass.message(request, "OK", 200);
                }
                catch(error) {
                    return pass.message(
                        request,
                        error instanceof Error ?
                            error.message : String(error),
                        400
                    );
                }
            }
        },
        "/remove": {
            POST: async (request: Bun.BunRequest<"/remove">) => {
                // Removes content
                try {
                    // Parses form data
                    const formData = await request.formData();
                    const json = formData.get("json") as Bun.FormDataEntryValue | null;
                    
                    // Creates parsed
                    const parsed = (typeof json === "string" ? JSON.parse(json) : {}) as unknown;
                    if(
                        typeof parsed !== "object" ||
                        parsed === null
                    ) return pass.message(request, "Invalid json", 400);

                    // Validates token
                    if(env.token.length > 0) {
                        // Parses token
                        if(
                            !("token" in parsed) ||
                            typeof parsed.token !== "string"
                        ) return pass.message(request, "Invalid or missing 'token' field in json", 400);
                        const token = parsed.token;

                        // Checks token
                        if(token !== env.token) return pass.message(request, "Token does not match", 400);
                    }

                    // Parses uuid
                    if(
                        !("uuid" in parsed) ||
                        typeof parsed.uuid !== "string"
                    ) return pass.message(request, "Invalid or missing 'uuid' field in json", 400);
                    const uuid = parsed.uuid;

                    // Removes content
                    await api.remove(uuid);
            
                    // Returns resposne
                    return pass.message(request, "OK", 200);
                }
                catch(error) {
                    return pass.message(
                        request,
                        error instanceof Error ?
                            error.message : String(error),
                        400
                    );
                }
            }
        },

        // Handles api requests for web view
        "/": (request: Bun.BunRequest<"/">) => {
            // Returns response
            return pass.response(request, new Response(
                Bun.file(nodePath.resolve(
                    env.rootPath,
                    "./index.html"
                ))
            ));
        }
    }
});

// Logs status
log.listen(env.port);
