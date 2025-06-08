export type ContentType = {
	id: string;
	name: string;
	slug: string;
	fields: ContentField[];
	createdAt: Date;
	updatedAt: Date;
};

export type ContentTypeDeclaration = Omit<
	ContentType,
	"id" | "createdAt" | "updatedAt" | "fields"
> & {
	fields: ContentFieldDeclaration[];
};

export type ContentField = {
	id: string;
	name: string;
	key: string;
	type: FieldType;
	required: boolean;
	order: number;
	children?: ContentField[]; // Nested fields
};

export type ContentFieldDeclaration = Omit<
	ContentField,
	"id" | "order" | "children"
> & {
	children?: ContentFieldDeclaration[];
};

export enum FieldType {
	TEXT = "TEXT",
	NUMBER = "NUMBER",
	BOOLEAN = "BOOLEAN",
	DATE = "DATE",
	IMAGE = "IMAGE",
	REFERENCE = "REFERENCE",
	COLLECTION = "COLLECTION", // Represents a collection of nested fields
}

export type ContentItem = {
	id: string;
	contentTypeId: string;
	title: string;
	slug: string;
	status: ContentStatus;
	fields: Record<string, any>;
	createdAt: Date;
	updatedAt: Date;
	publishedAt?: Date;
};

export type ContentItemDeclaration = Omit<
	ContentItem,
	"id" | "createdAt" | "updatedAt"
>;

export enum ContentStatus {
	DRAFT = "DRAFT",
	PUBLISHED = "PUBLISHED",
	ARCHIVED = "ARCHIVED",
}
