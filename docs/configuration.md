# DmmD / [Image CDN (dmmd-icdn)](../README.md) / Configuration

## Table of Contents

- [Home](../README.md)
    - [Installation](./installation.md)
    - [Configuration](./configuration.md)
    - [Errors](./errors.md)
    - [API](./api.md)

## Configuration

All project configuration should be placed inside of the `.env` file in your working directory.

```env
# Whether to enable debug mode.
DEBUG=false

# Specifies the directory of the user's ffmpeg binaries.
FFMPEG_PATH="ffmpeg/"

# Specifies the maximum content file limit in bytes.
FILE_LIMIT=10485760

# Specifies the directory where all content files should be placed.
FILES_PATH="files/"

# Specifies the port the localhost server will be hosted on.
PORT=1364

# Specifies the directory where all content previews should be placed.
PREVIEWS_PATH="previews/"

# Specifies the maximum total file limit in bytes.
STORE_LIMIT=53687091200

# Specifies the file destination where the sqlite database should be placed.
STORE_PATH="store.sqlite"

# Specifies the password or token needed to access /add /update and /remove endpoints. If empty, token requirement is removed.
TOKEN=""
```

---

###### Page Last Updated: April 21st, 2025
