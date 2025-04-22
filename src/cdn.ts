// Imports
import bunSqlite from "bun:sqlite";
import nodeFile from "node:fs/promises";
import nodePath from "node:path";
import { fileTypeFromBuffer } from "file-type";
import sharp from "sharp";
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
    preview: Bun.BunFile;
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
        minimum: number | null;
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

// Defines source type
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

// Defines summary type
export type Summary = {
    data: object;
    extension: string;
    mime: string;
    name: string;
    size: number;
    tags: string[];
    time: number;
    uuid: string;
};

// Defines escape function
export function escape(text: string): string {
    // Returns formatted
    return text.replaceAll(/[\\%_]/g, "\\$0");
}

// Defines snapshot function
export async function snapshot(uuid: string, buffer: ArrayBuffer): Promise<Buffer> {
    // Creates mime
    const type = await fileTypeFromBuffer(buffer);
    if(typeof type === "undefined")
        throw new except.Exception(except.Code.UNSUPPORTED_MIME);
    const mime = type.mime;

    // Creates path
    const path = nodePath.resolve(env.filesPath, uuid);
    if(!(await nodeFile.exists(path)))
        throw new except.Exception(except.Code.MISSING_CONTENT);

    // Creates preview
    let original = buffer;

    // Generates frame
    if(mime.startsWith("video/")) {
        // Creates ffprobe
        const ffprobe = Bun.spawn([
            nodePath.resolve(env.ffmpegPath, "ffprobe"),
            "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            path,
        ], {
            stdout: "pipe",
            stderr: "ignore"
        });
    
        // Creates time
        const float = parseFloat((await new Response(ffprobe.stdout).text()).trim());
        const seconds = isNaN(float) ? 0 : Math.trunc(Math.min(float / 2, 10));
        const time = `00:00:${seconds.toString().padStart(2, "0")}`;
    
        // Creates ffmpeg
        const ffmpeg = Bun.spawn([
            nodePath.resolve(env.ffmpegPath, "ffmpeg"),
            "-ss", time,
            "-i", path,
            "-frames:v", "1",
            "-q:v", "2",
            "-f", "image2",
            "-vcodec", "png",
            "pipe:1"
        ], {
            stdout: "pipe",
            stderr: "ignore"
        });
    
        // Creates stream
        const clip = await new Response(ffmpeg.stdout).arrayBuffer();
        original = clip;
    }
    
    // Creates frame
    const frame = await sharp(original).resize({ height: 240 }).avif().toBuffer();
    
    // Returns frame
    return frame;
}

// Creates store
export const store = await create();

// Defines create function
export async function create(): Promise<bunSqlite> {
    // Creates files directory
    if(!await nodeFile.exists(env.filesPath))
        await nodeFile.mkdir(env.filesPath);

    // Creates previews directory
    if(!await nodeFile.exists(env.previewsPath))
        await nodeFile.mkdir(env.previewsPath);

    // Creates database
    const database = bunSqlite.open(env.storePath);
    database.run(`
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

    // Returns database
    return database;
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
    const preview = Bun.file(nodePath.resolve(env.previewsPath, schema.ContentId));
    const content = {
        buffer: await file.arrayBuffer(),
        data: JSON.parse(schema.Data),
        extension: schema.Extension,
        file: file,
        size: schema.Size,
        mime: schema.Mime,
        name: schema.Name,
        preview: preview,
        tags: schema.Tags.split(","),
        time: new Date(schema.Time),
        uuid: schema.ContentId
    };

    // Returns content
    return content;
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

    // Creates extension predicate
    if(filter.extension !== null) {
        // Appends predicate
        predicates.push(`Extension LIKE ? ESCAPE '\\'`);
        values.push(`%${escape(filter.extension)}%`);
    }

    // Creates mime predicate
    if(filter.mime !== null) {
        // Appends predicate
        predicates.push(`Mime LIKE ? ESCAPE '\\'`);
        values.push(`%${escape(filter.mime)}%`);
    }

    // Creates name predicate
    if(filter.name !== null) {
        // Appends predicate
        predicates.push(`Name LIKE ? ESCAPE '\\'`);
        values.push(`%${escape(filter.name)}%`);
    }

    // Creates size predicates
    if(filter.size.minimum !== null && filter.size.maximum !== null) {
        // Appends predicatea
        predicates.push("Size Between ? AND ?");
        values.push(filter.size.minimum);
        values.push(filter.size.maximum);
    }
    else if(filter.size.minimum !== null) {
        // Appends predicate
        predicates.push("Size >= ?");
        values.push(filter.size.minimum);
    }
    else if(filter.size.maximum !== null) {
        // Appends predicate
        predicates.push("Size <= ?");
        values.push(filter.size.maximum);
    }

    // Creates tags predicates
    if(filter.tags !== null) {
        // Appends predicate
        const tags = Array.from(new Set(filter.tags));
        for(let i = 0; i < tags.length; i++) {
            const tag = tags[i]!;
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
        // Appends predicate
        predicates.push("Time >= ?");
        values.push(filter.time.begin.getTime());
    }
    else if(filter.time.end !== null) {
        // Appends predicate
        predicates.push("Time <= ?");
        values.push(filter.time.end.getTime());
    }

    // Creates uuid predicate
    if(filter.uuid !== null) {
        // Appends predicate
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
    const preview = Bun.file(nodePath.resolve(env.previewsPath, uuid));

    // Creates content
    const content: Content = {
        buffer: source.buffer,
        data: source.data,
        extension: extension,
        file: file,
        mime: mime,
        name: source.name,
        preview: preview,
        size: size,
        tags: Array.from(new Set(source.tags)),
        time: source.time,
        uuid: uuid
    };

    // Updates values
    await content.file.write(content.buffer);
    await content.preview.write(await snapshot(content.uuid, content.buffer));
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
    // Creates original
    const original = await query(uuid);

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
        if(size > env.fileLimit || status.size + size - original.size > env.storeLimit)
            throw new except.Exception(except.Code.LARGE_SOURCE);

        // Appends pairs
        keys.push("Extension", "Mime", "Size");
        values.push(extension, mime, size);
    }

    // Creates data pair
    if(typeof source.data !== "undefined") {
        // Appends pair
        keys.push("Data");
        values.push(JSON.stringify(source.data));
    }

    // Creates name pair
    if(typeof source.name !== "undefined") {
        // Appends pair
        keys.push("Name");
        values.push(source.name);
    }

    // Creates tags pair
    if(typeof source.tags !== "undefined") {
        // Appends pair
        keys.push("Tags");
        values.push(Array.from(new Set(source.tags)).join(","));
    }

    // Creates time pair
    if(typeof source.time !== "undefined") {
        // Appends pair
        keys.push("Time");
        values.push(source.time.getTime());
    }

    // Appends uuid
    values.push(uuid);

    // Updates values
    if(typeof source.buffer !== "undefined") {
        await original.file.write(source.buffer);
        await original.preview.write(await snapshot(uuid, source.buffer));
    }
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
    await content.preview.delete();
    store.run(`
        DELETE FROM Contents
        WHERE ContentId = ?;
    `, [ content.uuid ]);

    // Returns content
    return content;
}

// Defines summarize function
export async function summarize(content: Content): Promise<Summary> {
    // Creates summary
    const summary: Summary = {
        data: content.data,
        extension: content.extension,
        mime: content.mime,
        name: content.name,
        size: content.size,
        tags: content.tags,
        time: content.time.getTime(),
        uuid: content.uuid
    };

    // Returns summary
    return summary;
}

// Ensures creation
await create();
