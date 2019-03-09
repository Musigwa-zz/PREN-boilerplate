import { Router } from "express";
import user from "./users";

const router = Router();

router.use(user);
export default router;
