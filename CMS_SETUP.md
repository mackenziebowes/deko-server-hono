# CMS Feature Setup Guide

This guide explains how to set up and use the new CMS feature in the server application.

## Database Migration

Before using the CMS API, you need to apply the database migrations to create the required tables:

1. Navigate to the Prisma directory:
   ```sh
   cd ../prisma
   ```

2. Generate the Prisma client:
   ```sh
   bun prisma generate
   ```

3. Create and apply migrations:
   ```sh
   bun prisma migrate dev --name add-cms-models
   ```

## API Routes

The CMS API is available under the protected `/vona/cms` namespace, with the following endpoints:

### Content Types

Content types define the structure of your content. Each content type has fields that specify what data can be stored.

- `GET /vona/cms/content-types` - List all content types
- `GET /vona/cms/content-types/:id` - Get a specific content type
- `POST /vona/cms/content-types` - Create a new content type
- `PUT /vona/cms/content-types/:id` - Update a content type
- `DELETE /vona/cms/content-types/:id` - Delete a content type

### Content Items

Content items are instances of content types with actual data.

- `GET /vona/cms/content-items` - List all content items (supports filtering by content type and status)
- `GET /vona/cms/content-items/:id` - Get a specific content item
- `POST /vona/cms/content-items` - Create a new content item
- `PUT /vona/cms/content-items/:id` - Update a content item
- `DELETE /vona/cms/content-items/:id` - Delete a content item
- `POST /vona/cms/content-items/:id/publish` - Publish a content item
- `POST /vona/cms/content-items/:id/unpublish` - Unpublish a content item

## Example Usage

### Creating a Content Type

```typescript
// Example: Creating a "Blog Post" content type
const response = await fetch('/vona/cms/content-types', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    name: 'Blog Post',
    slug: 'blog-post',
    fields: [
      {
        name: 'Title',
        key: 'title',
        type: 'TEXT',
        required: true
      },
      {
        name: 'Content',
        key: 'content',
        type: 'RICH_TEXT',
        required: true
      },
      {
        name: 'Featured Image',
        key: 'featuredImage',
        type: 'IMAGE',
        required: false
      },
      {
        name: 'Published Date',
        key: 'publishedDate',
        type: 'DATE',
        required: false
      }
    ]
  })
});
```

### Creating a Content Item

```typescript
// Example: Creating a blog post
const response = await fetch('/vona/cms/content-items', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    contentTypeId: '123e4567-e89b-12d3-a456-426614174000', // ID of the Blog Post content type
    title: 'My First Blog Post',
    slug: 'my-first-blog-post',
    status: 'DRAFT',
    fields: {
      title: 'My First Blog Post',
      content: '<p>This is the content of my first blog post.</p>',
      featuredImage: 'https://example.com/image.jpg',
      publishedDate: '2025-06-06T12:00:00Z'
    }
  })
});
```

## Field Types

The CMS supports the following field types:

- `TEXT` - Short text (titles, names, etc.)
- `RICH_TEXT` - HTML or Markdown content
- `NUMBER` - Numeric values
- `BOOLEAN` - True/false values
- `DATE` - Date and time values
- `IMAGE` - Image URLs or references
- `REFERENCE` - References to other content items

## Content Status

Content items can have the following statuses:

- `DRAFT` - Work in progress, not publicly visible
- `PUBLISHED` - Publicly visible content
- `ARCHIVED` - Hidden from public view but not deleted