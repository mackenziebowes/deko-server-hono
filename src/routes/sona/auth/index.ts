import { Hono } from "hono";
import { GeneralApiResponse, JWTResponse } from "~/types/response";
import {
	sign_jwt,
	encryptPassword,
	decryptPassword,
} from "~/library/helpers/crypto";
import { makeOTP } from "~/library/helpers/crypto";
import { hasExpired } from "~/library/helpers/time";
import { db } from "~/utils/db";
import { sendEmail } from "~/library/helpers/email";
import { env } from "~/library/helpers/env";
import { User } from "~/types/user";

const app = new Hono();

async function handleChallenge(email: string): Promise<GeneralApiResponse> {
	const key = makeOTP(6);
	const challenge = await db.emailChallenge.create({
		data: { email, key },
	});
	if (!challenge) {
		return {
			ok: false,
			err: "Failed to create challenge",
		};
	}
	const emailRes = await sendEmail({
		to: email,
		subject: "Your OTP",
		title: "Here's your code to confirm your email:",
		subtitle:
			"Thanks for signing up! We just need to make sure we got the right email for you.",
		body: `Your key is: <strong>${key}</strong>`,
	});
	return emailRes; // bubblin up
}

interface SubmitEmailRequest {
	email: string;
}

app.post("/submit-email", async (c) => {
	const { email }: SubmitEmailRequest = await c.req.json();
	// check if user already has challenge
	let existingChallenge = await db.emailChallenge.findUnique({
		where: { email },
	});
	if (!existingChallenge) {
		const res = await handleChallenge(email);
		return c.json(res);
	}
	if (existingChallenge) {
		// double click or worse
		const now = new Date();
		if (existingChallenge.expiresAt > now) {
			// deffo double click
			const res: GeneralApiResponse = {
				ok: false,
				err: "Challenge for user already exists",
			};
			return c.json(res);
		}
		if (existingChallenge.expiresAt < now) {
			// user is lost - remake challenge
			await db.emailChallenge.delete({
				where: { email },
			});
			const res = await handleChallenge(email);
			return c.json(res);
		}
	}
});

app.post("/confirm-email", async (c) => {
	interface ConfirmEmailRequest {
		code: string;
		email: string;
	}
	const { code, email }: ConfirmEmailRequest = await c.req.json();
	let challenge = await db.emailChallenge.findUnique({
		where: { email, key: code },
	});
	// we have an opportunity to be less secure, but nice.
	// say, lol, that a user fatfingers up to 2 numbers - we could write an algorithm that splits
	// the key from db and the code from the user, etc and so on.
	// not doing that because it's sillypilled but would be cool.
	if (!challenge) {
		const res: GeneralApiResponse = {
			ok: false,
			err: "Unrecognized email or code.",
		};
		return c.json(res);
	}
	if (challenge) {
		// yippee! User successfully identified themselves.
		// wait - pause, not totally yippee...
		// challenge *may be expired*
		const now = new Date();
		if (challenge.expiresAt < now) {
			const res: GeneralApiResponse = {
				ok: false,
				err: "Expired Challenge - create a new one.",
			};
			return c.json(res);
		}
		// notice how *no user yet exists* for this challenge!
		// we create them now, put their id and email into a JWT, then return that.
		const newUser = await db.user.create({
			data: {
				email,
			},
		});
		const jwtUser: User = {
			id: newUser.id,
			email: newUser.email,
		};
		const token = await sign_jwt(jwtUser);
		const res: JWTResponse = {
			ok: true,
			msg: "User Created!",
			token,
		};
		return c.json(res);
	}
});

app.post("/resend-email", async (c) => {
	const { email }: SubmitEmailRequest = await c.req.json();
	const existingChallenge = await db.emailChallenge.findFirst({
		where: {
			email,
		},
	});
	if (existingChallenge) {
		await db.emailChallenge.delete({
			where: { email },
		});
		const res = await handleChallenge(email);
		return c.json(res);
	}
	if (!existingChallenge) {
		const res = await handleChallenge(email);
		return c.json(res);
	}
});

async function makeMagicLink(email: string): Promise<GeneralApiResponse> {
	const key = makeOTP(32);
	const newChallenge = await db.magicLinkChallenge.create({
		data: {
			email,
			key,
		},
	});
	if (!newChallenge) {
		return {
			ok: false,
			err: "Failed to create Magic Link",
		};
	}
	const emailRes = await sendEmail({
		to: email,
		subject: "Your Magic Link",
		title: "Here's your Magic Link log in:",
		subtitle: "Click the link below to sign in.",
		body: `Your link is: <strong><a href="${env.CORS_ORIGIN()}/magic-link/?key=${key}">${key}</a></strong>`,
	});
	return emailRes; // bubblin up
}

app.post("/magic-link", async (c) => {
	const { email }: SubmitEmailRequest = await c.req.json();
	// user must exist
	const attachedUser = await db.user.findUnique({
		where: { email },
	});
	if (!attachedUser) {
		const res: GeneralApiResponse = {
			ok: false,
			err: "Unknown User attempting to login",
		};
		return c.json(res);
	}
	const existingMagicLink = await db.magicLinkChallenge.findFirst({
		where: { email },
	});
	const now = new Date();
	if (existingMagicLink) {
		const createdAt = new Date(existingMagicLink.createdAt);
		const diffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);
		if (diffMinutes >= 1) {
			// 60s refresh delay
			await db.emailChallenge.delete({
				where: { email },
			});
			const res = await makeMagicLink(email);
			return c.json(res);
		} else {
			const res: GeneralApiResponse = {
				ok: false,
				err: "Magic link was recently created. Please wait before requesting a new one.",
			};
			return c.json(res);
		}
	}
	if (!existingMagicLink) {
		const res = await makeMagicLink(email);
		return c.json(res);
	}
});

app.get("/magic-link/:code", async (c) => {
	const code = c.req.param("code");
	const magicLinkChallenge = await db.magicLinkChallenge.findUnique({
		where: {
			key: code,
		},
	});
	if (!magicLinkChallenge) {
		const res: GeneralApiResponse = {
			ok: false,
			err: "Unknown code",
		};
		return c.json(res);
	}
	if (magicLinkChallenge) {
		const now = new Date();
		if (hasExpired(magicLinkChallenge.expiresAt.getTime(), now.getTime())) {
			// delete the challenge
			await db.magicLinkChallenge.delete({ where: { key: code } });
			const res: GeneralApiResponse = {
				ok: false,
				err: "Expired Magic Link",
			};
			return c.json(res, 401);
		}
		// magicLink is correct and valid, log the user in
		const user = await db.user.findUnique({
			where: {
				email: magicLinkChallenge.email,
			},
		});
		if (!user) {
			const res: GeneralApiResponse = {
				ok: false,
				err: "Unknown User",
			};
			return c.json(res, 404);
		}
		await db.magicLinkChallenge.delete({
			where: {
				key: code,
			},
		});
		const jwtUser: User = {
			id: user.id,
			email: user.email,
		};
		const token = await sign_jwt(jwtUser);
		const res: JWTResponse = {
			ok: true,
			msg: "User Created!",
			token,
		};
		return c.json(res, 200);
	}
});

// finally, *if* the user set a password, allow that.

interface PasswordRequest {
	email: string;
	password: string;
}

app.post("/log-in", async (c) => {
	const errMsg: GeneralApiResponse = {
		ok: false,
		err: "Unable to sign in",
	};
	try {
		const { email, password }: PasswordRequest = await c.req.json();
		const user = await db.user.findUnique({
			where: { email },
		});
		if (!user) {
			return c.json(errMsg);
		}
		// Implement a secure password validation mechanism
		const passwordHash = encryptPassword(password);
		const isValidUser = user.password === passwordHash;
		if (!isValidUser) {
			return c.json(errMsg);
		}
		const jwtUser: User = {
			id: user.id,
			email: user.email,
		};
		const token = await sign_jwt(jwtUser);
		const res: JWTResponse = {
			ok: true,
			msg: "Logged In!",
			token,
		};
		return c.json(res, 200);
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : "An error occurred";
		const res: GeneralApiResponse = {
			ok: false,
			err: errorMessage,
		};
		return c.json(res, 500);
	}
});

async function handleResetRequest(email: string): Promise<GeneralApiResponse> {
	const key = makeOTP(32);
	const challenge = await db.passwordResetChallenge.create({
		data: { email, key },
	});
	if (!challenge) {
		return {
			ok: false,
			err: "Failed to create challenge",
		};
	}
	const emailRes = await sendEmail({
		to: email,
		subject: "Reset Your Password",
		title: "Here's your Password Reset Link:",
		subtitle: "Click the link below to reset your password.",
		body: `<strong><a href="${env.CORS_ORIGIN()}/reset-password/?key=${key}">Click anywhere on this sentence :)</a></strong>`,
	});
	return emailRes; // bubblin up
}

app.post("/request-reset", async (c) => {
	const successMsg: GeneralApiResponse = {
		ok: true,
		msg: "If you have an account with us, check your email for a reset link.",
	};
	// in this route, we should LIE to users, lmao.
	// basically, if there's any kind of DB error, report that, otherwise, say everything's fine and check your email.
	const { email }: SubmitEmailRequest = await c.req.json();
	const user = await db.user.findUnique({
		where: { email },
	});
	if (user) {
		const emailRes = await handleResetRequest(email);
	}
	return c.json(successMsg);
});

interface ResetPasswordConfirm {
	newPassword: string;
}

app.post("/reset-password/:key", async (c) => {
	const { newPassword }: ResetPasswordConfirm = await c.req.json();
	const { key } = c.req.param();
	const success: GeneralApiResponse = {
		ok: true,
		msg: "Your Password is now reset!",
	};
	const passwordResetChallenge = await db.passwordResetChallenge.findUnique({
		where: {
			key,
		},
	});
	if (passwordResetChallenge) {
		await db.passwordResetChallenge.delete({ where: { key } });
		const passwordHash = encryptPassword(newPassword);
		const updatedUser = await db.user.update({
			where: {
				email: passwordResetChallenge.email,
			},
			data: {
				password: passwordHash,
			},
		});
		if (updatedUser.password === passwordHash) {
			const jwtUser: User = {
				id: updatedUser.id,
				email: updatedUser.email,
			};
			const token = await sign_jwt(jwtUser);
			const res: JWTResponse = {
				ok: true,
				msg: "User Created!",
				token,
			};
			return c.json(res, 200);
		}
	}
	const res: GeneralApiResponse = {
		ok: false,
		err: "Failed to reset password, try again.",
	};
	return c.json(res);
});

export default app;
