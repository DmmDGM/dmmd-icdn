// Imports
import type { BunFile } from "bun";
import bunSqlite from "bun:sqlite";
import nodeFile from "node:fs/promises";
import nodePath from "node:path";
import * as env from "./env";

// Defines content type
export type Content<Data extends object> = {
    data: Data;
    file: BunFile;
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
export type Source<Data extends object> = {
    data: Data;
    file: BunFile;
    name: string;
    tags: string[];
    time: Date;
};

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

// Defines query function
export function query<Data extends object>(uuid: string): Content<Data> | null {
    // Creates query
    const schema = store.query(`
        SELECT ContentId, Data, Name, Tags, Time
        FROM Contents
        WHERE ContentId = ?
        LIMIT 1;
    `).get(uuid) as Schema | null;

    // Returns query
    if(schema === null) return null;
    return {
        data: JSON.parse(schema.Data),
        file: Bun.file(nodePath.resolve(env.contentPath, schema.ContentId)),
        name: schema.Name,
        tags: schema.Tags.split(","),
        time: new Date(schema.Time),
        uuid: schema.ContentId
    };
}

// Defines all function
export function all(): Content<object>[] {
    // Creates query
    const schemas = store.query(`
        SELECT ContentId
        FROM Contents
    `).all() as Schema[];

    // Returns query
    return schemas.map((schema) => query(schema.ContentId)!);
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
    const escape = (string: string) => string.replaceAll(/\\%_/g, "\\$0");

    // Creates conditions
    let parameters: string[] = [];
    if(typeof filter.begin !== "undefined" && typeof filter.end !== "undefined")
        parameters.push(`Time Between ${filter.begin.getTime()} AND ${filter.end.getTime()}`);
    else if(typeof filter.begin !== "undefined")
        parameters.push(`Time >= ${filter.begin.getTime()}`);
    else if(typeof filter.end !== "undefined")
        parameters.push(`Time <= ${filter.end.getTime()}`);
    if(typeof filter.name !== "undefined")
        parameters.push(`Name LIKE '%${escape(filter.name)}%' ESCAPE '\\'`);
    if(typeof filter.tags !== "undefined")
        parameters = parameters.concat(filter.tags.map((tag) =>
            `',' || Tags || ',' LIKE '%,${escape(tag.replaceAll(/,/g, ""))},%' ESCAPE '\\'`
        ));
    if(typeof filter.uuid !== "undefined")
        parameters.push(`ContentId = '${filter.uuid}'`);
    const join = filter.loose ? " OR " : " AND ";
    const conditions = parameters.length === 0 ? "" : `WHERE ${parameters.join(join)}`;

    // Creates sort
    const order = typeof filter.order === "undefined" || filter.order === "descending" ? "DESC" : "ASC";
    const sort = `ORDER BY ${{
        "name": "Name, Time, ContentId",
        "time": "Time, Name, ContentId",
        "uuid": "ContentId"
    }[typeof filter.sort === "undefined" ? "time" : filter.sort]} ${order}`;

    // Creates limit
    const offset = count * page;
    const limit = isFinite(count) ? `LIMIT ${count} OFFSET ${offset}` : "";
    
    // Creates query
    const schemas = store.query(`
        SELECT ContentId
        FROM Contents
        ${conditions} ${sort} ${limit};
    `).all() as Schema[];

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
    // Checks source
    if(!source.file.type.startsWith("image") && !source.file.type.startsWith("video"))
        throw new Error("Source file MIME type not accepted");

    // Creates content
    const uuid = Bun.randomUUIDv7();
    const content: Content<Data> = {
        data: source.data,
        file: Bun.file(nodePath.resolve(env.contentPath, uuid)),
        name: source.name,
        tags: source.tags,
        time: source.time,
        uuid: uuid
    };

    // Adds data
    await content.file.write(await source.file.bytes());
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
export async function update<Data extends object>(content: Content<Data>): Promise<Content<Data>> {
    // Checks content
    if(!query<Data>(content.uuid)) throw new Error("Content not found");

    // Updates content
    store.run(`
        UPDATE Contents
        SET Data = ?,
            Name = ?,
            Tags = ?,
            Time = ?,
        WHERE ContentId = ?
    `, [
        JSON.stringify(content.data),
        content.name,
        content.tags.join(","),
        content.time.getTime(),
        content.uuid
    ]);

    // Returns content
    return content;
}

// Defines remove function
export async function remove<Data extends object>(uuid: string): Promise<Content<Data> | null> {
    // Queries content
    const content = query<Data>(uuid);

    // Checks content
    if(content === null) return null;

    // Removes content
    await content.file.delete();
    store.run(`
        DELETE FROM Content
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
