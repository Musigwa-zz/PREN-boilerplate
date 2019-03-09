import dotenv from "dotenv";
import { hashSync, genSaltSync, compareSync } from "bcrypt";
import jwt from "jsonwebtoken";
import models from "../models";
import resetPwdTemplate from "../helpers/resetPasswordTemplate";
import template from "../helpers/emailVerificationTamplate";
import { sendEmail } from "../services/sendgrid";
import constants from "../helpers/constants";

const {
  NOT_FOUND,
  BAD_REQUEST,
  ACCEPTED,
  OK,
  INTERNAL_SERVER_ERROR,
  UNAUTHORIZED
} = constants.statusCode;

dotenv.config();

const { User } = models;

/**
 * @class UserController
 */
class UserController {
  /**
   * @description This helps the user to reset their password
   * @param  {object} req - The request object.
   * @param  {object} res - The response object.
   * @returns {object} - It returns the response object.
   */
  static async resetPassword(req, res) {
    if (!req.body.email) {
      return res.status(NOT_FOUND).json({ message: "Email is required" });
    }
    try {
      User.findOne({
        where: {
          email: req.body.email
        }
      }).then(async response => {
        if (!response) {
          return res.status(NOT_FOUND).json({ message: "User not found" });
        }
        const token = await jwt.sign(req.body.email, process.env.SECRET_KEY);
        const user = await response.update(
          { resetToken: token },
          { returning: true }
        );
        const { id, email, resetToken } = user.dataValues;
        const emailBody = await resetPwdTemplate(token);
        const emailResponse = await sendEmail(email, "Password Reset", emailBody);

        if (
          (emailResponse.length > 0 && emailResponse[0].statusCode === ACCEPTED) ||
          emailResponse[emailResponse.length - 1].mockResponse
        ) {
          res.json({
            message: "Mail delivered",
            user: { id, email, resetToken }
          });
        } else {
          res
            .status(INTERNAL_SERVER_ERROR)
            .json({ message: "Error while sending email", data: emailResponse });
        }
      });
    } catch (error) {
      res.status(INTERNAL_SERVER_ERROR).json({
        message: "Sending email failed",
        errors: "Something happened, please try again"
      });
    }
  }

  /**
   * @description This helps the user to change their password
   * @param  {object} req - The request object.
   * @param  {object} res - The response object.
   * @returns {object} - It returns the response object.
   */
  static async updatePassword(req, res) {
    const { token } = req.params;
    try {
      await jwt.verify(token, process.env.SECRET_KEY, async (error, email) => {
        if (error) {
          return res
            .status(BAD_REQUEST)
            .json({ message: "Invalid or expired link" });
        }
        const salt = await genSaltSync(
          parseFloat(process.env.BCRYPT_HASH_ROUNDS) || 10
        );
        const password = await hashSync(req.body.password, salt);
        User.findOne({
          where: {
            email,
            resetToken: token
          }
        }).then(async response => {
          if (!response) {
            return res.status(BAD_REQUEST).json({ message: "Link expired" });
          }
          const newPWdMatchCurrent = await compareSync(
            req.body.password,
            response.password
          );
          if (newPWdMatchCurrent) {
            return res.status(BAD_REQUEST).json({
              message: "Your new password was the same as your current one"
            });
          }
          await response.update({ password, resetToken: null });
          return res.json({ message: "Password updated" });
        });
      });
    } catch (error) {
      res.status(INTERNAL_SERVER_ERROR).json({
        message: "Password update failed",
        errors: "Something happened, please try again"
      });
    }
  }

  /**
   * @description It helps to resend the email for verification after signing up
   * @param  {object} req - The request object.
   * @param  {object} res - The response object.
   * @returns {object} - It returns the response object.
   */
  static async resendVerificationEmail(req, res) {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(BAD_REQUEST).json({ message: "Email is required" });
      }
      const user = await User.findOne({
        where: { email }
      });
      if (!user) {
        return res.status(NOT_FOUND).json({
          message: "User not found"
        });
      }
      if (user.dataValues.isVerified) {
        return res.status(OK).json({
          message: "User verified"
        });
      }
      const token = jwt.sign(
        { userId: user.dataValues.id, email: user.dataValues.email },
        process.env.SECRET_KEY
      );
      await sendEmail(email, "Confirm your email", template(token));
      return res.status(OK).json({
        message: "Email sent successfully"
      });
    } catch (error) {
      return res.status(INTERNAL_SERVER_ERROR).json({
        message: error
      });
    }
  }

  /**
   * @description This method let you verify your account.
   * @param  {object} req - The request object.
   * @param  {object} res - The response object.
   * @returns {object} - It returns the response object.
   */
  static async confirmation(req, res) {
    try {
      jwt.verify(
        req.params.auth_token,
        process.env.SECRET_KEY,
        async (error, user) => {
          if (error) {
            return res
              .status(UNAUTHORIZED)
              .json({ message: "Token is invalid or expired, try again" });
          }
          const verifiedUser = await User.findOne({
            where: { id: user.id, email: user.email }
          });

          if (!verifiedUser) {
            return res
              .status(NOT_FOUND)
              .json({ message: "User verification failed, User was not found" });
          }
          if (verifiedUser.dataValues.isVerified) {
            return res.status(ACCEPTED).json({
              message: "User already verified!"
            });
          }
          await User.update({ isVerified: true }, { where: { id: user.id } });
          return res.status(OK).json({
            message: "Email confirmed successfully!"
          });
        }
      );
    } catch (error) {
      return res.status(INTERNAL_SERVER_ERROR).json({
        message: "Something happened, please try again"
      });
    }
  }
}

export default UserController;
