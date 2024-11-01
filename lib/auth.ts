import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db"; // your drizzle instance
import { account, session, user, verification } from "@/db/schema";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg", // or "mysql", "sqlite",
        schema: {
            user,
            session,
            account,
            verification
        },
    }),
    emailAndPassword: {
        enabled: true
    },
    trustedOrigins: [process.env.BETTER_AUTH_URL!]
});