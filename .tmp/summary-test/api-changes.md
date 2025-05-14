# OpenAPI Specification Changes

## Summary

- **Total Changes**: 9
- **Breaking Changes**: 3
- **Non-Breaking Changes**: 6

## ⚠️ Breaking Changes

### `/users`

- 🟠 **GET** - Modified
  - **Parameters**:
    - ➕ `filter` (in: query): added
    - ✏️ `limit` (in: query) ⚠️: modified - now required
  - **Responses**:
    - ✏️ Status `200` ⚠️: modified - schema changes

### `/users/{id}`

- 🔴 **DELETE** - Deleted
- 🔴 **DELETE** - Deleted

## Non-Breaking Changes

### `/projects`

- 🟠 **GET** - Modified
  - **Parameters**:
    - ➕ `limit` (in: query): added
- 🟢 **POST** - Added

### `/projects/{id}`

- 🟢 **GET** - Added
- 🟢 **PATCH** - Added

### `/users`

- 🟠 **POST** - Modified
  - **Responses**:
    - ➕ Status `409`: added
  - **Request Body**:
    - ✏️ Content Type `application/json` ⚠️: modified - added required
      properties

### `/users/{id}`

- 🟢 **PUT** - Added

_This summary was generated automatically using the OpenAPI Summary Generator._
