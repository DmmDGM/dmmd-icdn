// Imports
import bunSqlite from "bun:sqlite";
import nodeFile from "node:fs/promises";
import nodePath from "node:path";
import * as env from "./env";
import * as except from "./except";
import * as inspect from "./inspect";

// Defines content type
export type Content<Data extends object> = {
    buffer: ArrayBuffer;
    data: Data;
    extension: string;
    file: Bun.BunFile;
    mime: string;
    name: string;
    size: number;
    tags: string[];
    time: Date;
    uuid: string;
};

// Definse packet type
export type Packet<Data extends object> = {
    data: Data;
    extension: string;
    mime: string;
    name: string;
    size: number;
    tags: string[];
    time: number;
    uuid: string;
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

// Defines source type
export type Source<Data extends object> = Omit<Content<Data>, "uuid">;

// Defines status type
export type Status = {
    fileLimit: number;
    length: number;
    protected: boolean;
    size: number;
    storeLimit: number;
};

// Creates store
export const store = bunSqlite.open(env.storePath);
if(!await nodeFile.exists(env.filesPath)) await nodeFile.mkdir(env.filesPath);
store.run(`
    CREATE TABLE IF NOT EXISTS Contents (
        ContentId TEXT UNIQUE PRIMARY KEY,
        Data TEXT NOT NULL,
        Extension TEXT NOT NULL,
        Mime TEXT NOT NULL,
        Name TEXT NOT NULL,
        Size INTEGER,
        Tags TEXT NOT NULL,
        Time INTEGER
    );
`);

// Defines query function
export async function query<Data extends object>(uuid: string): Promise<Content<Data> | null> {
    // Creates query
    const schema = store.query(`
        SELECT ContentId, Data, Extension, Mime, Name, Size, Tags, Time
        FROM Contents
        WHERE ContentId = ?
        LIMIT 1;
    `).get(uuid) as Schema | null;
    if(schema === null) return null;

    // Creates file
    const file = Bun.file(nodePath.resolve(env.filesPath, schema.ContentId));

    // Returns query
    return {
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
}

// Defines search function
export function search(filter: {
    begin?: Date,
    end?: Date,
    extension?: string,
    loose?: boolean,
    maximum?: number,
    mime?: string,
    minimum?: number,
    name?: string,
    order?: "ascending" | "descending",
    sort?: "name" | "size" | "time" | "uuid",
    tags?: string[],
    uuid?: string,
} = {}, count: number = 25, page: number = 0): string[] {
    // Creates escaper
    const escape = (string: string) => string.replace(/[\\%_]/g, "\\$0");

    // Creates conditions
    let predicates: string[] = [];
    let values: (string | number)[] = [];
    if(typeof filter.begin !== "undefined" && typeof filter.end !== "undefined") {
        predicates.push("Time Between ? AND ?");
        values.push(filter.begin.getTime());
        values.push(filter.end.getTime());
    }
    else if(typeof filter.begin !== "undefined") {
        predicates.push("Time >= ?");
        values.push(filter.begin.getTime());
    }
    else if(typeof filter.end !== "undefined") {
        predicates.push("Time <= ?");
        values.push(filter.end.getTime());
    }
    if(typeof filter.minimum !== "undefined" && typeof filter.maximum !== "undefined") {
        predicates.push("Size Between ? AND ?");
        values.push(filter.minimum);
        values.push(filter.maximum);
    }
    else if(typeof filter.minimum !== "undefined") {
        predicates.push("Size >= ?");
        values.push(filter.minimum);
    }
    else if(typeof filter.maximum !== "undefined") {
        predicates.push("Time <= ?");
        values.push(filter.maximum);
    }
    if(typeof filter.extension !== "undefined") {
        predicates.push(`Extension LIKE ? ESCAPE '\\'`);
        values.push(`%${escape(filter.extension)}%`);
    }
    if(typeof filter.mime !== "undefined") {
        predicates.push(`Mime LIKE ? ESCAPE '\\'`);
        values.push(`%${escape(filter.mime)}%`);
    }
    if(typeof filter.name !== "undefined") {
        predicates.push(`Name LIKE ? ESCAPE '\\'`);
        values.push(`%${escape(filter.name)}%`);
    }
    if(typeof filter.tags !== "undefined") {
        predicates = predicates.concat(new Array(filter.tags.length).fill(
            "',' || Tags || ',' LIKE ? ESCAPE '\\'"
        ));
        values = values.concat(filter.tags.map((tag) => 
            `%,${escape(tag)},%`
        ));
    }
    if(typeof filter.uuid !== "undefined") {
        predicates.push(`ContentId = ?`);
        values.push(filter.uuid);
    }
    const join = filter.loose === true ? " OR " : " AND ";
    const conditions = predicates.length === 0 ? "" : `WHERE ${predicates.join(join)}`;

    // Creates sort
    const order = typeof filter.order === "undefined" || filter.order === "descending" ? "DESC" : "ASC";
    const sort = `ORDER BY ${{
        "name": "Name, Time, Size, ContentId",
        "size": "Size, Time, Name, ContentId",
        "time": "Time, Name, Size, ContentId",
        "uuid": "ContentId"
    }[typeof filter.sort === "undefined" ? "time" : filter.sort]} ${order}`;

    // Creates limit
    const offset = Math.max(count * page, 0);
    const limit = isFinite(count) && count > 0 ?
        `LIMIT ${Math.trunc(count)} OFFSET ${Math.trunc(offset)}` : "";
    
    // Creates query
    const schemas = store.query(`
        SELECT ContentId
        FROM Contents
        ${conditions}
        ${sort}
        ${limit};
    `).all(...values) as Schema[];

    // Returns query
    return schemas.map((schema) => schema.ContentId);
}

// Defines list function
export function list(count: number = 25, page: number = 0): string[] {
    // Creates limit
    const offset = count * page;
    const limit = isFinite(count) ? `LIMIT ${count} OFFSET ${offset}` : "";
    
    // Creates query
    const schemas = store.query(`
        SELECT ContentId
        FROM Contents
        ${limit};
    `).all() as Schema[];

    // Returns query
    return schemas.map((schema) => schema.ContentId);
}

// Defines add function
export async function add<Data extends object>(source: Source<Data>): Promise<Content<Data>> {
    // Creates uuid
    const uuid = Bun.randomUUIDv7();
    
    // Checks source file
    if(!inspect.checkMime(source.mime))
        throw new except.Exception(except.Code.UNSUPPORTED_MIME);
    if(!inspect.checkSize(await size(), source.size))
        throw new except.Exception(except.Code.LARGE_SOURCE);

    // Creates file
    const file = Bun.file(nodePath.resolve(env.filesPath, uuid));
    
    // Adds data
    await file.write(source.buffer);
    store.run(`
        INSERT INTO Contents (ContentId, Data, Extension, Mime, Name, Size, Tags, Time)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
        uuid,
        JSON.stringify(source.data),
        source.extension,
        source.mime,
        source.name,
        source.size,
        source.tags.join(","),
        source.time.getTime()
    ]);

    // Returns content
    const content: Content<Data> = {
        buffer: source.buffer,
        data: source.data,
        extension: source.extension,
        file: file,
        mime: source.mime,
        name: source.name,
        size: source.size,
        tags: source.tags,
        time: source.time,
        uuid: uuid
    };
    return content;
}

// Defines update function
export async function update<Data extends object>(
    uuid: string,
    source: Partial<Source<Data>>
): Promise<Content<Data>> {
    // Checks uuid
    const existing = await query<Data>(uuid);
    if(existing === null)
        throw new except.Exception(except.Code.MISSING_CONTENT);
    
    // Creates predicates
    let keys: string[] = [];
    let values: (string | number)[] = [];

    // Updates file
    if(
        "buffer" in source &&
        typeof source.buffer !== "undefined" &&
        "extension" in source &&
        typeof source.extension !== "undefined" &&
        "file" in source &&
        typeof source.file !== "undefined" &&
        "mime" in source &&
        typeof source.mime !== "undefined" &&
        "size" in source &&
        typeof source.size !== "undefined"
    ) {
        // Checks source file
        if(!inspect.checkMime(source.mime))
            throw new except.Exception(except.Code.UNSUPPORTED_MIME);
        if(!inspect.checkSize(await size(), source.size, existing.size))
            throw new except.Exception(except.Code.LARGE_SOURCE);

        // Updates file
        await source.file.write(source.buffer);
        
        // Appends predicates
        keys = keys.concat([ "Extension", "Mime", "Size" ]);
        values = values.concat([ source.extension, source.mime, source.size ]);
    }
    
    // Parses fields
    if("data" in source && typeof source.data !== "undefined") {
        keys.push("Data");
        values.push(JSON.stringify(source.data));
    }
    if("name" in source && typeof source.name !== "undefined") {
        keys.push("Name");
        values.push(source.name);
    }
    if("tags" in source && typeof source.tags !== "undefined") {
        keys.push("Tags");
        values.push(source.tags.join(","));
    }
    if("time" in source && typeof source.time !== "undefined") {
        keys.push("Time");
        values.push(source.time.getTime());
    }
    values.push(uuid);

    // Updates fields
    store.run(`
        UPDATE Contents
        SET ${keys.map((key) => `${key} = ?`).join(", ")}
        WHERE ContentId = ?;
    `, values);

    // Returns content
    const content = (await query<Data>(uuid))!;
    return content;
}

// Defines remove function
export async function remove<Data extends object>(uuid: string): Promise<Content<Data>> {
    // Checks content
    const content = (await query<Data>(uuid))!;
    if(content === null)
        throw new except.Exception(except.Code.MISSING_CONTENT);

    // Removes content
    await content.file.delete();
    store.run(`
        DELETE FROM Contents
        WHERE ContentId = ?;
    `, [ content.uuid ]);

    // Returns content
    return content;
}

// Defines length function
export function length(): number {
    // Fetches length
    const count = (store.prepare(`
        SELECT COUNT(ContentId) FROM Contents;
    `).get() as { "COUNT(ContentId)": number })["COUNT(ContentId)"];

    // Returns length
    return count;
}

// Defines size function
export async function size(): Promise<number> {
    // Fetches size
    const total = (await nodeFile.readdir(env.filesPath))
        .map((file) => Bun.file(nodePath.resolve(env.filesPath, file)).size)
        .reduce((accumulator, current) => accumulator + current, 0);

    // Returns size
    return total;
}

// Defines status function
export async function status(): Promise<Status> {
    // Returns response
    return {
        fileLimit: env.fileLimit,
        length: length(),
        protected: env.token.length > 0,
        size: await size(),
        storeLimit: env.storeLimit
    };
}

// Defines pack function
export function pack<Data extends object>(content: Content<Data>): Packet<Data> {
    // Creates packet
    const packet: Packet<Data> = {
        data: content.data,
        extension: content.extension,
        mime: content.mime,
        name: content.name,
        size: content.size,
        tags: content.tags,
        time: content.time.getTime(),
        uuid: content.uuid
    };

    // Returns packet
    return packet;
}
