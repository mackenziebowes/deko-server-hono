import { Hono } from "hono";
import type { AuthEnv } from "~/library/middleware/auth";
import { GeneralApiResponse } from "~/types/response";
import { ContentStatus } from "~/types/cms";
import { db } from "~/utils/db";

const app = new Hono<AuthEnv>();

// Get all content items (with optional filtering)
app.get("/", async (c) => {
	const contentTypeId = c.req.query("contentTypeId");
	const status = c.req.query("status");

	try {
		const where: any = {};

		if (contentTypeId) {
			where.contentTypeId = contentTypeId;
		}

		if (status) {
			where.status = status;
		}

		const contentItems = await db.contentItem.findMany({
			where,
			include: {
				contentType: true,
			},
			orderBy: {
				updatedAt: "desc",
			},
		});

		return c.json(contentItems);
	} catch (error) {
		console.error("Error fetching content items:", error);
		return c.json({ ok: false, err: "Failed to fetch content items" }, 500);
	}
});

// Get a specific content item by ID
app.get("/:id", async (c) => {
	const id = c.req.param("id");

	try {
		const contentItem = await db.contentItem.findUnique({
			where: { id },
			include: {
				contentType: {
					include: {
						fields: {
							orderBy: {
								order: "asc",
							},
						},
					},
				},
			},
		});

		if (!contentItem) {
			return c.json({ ok: false, err: "Content item not found" }, 404);
		}

		return c.json(contentItem);
	} catch (error) {
		console.error(`Error fetching content item ${id}:`, error);
		return c.json({ ok: false, err: "Failed to fetch content item" }, 500);
	}
});

// Create a new content item
app.post("/", async (c) => {
	const user = c.get("user");
	const data = await c.req.json();

	if (!data.contentTypeId || !data.title || !data.slug) {
		return c.json(
			{ ok: false, err: "Content type ID, title, and slug are required" },
			400
		);
	}

	try {
		// Check if content type exists
		const contentType = await db.contentType.findUnique({
			where: { id: data.contentTypeId },
			include: {
				fields: true,
			},
		});

		if (!contentType) {
			return c.json({ ok: false, err: "Content type not found" }, 404);
		}

		// Check if slug is already in use
		const existingItem = await db.contentItem.findFirst({
			where: {
				contentTypeId: data.contentTypeId,
				slug: data.slug,
			},
		});

		if (existingItem) {
			return c.json(
				{ ok: false, err: "Slug already in use for this content type" },
				400
			);
		}

		// Validate required fields
		const requiredFields = contentType.fields.filter((field) => field.required);

		for (const field of requiredFields) {
			if (!data.fields || data.fields[field.key] === undefined) {
				return c.json(
					{ ok: false, err: `Field '${field.name}' is required` },
					400
				);
			}
		}

		// Create the content item
		const contentItem = await db.contentItem.create({
			data: {
				contentTypeId: data.contentTypeId,
				title: data.title,
				slug: data.slug,
				status: data.status || ContentStatus.DRAFT,
				fields: data.fields || {},
				publishedAt:
					data.status === ContentStatus.PUBLISHED ? new Date() : null,
			},
		});

		const response: GeneralApiResponse = {
			ok: true,
			msg: "Content item created successfully",
		};

		return c.json({ ...response, contentItem }, 201);
	} catch (error) {
		console.error("Error creating content item:", error);
		return c.json({ ok: false, err: "Failed to create content item" }, 500);
	}
});

// Update a content item
app.put("/:id", async (c) => {
	const id = c.req.param("id");
	const data = await c.req.json();

	try {
		// Check if content item exists
		const existingItem = await db.contentItem.findUnique({
			where: { id },
			include: {
				contentType: {
					include: {
						fields: true,
					},
				},
			},
		});

		if (!existingItem) {
			return c.json({ ok: false, err: "Content item not found" }, 404);
		}

		// Check if slug is already in use by another item
		if (data.slug && data.slug !== existingItem.slug) {
			const slugExists = await db.contentItem.findFirst({
				where: {
					contentTypeId: existingItem.contentTypeId,
					slug: data.slug,
					id: { not: id },
				},
			});

			if (slugExists) {
				return c.json(
					{ ok: false, err: "Slug already in use for this content type" },
					400
				);
			}
		}

		// Check if we're publishing the item
		const isPublishing =
			data.status === ContentStatus.PUBLISHED &&
			existingItem.status !== ContentStatus.PUBLISHED;

		// Validate required fields if we're publishing
		if (isPublishing) {
			const requiredFields = existingItem.contentType.fields.filter(
				(field) => field.required
			);
			const fields = data.fields || existingItem.fields;

			for (const field of requiredFields) {
				if (fields[field.key] === undefined) {
					return c.json(
						{ ok: false, err: `Field '${field.name}' is required to publish` },
						400
					);
				}
			}
		}

		// Update the content item
		const contentItem = await db.contentItem.update({
			where: { id },
			data: {
				title: data.title,
				slug: data.slug,
				status: data.status,
				fields: data.fields !== undefined ? data.fields : undefined,
				publishedAt: isPublishing ? new Date() : existingItem.publishedAt,
				updatedAt: new Date(),
			},
		});

		const response: GeneralApiResponse = {
			ok: true,
			msg: "Content item updated successfully",
		};

		return c.json({ ...response, contentItem });
	} catch (error) {
		console.error(`Error updating content item ${id}:`, error);
		return c.json({ ok: false, err: "Failed to update content item" }, 500);
	}
});

// Delete a content item
app.delete("/:id", async (c) => {
	const id = c.req.param("id");

	try {
		// Check if content item exists
		const existingItem = await db.contentItem.findUnique({
			where: { id },
		});

		if (!existingItem) {
			return c.json({ ok: false, err: "Content item not found" }, 404);
		}

		// Delete the content item
		await db.contentItem.delete({
			where: { id },
		});

		const response: GeneralApiResponse = {
			ok: true,
			msg: "Content item deleted successfully",
		};

		return c.json(response);
	} catch (error) {
		console.error(`Error deleting content item ${id}:`, error);
		return c.json({ ok: false, err: "Failed to delete content item" }, 500);
	}
});

// Publish a content item
app.post("/:id/publish", async (c) => {
	const id = c.req.param("id");

	try {
		// Check if content item exists
		const existingItem = await db.contentItem.findUnique({
			where: { id },
			include: {
				contentType: {
					include: {
						fields: true,
					},
				},
			},
		});

		if (!existingItem) {
			return c.json({ ok: false, err: "Content item not found" }, 404);
		}

		// Validate required fields
		const requiredFields = existingItem.contentType.fields.filter(
			(field) => field.required
		);

		for (const field of requiredFields) {
			if (
				!existingItem.fields ||
				(existingItem.fields as Record<string, unknown>)[field.key] ===
					undefined
			) {
				return c.json(
					{ ok: false, err: `Field '${field.name}' is required to publish` },
					400
				);
			}
		}

		// Update the content item
		const contentItem = await db.contentItem.update({
			where: { id },
			data: {
				status: ContentStatus.PUBLISHED,
				publishedAt: new Date(),
				updatedAt: new Date(),
			},
		});

		const response: GeneralApiResponse = {
			ok: true,
			msg: "Content item published successfully",
		};

		return c.json({ ...response, contentItem });
	} catch (error) {
		console.error(`Error publishing content item ${id}:`, error);
		return c.json({ ok: false, err: "Failed to publish content item" }, 500);
	}
});

// Unpublish a content item
app.post("/:id/unpublish", async (c) => {
	const id = c.req.param("id");

	try {
		// Check if content item exists
		const existingItem = await db.contentItem.findUnique({
			where: { id },
		});

		if (!existingItem) {
			return c.json({ ok: false, err: "Content item not found" }, 404);
		}

		// Update the content item
		const contentItem = await db.contentItem.update({
			where: { id },
			data: {
				status: ContentStatus.DRAFT,
				updatedAt: new Date(),
			},
		});

		const response: GeneralApiResponse = {
			ok: true,
			msg: "Content item unpublished successfully",
		};

		return c.json({ ...response, contentItem });
	} catch (error) {
		console.error(`Error unpublishing content item ${id}:`, error);
		return c.json({ ok: false, err: "Failed to unpublish content item" }, 500);
	}
});

export default app;
