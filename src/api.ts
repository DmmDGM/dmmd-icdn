// Imports
import bunSqlite from "bun:sqlite";
import nodeFile from "node:fs/promises";
import nodePath from "node:path";
import { fileTypeFromBuffer } from "file-type";
import * as env from "./env";

// Defines content type
export type Content<Data extends object> = {
    buffer: ArrayBuffer;
    data: Data;
    file: Bun.BunFile;
    mime: string;
    name: string;
    tags: string[];
    time: Date;
    uuid: string;
};

// Definse packet type
export type Packet<Data extends object> = {
    data: Data;
    name: string;
    tags: string[];
    time: number;
    uuid: string;
};

// Defines schema type
export type Schema = {
    ContentId: string;
    Data: string;
    Name: string;
    Tags: string;
    Time: number;
};

// Defines source type
export type Source<Data extends object> = Omit<Content<Data>, "uuid">;

// Creates store
export const store = bunSqlite.open(env.storePath);
store.run(`
    CREATE TABLE IF NOT EXISTS Contents (
        ContentId TEXT UNIQUE PRIMARY KEY,
        Data TEXT NOT NULL,
        Name TEXT NOT NULL,
        Tags TEXT NOT NULL,
        Time INTEGER
    );
`);

// Definse mime fetcher function
export async function getMime(buffer: ArrayBuffer): Promise<string> {
    // Checks type
    const type = await fileTypeFromBuffer(buffer);
    
    // Returns mime
    return typeof type === "undefined" || !checkMime(type.mime) ? "text/plain" : type.mime;
}

// Defines mime checker function
export function checkMime(mime: string): boolean {
    // Checks mime
    return mime.startsWith("image/") || mime.startsWith("video/");
}

// Defines size checker function
export async function checkSize(uuid: string, buffer: ArrayBuffer): Promise<boolean> {
    // Checks file size
    if(buffer.byteLength > env.fileLimit) return false;

    // Checks store size
    let included = false;
    const total = (await nodeFile.readdir(env.contentsPath))
        .map((file) => {
            included = included || file === uuid;
            return Bun.file(nodePath.resolve(env.contentsPath, file)).size;
        })
        .reduce((accumulator, current) => accumulator + current, 0);
    if(!included && total + buffer.byteLength > env.storeLimit) return false;

    // Returns true
    return true;
}

// Defines query function
export async function query<Data extends object>(uuid: string): Promise<Content<Data> | null> {
    // Creates query
    const schema = store.query(`
        SELECT ContentId, Data, Name, Tags, Time
        FROM Contents
        WHERE ContentId = ?
        LIMIT 1;
    `).get(uuid) as Schema | null;
    if(schema === null) return null;

    // Creates file
    const file = Bun.file(nodePath.resolve(env.contentsPath, schema.ContentId));
    const buffer = await file.arrayBuffer();

    // Returns query
    return {
        buffer: buffer,
        data: JSON.parse(schema.Data),
        file: file,
        mime: await getMime(buffer),
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
    loose?: boolean,
    name?: string,
    order?: "ascending" | "descending",
    sort?: "name" | "time" | "uuid",
    tags?: string[],
    uuid?: string,
} = {}, count: number = Infinity, page: number = 0): string[] {
    // Creates escaper
    const escape = (string: string) => string.replace(/[\\%_]/g, "\\$0");

    // Creates conditions
    let values: (string | number)[] = [];
    let parameters: string[] = [];
    if(typeof filter.begin !== "undefined" && typeof filter.end !== "undefined") {
        parameters.push("Time Between ? AND ?");
        values.push(filter.begin.getTime());
        values.push(filter.end.getTime());
    }
    else if(typeof filter.begin !== "undefined") {
        parameters.push("Time >= ?");
        values.push(filter.begin.getTime());
    }
    else if(typeof filter.end !== "undefined") {
        parameters.push("Time <= ?");
        values.push(filter.end.getTime());
    }
    if(typeof filter.name !== "undefined") {
        parameters.push(`Name LIKE ? ESCAPE '\\'`);
        values.push(`%${escape(filter.name)}%`);
    }
    if(typeof filter.tags !== "undefined") {
        parameters = parameters.concat(new Array(filter.tags.length).fill(
            "',' || Tags || ',' LIKE ? ESCAPE '\\'"
        ));
        values = values.concat(filter.tags.map((tag) => 
            `%,${escape(tag.replaceAll(/,/g, ""))},%`
        ));
    }
    if(typeof filter.uuid !== "undefined") {
        parameters.push(`ContentId = ?`);
        values.push(filter.uuid);
    }
    const join = filter.loose === true ? " OR " : " AND ";
    const conditions = parameters.length === 0 ? "" : `WHERE ${parameters.join(join)}`;

    // Creates sort
    const order = typeof filter.order === "undefined" || filter.order === "descending" ? "DESC" : "ASC";
    const sort = `ORDER BY ${{
        "name": "Name, Time, ContentId",
        "time": "Time, Name, ContentId",
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
        ${conditions} ${sort} ${limit};
    `).all(...values) as Schema[];

    // Returns query
    return schemas.map((schema) => schema.ContentId);
}

// Defines list function
export function list(count: number = Infinity, page: number = 0): string[] {
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
    if(!checkMime(source.mime))
        throw new Error("Source file MIME type not accepted");
    if(!await checkSize(uuid, source.buffer))
        throw new Error("Source file size exceeds limit");

    // Checks content
    const content: Content<Data> = {
        buffer: source.buffer,
        data: source.data,
        file: Bun.file(nodePath.resolve(env.contentsPath, uuid)),
        mime: source.mime,
        name: source.name,
        tags: source.tags,
        time: source.time,
        uuid: uuid
    };
    
    // Adds data
    await content.file.write(content.buffer);
    store.run(`
        INSERT INTO Contents (ContentId, Data, Name, Tags, Time)
        VALUES (?, ?, ?, ?, ?)
    `, [
        content.uuid,
        JSON.stringify(content.data),
        content.name,
        content.tags.join(","),
        content.time.getTime()
    ]);

    // Returns content
    return content;
}

// Defines update function
export async function update<Data extends object>(
    uuid: string,
    source: Partial<Source<Data>>
): Promise<Content<Data>> {
    // Checks uuid
    if(!query<Data>(uuid)) throw new Error("Content not found");

    // Updates file
    if(
        "buffer" in source &&
        typeof source.buffer !== "undefined" &&
        "file" in source &&
        typeof source.file !== "undefined" &&
        "mime" in source &&
        typeof source.mime !== "undefined"
    ) {
        // Checks source file
        if(!await checkMime(source.mime))
            throw new Error("Source file MIME type not accepted");
        if(!await checkSize(uuid, source.buffer))
            throw new Error("Source file size exceeds limit");

        // Updates file
        await source.file.write(await source.file.arrayBuffer());
    }
    
    // Parses fields
    const keys: string[] = [];
    const values: (string | number)[] = [];
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
        WHERE ContentId = ?
    `, values);

    // Returns content
    const content = (await query<Data>(uuid))!;
    return content;
}

// Defines remove function
export async function remove<Data extends object>(uuid: string): Promise<Content<Data>> {
    // Checks content
    const content = (await query<Data>(uuid))!;
    if(content === null) throw new Error("Content not found");

    // Removes content
    await content.file.delete();
    store.run(`
        DELETE FROM Contents
        WHERE ContentId = ?
    `, [ content.uuid ]);

    // Returns content
    return content;
}

// Defines pack function
export function pack<Data extends object>(content: Content<Data>): Packet<Data> {
    // Creates packet
    const packet: Packet<Data> = {
        data: content.data,
        name: content.name,
        tags: content.tags,
        time: content.time.getTime(),
        uuid: content.uuid
    };

    // Returns packet
    return packet;
}
