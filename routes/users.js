import { Router } from "express";
import Auth from "../controllers/auth";
import UserController from "../controllers/users";

const userRouters = Router();

userRouters.get("/users/confirm/:auth_token", UserController.confirmation);
userRouters.put("/users/resend", UserController.resendVerificationEmail);
userRouters.post("/users/login", Auth.signIn);
userRouters
  .post("/users", Auth.signUp)
  .post("/users/reset_password", UserController.resetPassword)
  .put("/users/:token/password", UserController.updatePassword);

export default userRouters;
