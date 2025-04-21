// Imports
import nodePath from "node:path";
import * as cdn from "./cdn";
import * as env from "./env";
import * as except from "./except";
import * as pass from "./pass";

// Defines route type
export type Router<
    RouterRequest extends Request = Request
> = (request: RouterRequest) => Promise<Response>;

// Defines assets router
export function asset(): Router {
    // Creates router
    const router: Router<Bun.BunRequest<"/assets/:asset">> = async (request) => {
        // Checks path
        const path = nodePath.resolve(env.assetsPath, request.params.asset);
        if(!path.startsWith(env.assetsPath))
            throw new except.Exception(except.Code.MISSING_ASSET);

        // Checks blob
        const blob = Bun.file(path);
        if(!(await blob.exists()))
            throw new except.Exception(except.Code.MISSING_ASSET);

        // Returns response
        return pass.file(request, blob, blob.type);
    };

    // Returns router
    return safe(router as Router);
}

// Defines add router
export function add(): Router {
    // Creates router
    const router: Router = async (request) => {
        // Parses form data
        const formData = await request.formData();
        const json = formData.get("json") as Bun.FormDataEntryValue | null;
        const file = formData.get("file") as Bun.FormDataEntryValue | null;

        // Parses object
        let object: unknown;
        try {
            // Parses json
            if(json === null) object = {};
            else if(typeof json === "string") object = JSON.parse(json);
            else throw new except.Exception(except.Code.BAD_JSON);

            // Checks object
            if(typeof object !== "object" || object === null)
                throw new except.Exception(except.Code.BAD_JSON);
        }
        catch {
            throw new except.Exception(except.Code.BAD_JSON);
        }

        // Validates token
        if(env.token.length > 0) {
            // Checks token
            if(!("token" in object) || typeof object.token !== "string")
                throw new except.Exception(except.Code.INVALID_TOKEN);

            // Validates token
            if(object.token !== env.token)
                throw new except.Exception(except.Code.UNAUTHORIZED_TOKEN);
        }

        // Checks object
        if(!("data" in object) || typeof object.data !== "object" || object.data === null)
            throw new except.Exception(except.Code.INVALID_DATA);
        if(!("name" in object) || typeof object.name !== "string")
            throw new except.Exception(except.Code.INVALID_NAME);
        if(
            !("tags" in object) ||
            !Array.isArray(object.tags) ||
            object.tags.some((tag) => typeof tag !== "string")
        )
            throw new except.Exception(except.Code.INVALID_TAGS);
        if(!("time" in object) || typeof object.time !== "number")
            throw new except.Exception(except.Code.INVALID_TIME);

        // Checks file
        if(!(file instanceof Blob))
            throw new except.Exception(except.Code.BAD_FILE);

        // Creates source
        const buffer = await file.arrayBuffer();
        const source: cdn.Source = {
            buffer: buffer,
            data: object.data,
            name: object.name,
            tags: object.tags as string[],
            time: new Date(object.time)
        };

        // Adds source
        const content = await cdn.add(source);
        const summary = await cdn.summarize(content);

        // Returns response
        return pass.json(request, summary);
    };

    // Returns router
    return safe(router);
}

// Defines resource router
export function details(): Router {
    // Creates router
    const router: Router = async (request) => {
        // Creates details
        const status = await cdn.info();
        const details = {
            fileLimit: env.fileLimit,
            protected: env.token.length > 0,
            storeLength: status.length,
            storeLimit: env.storeLimit,
            storeSize: status.size
        };

        // Returns response
        return pass.json(request, details);
    };

    // Returns router
    return safe(router);
}

// Defines download router
export function download(): Router {
    // Creates router
    const router: Router<Bun.BunRequest<"/download/:uuid">> = async (request) => {
        // Creates content
        const content = await cdn.query(request.params.uuid);

        // Returns response
        return pass.download(request, content.file, `${content.name}.${content.extension}`);
    };

    // Returns router
    return safe(router as Router);
}

// Defines error router
export function error(): Router {
    // Creates router
    const router: Router = async (request) => {
        // Throws exception
        throw new except.Exception(except.Code.MISSING_RESOURCE);
    };

    // Returns router
    return safe(router);
}

// Defines file router
export function file(): Router {
    // Creates router
    const router: Router<Bun.BunRequest<"/file/:uuid">> = async (request) => {
        // Creates content
        const content = await cdn.query(request.params.uuid);

        // Returns response
        return pass.file(request, content.file, content.mime);
    };

    // Returns router
    return safe(router as Router);
}

// Defines list router
export function list(): Router {
    // Creates router
    const router: Router = async (request) => {
        // Creates predicates
        const parameters = new URL(request.url).searchParams;
        const predicates = {
            count: parameters.get("count"),
            page: parameters.get("page"),
            query: parameters.get("query")
        };
        const count = +(predicates.count !== null ? predicates.count : "25");
        const page = +(predicates.page !== null ? predicates.page : "0");
        const query = predicates.query === "true";

        // Creates uuids
        const uuids = await cdn.list(count, page);
        
        // Returns response
        return pass.json(request, query ? uuids : Promise.all(uuids.map((uuid) => cdn.query(uuid))));
    };

    // Returns router
    return safe(router);
}

// Defines query router
export function query(): Router {
    // Creates router
    const router: Router<Bun.BunRequest<"/query/:uuid">> = async (request) => {
        // Creates content
        const content = await cdn.query(request.params.uuid);
        const summary = await cdn.summarize(content);

        // Returns response
        return pass.json(request, summary);
    };

    // Returns router
    return safe(router as Router);
}

// Defines remove router
export function remove(): Router {
    // Creates router
    const router: Router = async (request) => {
        // Parses form data
        const formData = await request.formData();
        const json = formData.get("json") as Bun.FormDataEntryValue | null;

        // Parses object
        let object: unknown;
        try {
            // Parses json
            if(json === null) object = {};
            else if(typeof json === "string") object = JSON.parse(json);
            else throw new except.Exception(except.Code.BAD_JSON);

            // Checks object
            if(typeof object !== "object" || object === null)
                throw new except.Exception(except.Code.BAD_JSON);
        }
        catch {
            throw new except.Exception(except.Code.BAD_JSON);
        }

        // Validates token
        if(env.token.length > 0) {
            // Checks token
            if(!("token" in object) || typeof object.token !== "string")
                throw new except.Exception(except.Code.INVALID_TOKEN);

            // Validates token
            if(object.token !== env.token)
                throw new except.Exception(except.Code.UNAUTHORIZED_TOKEN);
        }

        // Checks object
        if(!("uuid" in object) || typeof object.uuid !== "string")
            throw new except.Exception(except.Code.INVALID_UUID);

        // Removes source
        const content = await cdn.remove(object.uuid);
        const summary = await cdn.summarize(content);

        // Returns response
        return pass.json(request, summary);
    };

    // Returns router
    return safe(router);
}

// Defines resource router
export function resource(file: string): Router {
    // Creates router
    const router: Router = async (request) => {
        // Parses file
        switch(file) {
            // Handles resources requests
            case "favicon.ico":
            case "robots.txt": {
                // Creates blob
                const blob = Bun.file(nodePath.resolve(env.rootPath, file));
                if(!(await blob.exists()))
                    throw new except.Exception(except.Code.MISSING_RESOURCE);
    
                // Returns response
                return pass.file(request, blob, blob.type);
                
            }
    
            // Handles fallback requests
            default: {
                // Throws exception
                throw new except.Exception(except.Code.MISSING_RESOURCE)
            }
        }
    };

    // Returns router
    return safe(router);
}

// Defines search router
export function search(): Router {
    // Creates router
    const router: Router = async (request) => {
        // Creates predicates
        const parameters = new URL(request.url).searchParams;
        const predicates = {
            begin: parameters.get("begin"),
            count: parameters.get("count"),
            end: parameters.get("end"),
            extension: parameters.get("extension"),
            loose: parameters.get("loose"),
            maximum: parameters.get("maximum"),
            mime: parameters.get("mime"),
            minimum: parameters.get("minimum"),
            name: parameters.get("name"),
            order: parameters.get("order"),
            page: parameters.get("page"),
            query: parameters.get("query"),
            sort: parameters.get("sort"),
            tags: parameters.get("tags"),
            uuid: parameters.get("uuid")
        };

        // Creates filter predicate
        const filter: cdn.Filter = {
            extension: predicates.extension,
            loose: predicates.loose === "true",
            mime: predicates.mime,
            name: predicates.name,
            order: predicates.order === "ascending" ? "ascending" :
                predicates.order === "descending" ? "descending" : null,
            size: {
                maximum: predicates.maximum === null || isNaN(+predicates.maximum) ?
                    null : +predicates.maximum,
                minimum: predicates.minimum === null || isNaN(+predicates.minimum) ?
                    null : +predicates.minimum
            },
            sort: predicates.sort === "name" ? "name" :
                predicates.sort === "size" ? "size" :
                predicates.sort === "time" ? "time" :
                predicates.sort === "uuid" ? "uuid" : null,
            tags: predicates.tags !== null ? predicates.tags.split(",") : null,
            time: {
                begin: predicates.begin === null || isNaN(+predicates.begin) ?
                    null : new Date(+predicates.begin),
                end: predicates.end === null || isNaN(+predicates.end) ?
                    null : new Date(+predicates.end)
            },
            uuid: predicates.uuid
        };

        // Creates count predicate
        const count = +(predicates.count !== null ? predicates.count : "25");
        
        // Creates page predicate
        const page = +(predicates.page !== null ? predicates.page : "0");
        
        // Creates query predicate
        const query = predicates.query === "true";

        // Creates uuids
        const uuids = await cdn.search(filter, count, page);
        
        // Returns response
        return pass.json(request, query ? uuids : Promise.all(uuids.map((uuid) => cdn.query(uuid))));
    };

    // Returns router
    return safe(router);
}

// Defines update router
export function update(): Router {
    // Creates router
    const router: Router = async (request) => {
        // Parses form data
        const formData = await request.formData();
        const json = formData.get("json") as Bun.FormDataEntryValue | null;
        const file = formData.get("file") as Bun.FormDataEntryValue | null;

        // Parses object
        let object: unknown;
        try {
            // Parses json
            if(json === null) object = {};
            else if(typeof json === "string") object = JSON.parse(json);
            else throw new except.Exception(except.Code.BAD_JSON);

            // Checks object
            if(typeof object !== "object" || object === null)
                throw new except.Exception(except.Code.BAD_JSON);
        }
        catch {
            throw new except.Exception(except.Code.BAD_JSON);
        }

        // Validates token
        if(env.token.length > 0) {
            // Checks token
            if(!("token" in object) || typeof object.token !== "string")
                throw new except.Exception(except.Code.INVALID_TOKEN);

            // Validates token
            if(object.token !== env.token)
                throw new except.Exception(except.Code.UNAUTHORIZED_TOKEN);
        }

        // Creates source
        const source: Partial<cdn.Source> = {};

        // Checks object
        if("data" in object) {
            if(typeof object.data !== "object" || object.data === null)
                throw new except.Exception(except.Code.INVALID_DATA);
            source.data = object.data;
        }
        if("name" in object) {
            if(typeof object.name !== "string")
                throw new except.Exception(except.Code.INVALID_NAME);
            source.name = object.name;
        }
        if("tags" in object) {
            if(!Array.isArray(object.tags) || object.tags.some((tag) => typeof tag !== "string"))
                throw new except.Exception(except.Code.INVALID_TAGS);
            source.tags = object.tags;
        }
        if("time" in object) {
            if(typeof object.time !== "number")
                throw new except.Exception(except.Code.INVALID_TIME);
            source.time = new Date(object.time);
        }
        if(!("uuid" in object) || typeof object.uuid !== "string")
            throw new except.Exception(except.Code.INVALID_UUID);

        // Checks file
        if(file !== null) {
            if(!(file instanceof Blob))
                throw new except.Exception(except.Code.BAD_FILE);
            source.buffer = await file.arrayBuffer();
        }

        // Updates source
        const content = await cdn.update(object.uuid, source);
        const summary = await cdn.summarize(content);

        // Returns response
        return pass.json(request, summary);
    };

    // Returns router
    return safe(router);
}

// Defines safe wrapper
export function safe(router: Router): Router {
    // Creates wrapper
    const wrapper: Router = async (request) => {
        // Runs router
        try {
            // Returns response
            return await router(request);
        }
        catch(error) {
            // Returns error
            return pass.error(request, error);
        }
    };

    // Returns wrapped
    return wrapper;
}
