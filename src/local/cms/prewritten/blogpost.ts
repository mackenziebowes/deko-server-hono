import type {
	ContentFieldDeclaration,
	ContentType,
	ContentTypeDeclaration,
} from "~/types/cms";
import { FieldType } from "~/types/cms";

export const PostType: ContentTypeDeclaration = {
	name: "Post",
	slug: "post",
	fields: [
		{
			name: "Title",
			key: "title",
			type: FieldType.TEXT,
			required: true,
		},
		{
			name: "Subtitle",
			key: "subtitle",
			type: FieldType.TEXT,
			required: true,
		},
		{
			name: "Featured Image Link",
			key: "featured-image-link",
			type: FieldType.TEXT,
			required: false,
		},
		{
			name: "Content",
			key: "content",
			type: FieldType.TEXT,
			required: true,
		},
	],
};
