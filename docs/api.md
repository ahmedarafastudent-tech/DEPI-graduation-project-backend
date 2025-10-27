# API Documentation

## Categories & Subcategories

### Subcategories API Endpoints

#### List Subcategories
```http
GET /api/subcategories
```

Query Parameters:
- `category` (optional): Filter subcategories by category ID

Response Format:
```json
[
  {
    "_id": "subcategory_id",
    "name": "Subcategory Name",
    "slug": "subcategory-name",
    "description": "Optional description",
    "category": {
      "_id": "category_id"
    },
    "isActive": true,
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
]
```

#### Get Subcategory by ID
```http
GET /api/subcategories/:id
```

Response includes full category object through population.

#### Create Subcategory (Admin Only)
```http
POST /api/subcategories
```

Request Body:
```json
{
  "name": "Subcategory Name",
  "description": "Optional description",
  "category": "category_id"
}
```

#### Update Subcategory (Admin Only)
```http
PUT /api/subcategories/:id
```

Request Body:
```json
{
  "name": "Updated Name",
  "description": "Updated description"
}
```

#### Delete Subcategory (Admin Only)
```http
DELETE /api/subcategories/:id
```

### Important Notes

1. Category References:
   - All subcategories must belong to a valid category
   - Category IDs are validated before creation
   - Category objects are consistently structured in responses

2. Slug Generation:
   - Automatically generated from name
   - Lowercase with hyphens replacing spaces
   - Updated when name is changed

3. Security:
   - Create/Update/Delete operations require admin privileges
   - List/Get operations are public
   - Proper validation of category existence

4. Response Format:
   - Category is always returned as an object with _id
   - Consistent structure for all endpoints
   - Proper error responses for invalid operations

### Error Responses

- 400 Bad Request: Invalid category ID or validation errors
- 401 Unauthorized: Authentication required
- 403 Forbidden: Not authorized as admin
- 404 Not Found: Subcategory not found