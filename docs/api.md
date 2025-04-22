# DmmD / [Image CDN (dmmd-icdn)](../README.md) / API

## Table of Contents

- [Home](../README.md)
    - [Installation](./installation.md)
    - [Configuration](./configuration.md)
    - [Errors](./errors.md)
    - [API](./api.md)
        - [(GET) Details](#get-details)
        - [(GET) File](#get-fileuuid)
        - [(GET) Query](#get-queryuuid)
        - [(GET) List](#get-list)
        - [(GET) Search](#get-search)
        - [(POST) Add](#post-add)
        - [(POST) Update](#post-update)
        - [(POST) Remove](#post-remove)

## (GET) `/details`

### Description

Returns details about the store itself.

### Return Type

```ts
type Packet = {
    fileLimit: number;
    protected: boolean;
    storeLength: number;
    storeLimit: number;
    storeSize: number;
};
```

## (GET) `/file/<uuid>`

### Description

Returns the raw file associated with the uuid. Returned MIME type will always be `image/*`, `video/*` or `text/plain`.

## (GET) `/query/<uuid>`

### Description

Returns the content data associated with the uuid.

### Return Type

```ts
type Packet = {
    data: object;
    extension: string;
    mime: string;
    name: string;
    size: number;
    tags: string[];
    time: number;
    uuid: string;
};
```

## (GET) `/search`

### Description

Returns a list of uuids or summaries of the contents that satisfy the filter.

### Parameters

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

### Return Type

```ts
type Packet = string[];
```

```ts
type Packet = {
    data: object;
    extension: string;
    mime: string;
    name: string;
    size: number;
    tags: string[];
    time: number;
    uuid: string;
};
```

## (GET) `/list`

### Description

Returns all uuids or summaries.

### Parameters

| Parameter | Description |
|-|-|
| `?count=number` | The number of uuids returned per page. Settings the value to `0` removes the limit. Default is `25`. |
| `?page=number` | Page offset. Starting with `0` as the first page. Default is `0`. |
| `?query=boolean` | Whether to display the summary instead of the uuid. Default is `false`. |

### Return Type

```ts
type Packet = string[];
```

```ts
type Packet = {
    data: object;
    extension: string;
    mime: string;
    name: string;
    size: number;
    tags: string[];
    time: number;
    uuid: string;
};
```

## (POST) `/add`

#### Description
Adds a content to the CDN. Requires the `json` and `file` form data. The `file` form data must contain an image or a video blob.

### Form Data

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

### Return Type

```ts
type Packet = string;
```

```ts
type Packet = {
    data: object;
    extension: string;
    mime: string;
    name: string;
    size: number;
    tags: string[];
    time: number;
    uuid: string;
};
```

## (POST) `/update`

### Description

Updates a content of the specified uuid. Modifying the associated data requires the `json` form data. Modifying the associated file requires the `file` form data. The `file` form data must contain an image or a video blob.

### Form Data

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

### Return Type

```ts
type Packet = string;
```

```ts
type Packet = {
    data: object;
    extension: string;
    mime: string;
    name: string;
    size: number;
    tags: string[];
    time: number;
    uuid: string;
};
```

## (POST) `/remove`

Removes a content of the specified uuid. Requires the `json` form data.

### Form Data

```ts
type FormData<"json"> = {
    token?: string;
    query?: boolean;
    uuid: string;
};
```

### Return Type

```ts
type Packet = string;
```

```ts
type Packet = {
    data: object;
    extension: string;
    mime: string;
    name: string;
    size: number;
    tags: string[];
    time: number;
    uuid: string;
};
```

---

###### Page Last Updated: April 21st, 2025
