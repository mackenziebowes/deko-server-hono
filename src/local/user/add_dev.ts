import { db } from "~/utils/db";
import { encryptPassword } from "~/library/helpers/crypto";

async function addDev() {
	const email = Bun.env.DEV_EMAIL;
	const pass = Bun.env.DEV_PASS;
	if (!email) {
		throw new Error("Dev Email Not Set");
	}
	if (!pass) {
		throw new Error("Dev Pass Not Set");
	}
	const newUser = await db.user.create({
		data: {
			email,
			password: encryptPassword(pass),
		},
	});
	if (newUser) {
		console.log(`[Success]: User Created`);
	} else {
		console.log(`[Failure]: Failed to Create User`);
	}
}

addDev();
