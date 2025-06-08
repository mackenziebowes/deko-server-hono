import { db } from "~/utils/db";
import type { ContentTypeDeclaration } from "~/types/cms";

export async function createContentType(type: ContentTypeDeclaration) {
	try {
		// Check if slug is already in use
		const existing = await db.contentType.findUnique({
			where: { slug: type.slug },
		});

		if (existing) {
			console.error("Slug already in use");
			return;
		}

		// Create the content type
		const contentType = await db.contentType.create({
			data: {
				name: type.name,
				slug: type.slug,
				fields: {
					create: type.fields.map((field, index) => ({
						name: field.name,
						key: field.key,
						type: field.type,
						required: field.required || false,
						order: index,
						children: field.children?.map((child, childIndex) => ({
							name: child.name,
							key: child.key,
							type: child.type,
							required: child.required || false,
							order: childIndex,
						})),
					})),
				},
			},
		});

		console.log("Content type created successfully:", contentType);
	} catch (error) {
		console.error("Error creating content type:", error);
	}
}
