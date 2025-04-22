// Defines details function
export async function details() {
    // Creates response
    const response = await fetch("/details");
    const json = await response.json();
    if(!response.ok) throw new Error(json.message);
        
    // Creates details
    const details = {
        fileLimit: Number(json.fileLimit),
        protected: Boolean(json.protected),
        storeLength: Number(json.storeLength),
        storeLimit: Number(json.storeLimit),
        storeSize: Number(json.storeSize)
    };

    // Returns details
    return details;
}

// Defines query function
export async function query(uuid) {
    // Creates response
    const response = await fetch(`/query/${uuid}`);
    const json = await response.json();
    if(!response.ok) throw new Error(json.message);

    // Creates summary
    const summary = {
        data: Object(json.data),
        extension: String(json.extension),
        mime: String(json.mime),
        name: String(json.name),
        size: Number(json.size),
        tags: Array.from(json.tags).map((tag) => String(tag)),
        time: new Date(json.time),
        uuid: String(json.uuid)
    };

    // Returns summary
    return summary;
}

// Defines list uuids function
export async function listUUIDs(count, page) {
    // Creates response
    const response = await fetch(`/list?count=${count}&page=${page}`);
    const json = await response.json();
    if(!response.ok) throw new Error(json.message);

    // Creates uuids
    const uuids = Array.from(json).map((string) => String(string));

    // Returns uuids
    return uuids;
}

// Defines list summaries function
export async function listSummaries(count, page) {
    // Creates response
    const response = await fetch(`/list?count=${count}&page=${page}&query=true`);
    const json = await response.json();
    if(!response.ok) throw new Error(json.message);

    // Creates summaries
    const summaries = Array.from(json).map((object) => ({
        data: Object(object.data),
        extension: String(object.extension),
        mime: String(object.mime),
        name: String(object.name),
        size: Number(object.size),
        tags: Array.from(object.tags).map((tag) => String(tag)),
        time: new Date(object.time),
        uuid: String(object.uuid)
    }));

    // Returns summaries
    return summaries;
}
