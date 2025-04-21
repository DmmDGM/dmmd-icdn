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

```env
# Whether to enable debug mode.
DEBUG=false

# Specifies the maximum content file limit in bytes.
FILE_LIMIT=10485760

# Specifies the directory where all content files should be placed.
FILES_PATH="files/"

# Specifies the port the localhost server will be hosted on.
PORT=1364

# Specifies the maximum total file limit in bytes.
STORE_LIMIT=53687091200

# Specifies the file destination where the sqlite database should be placed.
STORE_PATH="store.sqlite"

# Specifies the password or token needed to access /add /update and /remove endpoints. If empty, token requirement is removed.
TOKEN=""
```

## Types

### Details

#### Description

Details about the store itself.

#### Structure

```ts
type Details = {
    fileLimit: number;
    protected: boolean;
    storeLength: number;
    storeLimit: number;
    storeSize: number;
}
```

### Summary

#### Description

Summary data of content.

#### Structure

```ts
type Summary = {
    data: object;
    extension: string;
    mime: string;
    name: string;
    size: number;
    tags: string[];
    time: number;
    uuid: UUID;
};
```

> [!NOTE]
> References: [UUID](#uuid)

### UUID

#### Description

The UUID associated with the content.

#### Structure

```ts
type UUID = string;
```

## Errors

| Error Code | Description |
|-|-|
| BAD_FILE | Form data for `file` does not exist or is invalid. |
| BAD_JSON | Form data for `json` does not exist or is invalid. |
| INVALID_DATA | Field `data` in the `json` form data is invalid or missing. |
| INVALID_NAME | Field `name` in the `json` form data is invalid or missing. |
| INVALID_TAGS | Field `tags` in the `json` form data is invalid or missing. |
| INVALID_TIME | Field `time` in the `json` form data is invalid or missing. |
| INVALID_TOKEN | Field `token` in the `json` form data is invalid or missing. |
| INVALID_UUID | Field `uuid` in the `json` form data is invalid or missing. |
| LARGE_SOURCE | Source file exceeds file limit or store limit. |
| MISSING_ASSET | Asset file does not exist. |
| MISSING_CONTENT | Content does not exist. |
| SERVER_ERROR | Any server error that occurs. |
| UNAUTHORIZED_TOKEN | plz stop hacking me ty |
| UNSUPPORTED_MIME | Source file MIME type is not `image/*` or `video/*`. |

## API

### (GET) `/details`

#### Return Type

```ts
type Packet = Details;
```

> [!NOTE]
> References: [Details](#details)

### (GET) `/file/<uuid>`

#### Description

Returns the raw file associated with the uuid. Returned MIME type will always be `image/*`, `video/*` or `text/plain`.

### (GET) `/query/<uuid>`

#### Description

Returns the content data associated with the uuid.

#### Return Type

```ts
type Packet = Summary;
```

> [!NOTE]
> References: [Summary](#summary)

### (GET) `/search`

#### Description

Returns a list of uuids or summaries of the contents that satisfy the filter.

#### Return Type

```ts
type Packet = UUID[];
```

```ts
type Packet = Summary[];
```

> [!NOTE]
> References: [Summary](#summary), [UUID](#uuid)

#### Parameters

| Parameter | Description |
|-|-|
| `?begin=number` | All content must have an associated time after the specified timestamp. |
| `?count=number` | The number of uuids returned per page. Settings the value to `0` removes the limit. Default is `25`. |
| `?end=number` | All content must have an associated time before the specified timestamp. |
| `?extension=string` | All content extension must contain partially or completely the specified extension. |
| `?loose=boolean` | If `true`, all filters must be satisfied for the content uuid to be returned. If `false`, only at least one filter must be satisfied for the content uuid to be returned. Default is `false`. |
| `?maximum=number` | All content size must not exceed the specified maximum. |
| `?mime=string` | All content MIME type must contain partially or completely the specified MIME type. |
| `?minimum=number` | All content size must not go under the specified minimum. |
| `?name=string` | All content must contain partially or completely the specified name. |
| `?order=ascending\|descending` | Whether the returned uuids should be sorted in ascending or descending order. Default is `descending`. |
| `?page=number` | Page offset. Starting with `0` as the first page. Default is `0`. |
| `?query=boolean` | Whether to display the summary instead of the uuid. Default is `false`. |
| `?sort=name\|size\|time\|uuid` | Sorting algorithm. Default is `time`. |
| `?tags=csv` | All content must contain the specified tags. If multiple is specified, tags should be separated by commas. If `?loose=true`, the tags filter is also searched loosely. |
| `?uuid=string` | The content must have the complete and exact uuid as the specified uuid. |

### (GET) `/list`

#### Description

Returns all uuids or summaries.

#### Return Type

```ts
type Packet = UUID[];
```

```ts
type Packet = Summary[];
```

> [!NOTE]
> References: [Summary](#summary), [UUID](#uuid)

#### Parameters

| Parameter | Description |
|-|-|
| `?count=number` | The number of uuids returned per page. Settings the value to `0` removes the limit. Default is `25`. |
| `?page=number` | Page offset. Starting with `0` as the first page. Default is `0`. |
| `?query=boolean` | Whether to display the summary instead of the uuid. Default is `false`. |

### (POST) `/add`

#### Description
Adds a content to the CDN. Requires the `json` and `file` form data. The `file` form data must contain an image or a video blob.

#### Form Data

```ts
type FormData<"json"> = {
    data: object;
    name: string;
    tags: string[];
    token?: string;
    query?: boolean;
    time: number;
};
```

#### Return Type

```ts
type Packet = UUID;
```

```ts
type Packet = Summary;
```

> [!NOTE]
> References: [Summary](#summary), [UUID](#uuid)

### (POST) `/update`

Updates a content of the specified uuid. Modifying the associated data requires the `json` form data. Modifying the associated file requires the `file` form data. The `file` form data must contain an image or a video blob.

#### Form Data

```ts
type FormData<"json"> = {
    data?: object;
    name?: string;
    tags?: string[];
    token?: string;
    query?: boolean;
    time?: number;
    uuid: string;
};
```

#### Return Type

```ts
type Packet = UUID;
```

```ts
type Packet = Summary;
```

> [!NOTE]
> References: [Summary](#summary), [UUID](#uuid)

### (POST) `/remove`

Removes a content of the specified uuid. Requires the `json` form data.

#### Form Data

```ts
type FormData<"json"> = {
    token?: string;
    query?: boolean;
    uuid: string;
};
```

#### Return Type

```ts
type Packet = UUID;
```

```ts
type Packet = Summary;
```

> [!NOTE]
> References: [Summary](#summary), [UUID](#uuid)

## Web View
After running the `bun run start` command, a localhost server is created. Accessing the localhost server will open a web view of the CDN.

Additional guides will be provided when I complete the web view interface.

## Python API and Command Line Interface

See support at iiPython's [dmmd-py](https://github.com/iiPythonx/dmmd-py/).

---

###### Last Updated: April 20th, 2025
###### [(Back to Top)](#dmmd--image-cdn-dmmd-icdn)
