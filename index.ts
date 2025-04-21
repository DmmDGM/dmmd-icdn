// Imports
import nodePath from "node:path";
import * as cdn from "./src/cdn";
import * as env from "./src/env";
import * as except from "./src/except";
import * as inspect from "./src/inspect";
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
            // Returns assets
            try {
                // Checks path
                const path = nodePath.resolve(env.assetsPath, request.params.asset);
                if(!path.startsWith(env.assetsPath))
                    throw new except.Exception(except.Codes.MISSING_ASSET);

                // Checks asset
                const asset = Bun.file(path);
                if(!(await asset.exists()))
                    throw new except.Exception(except.Codes.MISSING_ASSET);
    
                // Returns response
                return pass.response(request, new Response(asset));
            }
            catch(error) {
                // Returns error
                return pass.error(request, error);
            }
        },

        // Handles api requests for accessing store data
        "/store": async (request: Bun.BunRequest<"/store">) => {
            // Returns content
            try {
                // Fetches store data
                const length = cdn.length();
                const size = await cdn.size();
    
                // Returns response
                return pass.json(request, {
                    fileLimit: env.fileLimit,
                    length: length,
                    protected: env.token.length > 0,
                    size: size,
                    storeLimit: env.storeLimit
                });
            }
            catch(error) {
                // Returns error
                return pass.error(request, error);
            }
        },

        // Handles api requests for downloading data
        "/download/:uuid": async (request: Bun.BunRequest<"/download/:uuid">) => {
            // Returns content
            try {
                // Creates content
                const content = await cdn.query(request.params.uuid);
                if(content === null)
                    throw new except.Exception(except.Codes.MISSING_CONTENT);
    
                // Returns response
                return pass.response(request, new Response(content.file, {
                    headers: {
                        "Content-Disposition": `attachment; filename="${content.name}.${content.extension}"`,
                        "Content-Type": "application/octet-stream"
                    }
                }));
            }
            catch(error) {
                // Returns error
                return pass.error(request, error);
            }
        },

        // Handles api requests for accessing content
        "/file/:uuid": async (request: Bun.BunRequest<"/file/:uuid">) => {
            // Returns file
            try {
                // Creates content
                const content = await cdn.query(request.params.uuid);
                if(content === null)
                    throw new except.Exception(except.Codes.MISSING_CONTENT);
    
                // Returns response
                return pass.response(request, new Response(content.file, {
                    headers: {
                        "Content-Type": content.mime
                    }
                }));
            }
            catch(error) {
                // Returns error
                return pass.error(request, error);
            }
        },
        "/query/:uuid": async (request: Bun.BunRequest<"/query/:uuid">) => {
            // Returns content
            try {
                // Creates content
                const content = await cdn.query(request.params.uuid);
                if(content === null)
                    throw new except.Exception(except.Codes.MISSING_CONTENT);
    
                // Returns response
                return pass.json(request, cdn.pack(content));
            }
            catch(error) {
                // Returns error
                return pass.error(request, error);
            }
        },

        // Handles api requests for searching data
        "/search": async (request: Bun.BunRequest<"/search">) => {
            // Returns uuids
            try {
                // Creates parameters
                const attributes = new URL(request.url).searchParams;
                const parameters = {
                    begin: attributes.get("begin"),
                    count: attributes.get("count"),
                    end: attributes.get("end"),
                    extension: attributes.get("extension"),
                    loose: attributes.get("loose"),
                    maximum: attributes.get("maximum"),
                    mime: attributes.get("mime"),
                    minimum: attributes.get("minimum"),
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
                    extension: parameters.extension === null ? void 0 : parameters.extension,
                    loose: parameters.loose === null ? void 0 : parameters.loose === "true",
                    maximum: parameters.maximum === null || isNaN(+parameters.maximum) ?
                        void 0 : +parameters.maximum,
                    mime: parameters.mime === null ? void 0 : parameters.mime,
                    minimum: parameters.minimum === null || isNaN(+parameters.minimum) ?
                        void 0 : +parameters.minimum,
                    name: parameters.name === null ? void 0 : parameters.name,
                    order: parameters.order === null ? void 0 : (
                        parameters.order === "ascending" ?
                            "ascending" : "descending"
                    ),
                    sort: parameters.sort === null ? void 0 : (
                        parameters.sort === "name" ||
                        parameters.sort === "size" ||
                        parameters.sort === "time" ||
                        parameters.sort === "uuid" ?
                            parameters.sort : void 0
                    ),
                    tags: parameters.tags === null ? void 0 : parameters.tags.split(","),
                    uuid: parameters.uuid === null ? void 0 : parameters.uuid
                } as const;
    
                // Creates search
                const count = parameters.count === null || isNaN(+parameters.count) ?
                    void 0 : parseInt(parameters.count);
                const page = parameters.page === null || isNaN(+parameters.page) ?
                    void 0 : parseInt(parameters.page);
                const uuids = cdn.search(filter, count, page);
    
                // Returns response
                return pass.json(request, uuids);
            }
            catch(error) {
                // Returns error
                return pass.error(request, error);
            }
        },

        // Handles api requests for polling data
        "/all": async (request: Bun.BunRequest<"/all">) => {
            // Returns uuids
            try {
                // Creates predicates
                const parameters = new URL(request.url).searchParams;
                const predicates = {
                    count: parameters.get("count"),
                    page: parameters.get("page")
                };
    
                // Creates search
                const count = predicates.count === null ? void 0 : +predicates.count;
                const page = predicates.page === null ? void 0 : +predicates.page;
                const packets = await Promise.all(
                    cdn
                        .list(count, page)
                        .map(async (uuid) => cdn.pack((await cdn.query(uuid))!))
                );
    
                // Returns response
                return pass.json(request, packets);
            }
            catch(error) {
                // Returns error
                return pass.error(request, error);
            }
        },
        "/list": async (request: Bun.BunRequest<"/list">) => {
            // Returns uuids
            try {
                // Creates predicates
                const parameters = new URL(request.url).searchParams;
                const predicates = {
                    count: parameters.get("count"),
                    page: parameters.get("page")
                };
    
                // Creates search
                const count = predicates.count === null ? void 0 : +predicates.count;
                const page = predicates.page === null ? void 0 : +predicates.page;
                const uuids = cdn.list(count, page);
    
                // Returns response
                return pass.json(request, uuids);
            }
            catch(error) {
                // Returns error
                return pass.error(request, error);
            }
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
                    const parsed = (typeof json === "string" ? JSON.parse(json) : {}) as unknown;
                    if(
                        typeof parsed !== "object" ||
                        parsed === null
                    )
                        throw new except.Exception(except.Codes.BAD_JSON);
                    
                    // Validates token
                    if(env.token.length > 0) {
                        // Parses token
                        if(
                            !("token" in parsed) ||
                            typeof parsed.token !== "string"
                        )
                            throw new except.Exception(except.Codes.INVALID_TOKEN);
                            
                        // Checks token
                        const token = parsed.token;
                        if(token !== env.token)
                            throw new except.Exception(except.Codes.UNAUTHORIZED_TOKEN);
                    }
                    
                    // Parses file
                    if(!(file instanceof Blob))
                        throw new except.Exception(except.Codes.BAD_FILE);

                    // Parses json
                    if(
                        !("data" in parsed) ||
                        typeof parsed.data !== "object" ||
                        parsed.data === null
                    )
                        throw new except.Exception(except.Codes.INVALID_DATA);
                    if(
                        !("name" in parsed) ||
                        typeof parsed.name !== "string"
                    )
                        throw new except.Exception(except.Codes.INVALID_NAME);
                    if(
                        !("tags" in parsed) ||
                        !Array.isArray(parsed.tags) ||
                        parsed.tags.some((tag) => typeof tag !== "string")
                    )
                        throw new except.Exception(except.Codes.INVALID_TAGS);
                    if(
                        !("time" in parsed) ||
                        typeof parsed.time !== "number" ||
                        parsed.time < 0
                    )
                        throw new except.Exception(except.Codes.INVALID_TIME);

                    // Creates source
                    const buffer = await file.arrayBuffer();
                    const type = await inspect.getType(buffer);
                    const source: cdn.Source<object> = {
                        buffer: buffer,
                        data: parsed.data,
                        extension: type.ext,
                        file: file as Bun.BunFile,
                        mime: type.mime,
                        name: parsed.name,
                        size: buffer.byteLength,
                        tags: parsed.tags as string[],
                        time: new Date(parsed.time)
                    };

                    // Adds source
                    const content = await cdn.add(source);
            
                    // Returns resposne
                    return pass.json(request, cdn.pack(content));
                }
                catch(error) {
                    // Returns error
                    return pass.error(request, error);
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
                    const source: Partial<cdn.Source<object>> = {};
                    
                    // Creates parsed
                    const parsed = (typeof json === "string" ? JSON.parse(json) : {}) as unknown;
                    if(
                        typeof parsed !== "object" ||
                        parsed === null
                    ) 
                        throw new except.Exception(except.Codes.BAD_JSON)

                    // Validates token
                    if(env.token.length > 0) {
                        // Parses token
                        if(
                            !("token" in parsed) ||
                            typeof parsed.token !== "string"
                        )
                            throw new except.Exception(except.Codes.INVALID_TOKEN);
                            
                        // Checks token
                        const token = parsed.token;
                        if(token !== env.token)
                            throw new except.Exception(except.Codes.UNAUTHORIZED_TOKEN);
                    }

                    // Parses uuid
                    if(
                        !("uuid" in parsed) ||
                        typeof parsed.uuid !== "string"
                    )
                        throw new except.Exception(except.Codes.INVALID_UUID);
                    const uuid = parsed.uuid;

                    // Parses file
                    if(file !== null) {
                        if(!(file instanceof Blob))
                            throw new except.Exception(except.Codes.BAD_FILE);
                        const buffer = await file.arrayBuffer();
                        const type = await inspect.getType(buffer);
                        source.buffer = buffer;
                        source.extension = type.ext;
                        source.file = file as Bun.BunFile;
                        source.mime = type.mime;
                        source.size = buffer.byteLength;
                    }

                    // Parses fields
                    if("data" in parsed) {
                        if(
                            typeof parsed.data !== "object" ||
                            parsed.data === null
                        )
                        throw new except.Exception(except.Codes.INVALID_DATA);
                        source.data = parsed.data;
                    }
                    if("name" in parsed) {
                        if(
                            typeof parsed.name !== "string"
                        )
                            throw new except.Exception(except.Codes.INVALID_NAME);
                        source.name = parsed.name;
                    }
                    if("tags" in parsed) {
                        if(
                            !Array.isArray(parsed.tags) ||
                            parsed.tags.some((tag) => typeof tag !== "string")
                        )
                            throw new except.Exception(except.Codes.INVALID_TAGS);
                        source.tags = parsed.tags as string[];
                    }
                    if("time" in parsed) {
                        if(
                            typeof parsed.time !== "number" ||
                            parsed.time < 0
                        )
                            throw new except.Exception(except.Codes.INVALID_TIME);
                        source.time = new Date(parsed.time);
                    }

                    // Updates source
                    const content = await cdn.update(uuid, source);
            
                    // Returns resposne
                    return pass.json(request, cdn.pack(content));
                }
                catch(error) {
                    // Returns error
                    return pass.error(request, error);
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
                    )
                        throw new except.Exception(except.Codes.BAD_JSON);

                    // Validates token
                    if(env.token.length > 0) {
                        // Parses token
                        if(
                            !("token" in parsed) ||
                            typeof parsed.token !== "string"
                        )
                            throw new except.Exception(except.Codes.INVALID_TOKEN);
                            
                        // Checks token
                        const token = parsed.token;
                        if(token !== env.token)
                            throw new except.Exception(except.Codes.UNAUTHORIZED_TOKEN);
                    }

                    // Parses uuid
                    if(
                        !("uuid" in parsed) ||
                        typeof parsed.uuid !== "string"
                    )
                        throw new except.Exception(except.Codes.INVALID_UUID);
                    const uuid = parsed.uuid;

                    // Removes content
                    const content = await cdn.remove(uuid);
            
                    // Returns resposne
                    return pass.json(request, cdn.pack(content));
                }
                catch(error) {
                    // Returns error
                    return pass.error(request, error);
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
