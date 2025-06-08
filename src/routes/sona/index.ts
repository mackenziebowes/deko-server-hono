import { Hono } from "hono";
import authRoutes from "./auth";

const app = new Hono();

// ???
app.route("/auth", authRoutes);

export default app;
