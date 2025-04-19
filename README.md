# DmmD / Image CDN (dmmd-icdn)

## About

A simple localhost content delivery network for images and videos.

## Installation

```sh
# Clone from source
git clone https://github.com/dmmdgm/dmmd-icdn
cd dmmd-icdn

# Install modules
bun i

# Starts localhost server
bun run start
```

## Configuration

All project configuration should be placed inside of the `.env` file in your working directory.

> [!NOTE]
> All keys displayed are optional. The indicated values are the internal default values.

```env
# Specifies the directory where all contents should be placed.
CONTENTS_PATH="contents/"

# Specifies the maximum content file limit in bytes.
FILE_LIMIT=10485760

# Specifies the port the localhost server will be hosted on.
PORT=1364

# Specifies the maximum total file limit in bytes.
STORE_LIMIT=53687091200

# Specifies the file destination where the sqlite database should be placed.
STORE_PATH="store.sqlite"

# Specifies the password or token needed to access /add /update and /remove endpoints. If empty, token requirement is removed.
TOKEN=""
```

## API

### (GET) `/content/<uuid>`

Returns the raw image associated with the uuid.

### (GET) `/data/<uuid>`

Returns the content data associated with the uuid in the follow format:

```ts
type Packet = {
    data: object;
    name: string;
    tags: string[];
    time: number;
    uuid: string;
};
```

### (GET) `/search`

Returns a list of uuids of the contents that satisfy the filter. Below are the available parameters:

| Parameter | Description |
|-|-|
| `?begin=number` | All content must have an associated time after the specified timestamp. |
| `?count=number` | The number of uuids returned per page. Settings the value to `0` removes the limit. Default is `25`. |
| `?end=number` | All content must have an associated time before the specified timestamp. |
| `?loose=boolean` | If `true`, all filters must be satisfied for the content uuid to be returned. If `false`, only at least one filter must be satisfied for the content uuid to be returned. Default is `false`. |
| `?name=string` | All content must contain partially or completely the specified name. |
| `?order=ascending\|descending` | Whether the returned uuids should be sorted in ascending or descending order. Default is `descending`. |
| `?page=number` | Page offset. Starting with `0` as the first page. Default is `0`. |
| `?sort=name\|time\|uuid` | Sorting algorithm. Default is `time`. |
| `?tags=csv` | All content must contain the specified tags. If multiple is specified, tags should be separated by commas. If `?loose=true`, the tags filter is also searched loosely. |
| `?uuid=string` | The content must have the complete and exact uuid as the specified uuid. |

### (GET) `/all`

Returns all content data. Below are the available parameters:

| Parameter | Description |
|-|-|
| `?count=number` | The number of uuids returned per page. Settings the value to `0` removes the limit. Default is `25`. |
| `?page=number` | Page offset. Starting with `0` as the first page. Default is `0`. |

### (GET) `/list`

Returns all uuids. Below are the available parameters:

| Parameter | Description |
|-|-|
| `?count=number` | The number of uuids returned per page. Settings the value to `0` removes the limit. Default is `25`. |
| `?page=number` | Page offset. Starting with `0` as the first page. Default is `0`. |

### (POST) `/add`

Adds a content to the CDN. Requires the `json` and `file` form data.

The `json` form data must contain the following format:
```ts
type Packet = {
    data: object;
    name: string;
    tags: string[];
    token?: string;
    time: number;
};
```

The `file` form data must contain an image or a video blob.

### (POST) `/update`

Updates a content of the specified uuid. Modifying the associated data requires the `json` form data. Modifying the associated file requires the `file` form data.

The `json` form data must contain the following format:
```ts
type Packet = {
    data?: object;
    name?: string;
    tags?: string[];
    token?: string;
    time?: number;
    uuid: string;
};
```

The `file` form data must contain an image or a video blob.

### (POST) `/remove`

Removes a content of the specified uuid. Requires the `json` form data.

The `json` form data must contain the following format:
```ts
type Packet = {
    token?: string;
    uuid: string;
};
```

## Web View
After running the `bun run start` command, a localhost server is created. Accessing the localhost server will open a web view of the CDN.

Additional guides will be provided when I complete the web view interface.

## Command Line Interface
Additional guides will be provided when I complete the CLI.

---

###### Last Updated: April 19th, 2025
###### [(Back to Top)](#dmmd--image-cdn-dmmd-icdn)
