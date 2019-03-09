import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import bcrypt, { hashSync, genSaltSync } from "bcrypt";
import models from "../models";
import validate from "../helpers/validators/user";

dotenv.config();

const { User } = models;

/**
 * @class authController
 */
class authController {
  /**
   * @description It helps the user to create an account
   * @param  {object} req - The request object.
   * @param  {object} res - The response object.
   * @returns {object} - It returns the response object.
   */
  static async signUp(req, res) {
    const { email, password, username } = req.body;
    try {
      const salt = await genSaltSync(
        parseFloat(process.env.BCRYPT_HASH_ROUNDS) || 10
      );
      const hashPassword = await hashSync(password, salt);
      const user = await User.create({
        username,
        email,
        password: hashPassword
      });
      return res.status(201).json({
        message: "User registered successfully",
        user: {
          id: user.id,
          email: user.email,
          username: user.username
        }
      });
    } catch (error) {
      if (error.name === "SequelizeUniqueConstraintError") {
        const { message } = error.errors[0];
        let errorMessage = message;
        if (message === "email must be unique") {
          errorMessage = "The email is already taken";
        }
        if (message === "username must be unique") {
          errorMessage = "The username is already taken";
        }
        return res.status(409).json({ message: errorMessage });
      }
      res.status(500).json({
        message: "User registration failed, try again later!",
        errors: error
      });
    }
  }

  /**
   * @description It helps to log into the application
   * @param  {object} req - The request object.
   * @param  {object} res - The response object.
   * @returns {object} - It returns the response object.
   */
  static signIn(req, res) {
    const { email, password } = req.body;
    const err = validate(email, password);
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    User.findOne({
      where: { email },
      attributes: ["email", "password", "username", "id"]
    })
      .then(result => {
        if (!result) {
          return res.status(404).json({ message: "Invalid email or password!" });
        }
        bcrypt.compare(password, result.dataValues.password, (error, response) => {
          if (response) {
            const token = jwt.sign(
              {
                email: result.dataValues.email,
                username: result.dataValues.username,
                id: result.dataValues.id
              },
              process.env.SECRET_KEY
            );
            return res.status(200).send({
              message: "Logged in successfully",
              token
            });
          }
          return res
            .status(400)
            .json({ message: "Invalid email or password!", error });
        });
      })
      .catch(error => {
        return res.status(500).json({ error: error.message });
      });
  }
}

export default authController;
