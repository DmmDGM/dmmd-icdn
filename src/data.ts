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

// Creates database
export const contents = bunSqlite.open(env.dataPath);
contents.run(`
    CREATE TABLE IF NOT EXISTS Contents (
        ContentId TEXT NOT NULL UNIQUE PRIMARY KEY,
        Data TEXT NOT NULL,
        Name TEXT NOT NULL,
        Tags TEXT NOT NULL,
        Time INTEGER
    );
`);

// Defines query function
export function query<Data extends object>(uuid: string): Content<Data> | null {
    // Creates query
    const schema = contents.query(`
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

// Defines search function
export function search(filter: {
    begin?: Date,
    end?: Date,
    loose?: boolean,
    order?: "ascending" | "descending",
    name?: string,
    sort?: "name" | "time" | "uuid",
    tags?: string[],
    uuid?: string,
} = {}, count: number = 25, page: number = 0): Content<object>[] {
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
        parameters.push(`ContentId = ${filter.uuid}`);
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
    const limit = `LIMIT ${count} OFFSET ${offset}`;
    
    // Creates query
    const schemas = contents.query(`
        SELECT ContentId, Data, Name, Tags, Time
        FROM Contents
        ${conditions} ${sort} ${limit};
    `).all() as Schema[];

    // Returns query
    return schemas.map((schema) => ({
        data: JSON.parse(schema.Data),
        file: Bun.file(nodePath.resolve(env.contentPath, schema.ContentId)),
        name: schema.Name,
        tags: schema.Tags.split(","),
        time: new Date(schema.Time),
        uuid: schema.ContentId
    }));
}

// Defines all function
export function all(): Content<object>[] {
    // Creates query
    const schemas = contents.query(`
        SELECT ContentId, Data, Name, Tags, Time
        FROM Contents
    `).all() as Schema[];

    // Returns query
    return schemas.map((schema) => ({
        data: JSON.parse(schema.Data),
        file: Bun.file(nodePath.resolve(env.contentPath, schema.ContentId)),
        name: schema.Name,
        tags: schema.Tags.split(","),
        time: new Date(schema.Time),
        uuid: schema.ContentId
    }));
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
    contents.run(`
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
    contents.run(`
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
    contents.run(`
        DELETE FROM Content
        WHERE ContentId = ?
    `, [ content.uuid ]);

    // Returns content
    return content;
}
