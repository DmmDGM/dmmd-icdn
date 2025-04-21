// Imports
import bunSqlite from "bun:sqlite";
import nodeFile from "node:fs/promises";
import nodePath from "node:path";
import { fileTypeFromBuffer } from "file-type";
import * as env from "./env";
import * as except from "./except";

// Defines content type
export type Content = {
    buffer: ArrayBuffer;
    data: object;
    extension: string;
    file: Bun.BunFile;
    mime: string;
    name: string;
    size: number;
    tags: string[];
    time: Date;
    uuid: string;
};

// Defines filter type
export type Filter = {
    extension: string | null;
    loose: boolean | null;
    mime: string | null;
    name: string | null;
    order: "ascending" | "descending" | null;
    size: {
        maximum: number | null;
        minimum: string | null;
    };
    sort: "name" | "size" | "time" | "uuid" | null;
    tags: string[] | null;
    time: {
        begin: Date | null;
        end: Date | null;
    };
    uuid: string | null;
};

// Defines schema type
export type Schema = {
    ContentId: string;
    Data: string;
    Extension: string;
    Mime: string;
    Name: string;
    Size: number;
    Tags: string;
    Time: number;
};

// Defines source  type
export type Source = {
    buffer: ArrayBuffer;
    data: object;
    name: string;
    tags: string[];
    time: Date;
};

// Defines status type
export type Status = {
    length: number;
    size: number;
};

// Defines escape function
export function escape(text: string): string {
    // Returns formatted
    return text.replaceAll(/[\\%_]/g, "\\$0");
}

// Creates store
export const store = bunSqlite.open(env.storePath);
await initialize();

// Defines initialize function
export async function initialize(): Promise<void> {
    // Creates files directory
    if(!await nodeFile.exists(env.filesPath))
        await nodeFile.mkdir(env.filesPath);

    // Creates store file
    store.run(`
        CREATE TABLE IF NOT EXISTS Contents (
            ContentId TEXT UNIQUE PRIMARY KEY,
            Data TEXT NOT NULL,
            Extension TEXT NOT NULL,
            Mime TEXT NOT NULL,
            Name TEXT NOT NULL,
            Size INTEGER NOT NULL,
            Tags TEXT NOT NULL,
            Time INTEGER NOT NULL
        );
    `);
}

// Defines query function
export async function query(uuid: string): Promise<Content> {
    // Creates schema
    const schema = store.query(`
        SELECT ContentId, Data, Extension, Mime, Name, Size, Tags, Time
        FROM Contents
        WHERE ContentId = ?
        LIMIT 1;
    `).get(uuid) as Schema | null;
    if(schema === null)
        throw new except.Exception(except.Code.MISSING_CONTENT);

    // Creates content
    const file = Bun.file(nodePath.resolve(env.filesPath, schema.ContentId));
    const content = {
        buffer: await file.arrayBuffer(),
        data: JSON.parse(schema.Data),
        extension: schema.Extension,
        file: file,
        size: schema.Size,
        mime: schema.Mime,
        name: schema.Name,
        tags: schema.Tags.split(","),
        time: new Date(schema.Time),
        uuid: schema.ContentId
    };

    // Returns content
    return content;
}

// Defines test function
export async function test(uuid: string): Promise<boolean> {
    // Creates schema
    const schema = store.query(`
        SELECT ContentId
        FROM Contents
        WHERE ContentId = ?
        LIMIT 1;
    `).get(uuid) as Schema | null;

    // Returns result
    return schema !== null;
}

// Creates list function
export async function list(count: number, page: number): Promise<string[]> {
    // Creates limit
    const offset = count * page;
    const limit = `LIMIT ${count} OFFSET ${offset}`;

    // Creates schemas
    const schemas = store.query(`
        SELECT ContentId
        FROM Contents
        ${limit};
    `).all() as Schema[];

    // Creates uuids
    const uuids = schemas.map((schema) => schema.ContentId);

    // Returns uuids
    return uuids;
}

// Creates search function
export async function search(filter: Filter, count: number, page: number): Promise<string[]> {
    // Creates predicates
    const predicates: string[] = [];
    const values: (string | number)[] = [];

    // Creates extension predicates
    if(filter.extension !== null) {
        // Appends predicates
        predicates.push(`Extension LIKE ? ESCAPE '\\'`);
        values.push(`%${escape(filter.extension)}%`);
    }

    // Creates mime predicates
    if(filter.mime !== null) {
        // Appends predicates
        predicates.push(`Mime LIKE ? ESCAPE '\\'`);
        values.push(`%${escape(filter.mime)}%`);
    }

    // Creates name predicates
    if(filter.name !== null) {
        // Appends predicates
        predicates.push(`Mime LIKE ? ESCAPE '\\'`);
        values.push(`%${escape(filter.name)}%`);
    }

    // Creates size predicates
    if(filter.size.minimum !== null && filter.size.maximum !== null) {
        // Appends predicates
        predicates.push("Size Between ? AND ?");
        values.push(filter.size.minimum);
        values.push(filter.size.maximum);
    }
    else if(filter.size.minimum !== null) {
        // Appends predicates
        predicates.push("Size >= ?");
        values.push(filter.size.minimum);
    }
    else if(filter.size.maximum !== null) {
        // Appends predicates
        predicates.push("Size <= ?");
        values.push(filter.size.maximum);
    }

    // Creates tags predicates
    if(filter.tags !== null) {
        // Appends predicates
        for(let i = 0; i < filter.tags.length; i++) {
            const tag = filter.tags[i]!;
            predicates.push("',' || Tags || ',' LIKE ? ESCAPE '\\'");
            values.push(`%,${escape(tag)},%`);
        }
    }

    // Creates time predicates
    if(filter.time.begin !== null && filter.time.end !== null) {
        // Appends predicates
        predicates.push("Time Between ? AND ?");
        values.push(filter.time.begin.getTime());
        values.push(filter.time.end.getTime());
    }
    else if(filter.time.begin !== null) {
        // Appends predicates
        predicates.push("Time >= ?");
        values.push(filter.time.begin.getTime());
    }
    else if(filter.time.end !== null) {
        // Appends predicates
        predicates.push("Time <= ?");
        values.push(filter.time.end.getTime());
    }

    // Creates uuid predicates
    if(filter.uuid !== null) {
        // Appends predicates
        predicates.push("ContentId = ?");
        values.push(escape(filter.uuid));
    }

    // Creates conditions
    const joint = filter.loose === true ? " OR " : " AND ";
    const conditions = predicates.length === 0 ? "" : `WHERE ${predicates.join(joint)}`;

    // Creates arrangement
    const order = {
        "ascending": "ASC",
        "descending" : "DESC"
    }[filter.order === null ? "descending" : filter.order];
    const sort = {
        "name": "Name, Time, Size, ContentId",
        "size": "Size, Time, Name, ContentId",
        "time": "Time, Name, Size, ContentId",
        "uuid": "ContentId"
    }[filter.sort === null ? "time" : filter.sort];
    const arrangement = `ORDER BY ${sort} ${order}`;

    // Creates limit
    const offset = count * page;
    const limit = `LIMIT ${count} OFFSET ${offset}`;

    // Creates schemas
    const schemas = store.query(`
        SELECT ContentId
        FROM Contents
        ${conditions}
        ${arrangement}
        ${limit};
    `).all(...values) as Schema[];

    // Creates uuids
    const uuids = schemas.map((schema) => schema.ContentId);

    // Returns uuids
    return uuids;
}

// Defines add function
export async function add(source: Source): Promise<Content> {
    // Creates uuid
    const uuid = Bun.randomUUIDv7();

    // Checks type
    const type = await fileTypeFromBuffer(source.buffer);
    if(typeof type === "undefined")
        throw new except.Exception(except.Code.UNSUPPORTED_MIME);
    const extension = type.ext;
    const mime = type.mime;
    if(!mime.startsWith("image/") && !mime.startsWith("video/"))
        throw new except.Exception(except.Code.UNSUPPORTED_MIME);

    // Checks size
    const size = source.buffer.byteLength;
    const status = await info();
    if(size > env.fileLimit || status.size + size > env.storeLimit)
        throw new except.Exception(except.Code.LARGE_SOURCE);

    // Creates file
    const file = Bun.file(nodePath.resolve(env.filesPath, uuid));

    // Creates content
    const content: Content = {
        buffer: source.buffer,
        data: source.data,
        extension: extension,
        file: file,
        mime: mime,
        name: source.name,
        size: size,
        tags: source.tags,
        time: source.time,
        uuid: uuid
    };

    // Updates values
    await content.file.write(content.buffer);
    store.run(`
        INSERT INTO Contents (ContentId, Data, Extension, Mime, Name, Size, Tags, Time)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
        content.uuid,
        JSON.stringify(content.data),
        content.extension,
        content.mime,
        content.name,
        content.size,
        content.tags.join(","),
        content.time.getTime()
    ]);

    // Returns content
    return content;
}

// Defines update function
export async function update(uuid: string, source: Partial<Source>): Promise<Content> {
    // Tests content
    if(!(await test(uuid)))
        throw new except.Exception(except.Code.MISSING_CONTENT);

    // Creates pairs
    const keys: string[] = [];
    const values: (string | number)[] = [];

    // Creates buffer pairs
    if(typeof source.buffer !== "undefined") {
        // Checks type
        const type = await fileTypeFromBuffer(source.buffer);
        if(typeof type === "undefined")
            throw new except.Exception(except.Code.UNSUPPORTED_MIME);
        const extension = type.ext;
        const mime = type.mime;
        if(!mime.startsWith("image/") && !mime.startsWith("video/"))
            throw new except.Exception(except.Code.UNSUPPORTED_MIME);
    
        // Checks size
        const size = source.buffer.byteLength;
        const status = await info();
        if(size > env.fileLimit || status.size + size > env.storeLimit)
            throw new except.Exception(except.Code.LARGE_SOURCE);

        // Appends pairs
        keys.push("Extension", "Mime", "Size");
        values.push(extension, mime, size);
    }

    // Creates data pairs
    if(typeof source.data !== "undefined") {
        // Appends pairs
        keys.push("Data");
        values.push(JSON.stringify(source.data));
    }

    // Creates name pairs
    if(typeof source.name !== "undefined") {
        // Appends pairs
        keys.push("Name");
        values.push(source.name);
    }

    // Creates tags pairs
    if(typeof source.tags !== "undefined") {
        // Appends pairs
        keys.push("Tags");
        values.push(source.tags.join(","));
    }

    // Creates time pairs
    if(typeof source.time !== "undefined") {
        // Appends pairs
        keys.push("Time");
        values.push(source.time.getTime());
    }

    // Appends uuid
    values.push(uuid);

    // Updates values
    if(typeof source.buffer !== "undefined")
        await Bun.file(nodePath.resolve(env.filesPath, uuid)).write(source.buffer);
    store.run(`
        UPDATE Contents
        SET ${keys.map((key) => `${key} = ?`).join(", ")}
        WHERE ContentId = ?;
    `, values);

    // Creates content
    const content = query(uuid);
    
    // Returns content
    return content;
}

// Defines remove function
export async function remove(uuid: string): Promise<Content> {
    // Tests content
    if(!(await test(uuid)))
        throw new except.Exception(except.Code.MISSING_CONTENT);
    
    // Creates content
    const content = await query(uuid);

    // Updates values
    await content.file.delete();
    store.run(`
        DELETE FROM Contents
        WHERE ContentId = ?;
    `, [ content.uuid ]);

    // Returns content
    return content;
}

// Defines info function
export async function info(): Promise<Status> {
    // Fetches length
    const length = (store.prepare(`
        SELECT COUNT(ContentId)
        FROM Contents;
    `).get() as { "COUNT(ContentId)": number })["COUNT(ContentId)"];

    // Fetches size
    const size = (await nodeFile.readdir(env.filesPath))
        .map((file) => Bun.file(nodePath.resolve(env.filesPath, file)).size)
        .reduce((accumulator, current) => accumulator + current, 0);

    // Creates status
    const status: Status = {
        length: length,
        size: size
    };

    // Returns status
    return status;
}
