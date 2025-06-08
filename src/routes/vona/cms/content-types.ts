import { Hono } from "hono";
import type { AuthEnv } from "~/library/middleware/auth";
import { GeneralApiResponse } from "~/types/response";
import { ContentType } from "~/types/cms";
import { db } from "~/utils/db";

const app = new Hono<AuthEnv>();

// Get all content types
app.get("/", async (c) => {
	try {
		const contentTypes = await db.contentType.findMany({
			include: {
				fields: true,
			},
			orderBy: {
				name: "asc",
			},
		});

		return c.json(contentTypes);
	} catch (error) {
		console.error("Error fetching content types:", error);
		return c.json({ ok: false, err: "Failed to fetch content types" }, 500);
	}
});

// Get a specific content type by ID
app.get("/:id", async (c) => {
	const id = c.req.param("id");

	try {
		const contentType = await db.contentType.findUnique({
			where: { id },
			include: {
				fields: {
					orderBy: {
						order: "asc",
					},
				},
			},
		});

		if (!contentType) {
			return c.json({ ok: false, err: "Content type not found" }, 404);
		}

		return c.json(contentType);
	} catch (error) {
		console.error(`Error fetching content type ${id}:`, error);
		return c.json({ ok: false, err: "Failed to fetch content type" }, 500);
	}
});

// Create a new content type
app.post("/", async (c) => {
	const user = c.get("user");
	const data = await c.req.json();

	if (!data.name || !data.slug) {
		return c.json({ ok: false, err: "Name and slug are required" }, 400);
	}

	try {
		// Check if slug is already in use
		const existing = await db.contentType.findUnique({
			where: { slug: data.slug },
		});

		if (existing) {
			return c.json({ ok: false, err: "Slug already in use" }, 400);
		}

		const contentType = await db.contentType.create({
			data: {
				name: data.name,
				slug: data.slug,
				fields: {
					create: Array.isArray(data.fields)
						? data.fields.map((field: any, index: number) => ({
								name: field.name,
								key: field.key,
								type: field.type,
								required: field.required || false,
								order: index,
						  }))
						: [],
				},
			},
			include: {
				fields: true,
			},
		});

		const response: GeneralApiResponse = {
			ok: true,
			msg: "Content type created successfully",
		};

		return c.json({ ...response, contentType }, 201);
	} catch (error) {
		console.error("Error creating content type:", error);
		return c.json({ ok: false, err: "Failed to create content type" }, 500);
	}
});

// Update a content type
// Thanks but no thanks, Claude. This impl is retarded.
// app.put("/:id", async (c) => {
//   const id = c.req.param("id");
//   const data = await c.req.json();

//   try {
//     // Check if content type exists
//     const existing = await db.contentType.findUnique({
//       where: { id }
//     });

//     if (!existing) {
//       return c.json({ ok: false, err: "Content type not found" }, 404);
//     }

//     // Check if slug is already in use by another content type
//     if (data.slug && data.slug !== existing.slug) {
//       const slugExists = await db.contentType.findFirst({
//         where: {
//           slug: data.slug,
//           id: { not: id }
//         }
//       });

//       if (slugExists) {
//         return c.json({ ok: false, err: "Slug already in use" }, 400);
//       }
//     }

//     // Update the content type
//     const contentType = await db.contentType.update({
//       where: { id },
//       data: {
//         name: data.name,
//         slug: data.slug
//       },
//       include: {
//         fields: true
//       }
//     });

//     // Handle field updates separately
//     if (Array.isArray(data.fields)) {
//       // Delete existing fields
//       await db.contentField.deleteMany({
//         where: { contentTypeId: id }
//       });

//       // Create new fields
//       const fields = await Promise.all(
//         data.fields.map(async (field: any, index: number) => {
//           return db.contentField.create({
//             data: {
//               contentTypeId: id,
//               name: field.name,
//               key: field.key,
//               type: field.type,
//               required: field.required || false,
//               order: index
//             }
//           });
//         })
//       );

//       contentType.fields = fields;
//     }

//     const response: GeneralApiResponse = {
//       ok: true,
//       msg: "Content type updated successfully"
//     };

//     return c.json({ ...response, contentType });
//   } catch (error) {
//     console.error(`Error updating content type ${id}:`, error);
//     return c.json({ ok: false, err: "Failed to update content type" }, 500);
//   }
// });

// Delete a content type
app.delete("/:id", async (c) => {
	const id = c.req.param("id");

	try {
		// Check if content type exists
		const existing = await db.contentType.findUnique({
			where: { id },
		});

		if (!existing) {
			return c.json({ ok: false, err: "Content type not found" }, 404);
		}

		// Delete associated content items first
		await db.contentItem.deleteMany({
			where: { contentTypeId: id },
		});

		// Delete associated fields
		await db.contentField.deleteMany({
			where: { contentTypeId: id },
		});

		// Delete the content type
		await db.contentType.delete({
			where: { id },
		});

		const response: GeneralApiResponse = {
			ok: true,
			msg: "Content type deleted successfully",
		};

		return c.json(response);
	} catch (error) {
		console.error(`Error deleting content type ${id}:`, error);
		return c.json({ ok: false, err: "Failed to delete content type" }, 500);
	}
});

export default app;
