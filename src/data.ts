// Imports
import type { BunFile } from "bun";
import bunSqlite from "bun:sqlite";
import nodePath from "node:path";
import * as env from "./env";

// Defines content type
export type Content<Data extends object> = {
    data: Data;
    file: BunFile;
    name: string;
    tags: string[];
    timestamp: Date;
    type: string;
    uuid: string;
};

// Defines schema type
export type Schema = {
    ContentId: string;
    Data: string;
    Name: string;
    Tags: string;
    Timestamp: number;
    Type: string;
};

// Defines source type
export type Source<Data extends object> = {
    data: Data;
    file: BunFile;
    name: string;
    tags: string[];
    timestamp: Date;
};

// Creates database
export const contents = bunSqlite.open(env.dataPath);
contents.run(`
    CREATE TABLE IF NOT EXISTS Contents (
        ContentId TEXT NOT NULL UNIQUE PRIMARY KEY,
        Data TEXT NOT NULL,
        Name TEXT NOT NULL,
        Tags TEXT NOT NULL,
        Timestamp INTEGER
        Type TEXT NOT NULL,
    );
`);

// Defines fetchers
export function query<Data extends object>(uuid: string): Content<Data> | null {
    // Creates query
    const content = contents.query(`
        SELECT ContentId, Data, Name, Tags, Timestamp, Type
        FROM Contents
        WHERE ContentId = ?;
    `).get(uuid) as Schema | null;

    // Returns query
    return content === null ? null : {
        data: JSON.parse(content.Data),
        file: Bun.file(nodePath.resolve(env.contentPath, uuid) + "." + content.Type),
        name: content.Name,
        tags: content.Tags.split(","),
        timestamp: new Date(content.Timestamp),
        type: content.Type,
        uuid: content.ContentId
    };
}

export async function update<Data extends object>(content: Content<Data>): Promise<void> {
    // Inserts content
    if(!query<Data>(content.uuid)) throw new Error("Content not found");

    // Inserts content
    contents.run(`
        UPDATE Contents
        SET Data = ?,
            Name = ?,
            Tags = ?,
            Timestamp = ?
            Type = ?,
        WHERE ContentId = ?
    `, [
        JSON.stringify(content.data),
        content.name,
        content.tags.join(","),
        content.timestamp.getTime(),
        content.type,
        content.uuid
    ]);
}

export async function add<Data extends object>(source: Source<Data>): Promise<Content<Data>> {
    // Checks source file validity
    if(!source.file.exists()) throw new Error("Source file does not exist");
    if(!source.file.type.startsWith("image") && !source.file.type.startsWith("video"))
        throw new Error("Source file MIME type not accepted");

    // Generates uuid
    const uuid = Bun.randomUUIDv7();
    const path = source.file.name;
    const file = Bun.file(nodePath.resolve(env.contentPath, uuid));

    // Checks path validity
    if(typeof path === "undefined") throw new Error("Source file path is invalid");

    // Checks file availability
    if(await file.exists()) throw new Error("Content file already exists");
    
    // Parses path
    const chunks = path.split(".");
    const name = chunks.slice(0, -1).join(".");
    const type = chunks[chunks.length - 1];

    // Prevents empty type
    if(typeof type === "undefined") throw new Error("Source file extension is invalid");
    
    // Creates content
    const content: Content<Data> = {
        data: source.data,
        file: Bun.file(),
    }
    await , await source.file.arrayBuffer());
    contents.run(`
        INSERT INTO Contents (ContentId, Data, Name, Tags, Timestamp, Type)
        VALUES (?, ?, ?, ?, ?, ?)
    `, [
        uuid,
        JSON.stringify(source.data),
        name,
        source.tags.join(","),
        source.timestamp.getTime(),
        type
    ]);

    // Returns content
    
}



export async function remove<Data extends object>(uuid: string): Promise<Content<Data> | null> {
    // Creates query
    const content = query<Data>(uuid);

    // Deletes content
    if(content === null) return null;
    await content.file.delete();
    contents.run(`
        DELETE FROM Content
        WHERE ContentId = ?
    `, [ content.uuid ]);
    return content;
}

console.log(query("ok"));

