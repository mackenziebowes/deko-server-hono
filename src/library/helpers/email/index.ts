import * as nodemailer from "nodemailer";
import { env } from "~/library/helpers/env";
import type { GeneralApiResponse } from "~/types/response";

export const mail = nodemailer.createTransport({
	host: env.EMAIL_HOST(),
	port: 587,
	secure: false,
	auth: {
		user: env.EMAIL_USER(),
		pass: env.EMAIL_PASSWORD(),
	},
});

/**
 * Sends an email with a predefined HTML template.
 * @param params - Object containing email parameters.
 */
export async function sendEmail(params: {
	to: string;
	subject: string;
	title: string;
	subtitle: string;
	body: string;
}): Promise<GeneralApiResponse> {
	const { to, subject, title, subtitle, body } = params;
	const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    background-color: #f9f9f9;
                    color: #333;
                }
                .footer {
                    margin-top: 20px;
                    font-size: 0.9em;
                    color: #666;
                    text-align: center;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>${title}</h1>
                <h2>${subtitle}</h2>
                <p>${body}</p>
                <div class="footer">
                    <p>This email was automatically generated for users of YOUR APP App.</p>
                    <p>Visit your profile settings to disable this feature or manage your preferences.</p>
                </div>
            </div>
        </body>
        </html>
    `;

	try {
		const sentMessage = await mail.sendMail({
			from: `"YOUR APP App" <${env.EMAIL_USER()}>`, // Sender address
			to, // Recipient address
			subject, // Email subject
			html, // HTML content
		});

		if (sentMessage.accepted.length > 0) {
			return {
				ok: true,
				msg: `Email sent to ${sentMessage.accepted.join(", ")}`,
			};
		}

		if (sentMessage.rejected.length > 0) {
			return {
				ok: false,
				err: `Email rejected for ${sentMessage.rejected.join(", ")}`,
			};
		}

		return {
			ok: false,
			err: "No recipients processed (unknown error)",
		};
	} catch (error) {
		let msg = "Unknown Error";
		if (error instanceof Error) {
			msg = error.message;
		}
		return {
			ok: false,
			err: `Failed to send email: ${msg}`,
		};
	}
}
