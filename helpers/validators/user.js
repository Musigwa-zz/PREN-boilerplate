/** Define the function for validating the login credentials */
import Joi from "joi";
import constants from "../constants";

const { regex } = constants;
export default {
  name: Joi.string()
    .trim()
    .required()
    .min(3),
  telephone: Joi.string()
    .trim()
    .regex(regex.phone)
    .required()
    .min(9),
  email: Joi.string()
    .trim()
    .email({ minDomainAtoms: 2 })
    .regex(regex.email)
    .required(),
  password: Joi.string()
    .trim()
    .regex(regex.password)
    .required(),
  role: Joi.string()
    .only(["trainer", "employer"])
    .default("employee"),
  avatar: Joi.string()
    .regex(regex.avatar)
    .trim()
    .uri()
};
