import { auth } from "@/lib/auth-simple"; // LinkedIn OAuth with Generic OAuth Plugin
import { toNextJsHandler } from "better-auth/next-js";

export const { POST, GET } = toNextJsHandler(auth);
