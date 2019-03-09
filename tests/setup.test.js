/* eslint-disable import/no-mutable-exports */
import assert from "assert";
import jwt from "jsonwebtoken";
import db from "../models";

global.assert = assert;
/* eslint-disable import/no-mutable-exports */
let user;
let post;
let token;

const { User } = db;

const dummyUser = {
  firstName: "espoir",
  lastName: "Murhabazi",
  password: "password",
  email: "you.can.see@me.com",
  username: "youcant@"
};

before(async () => {
  user = await User.create({ ...dummyUser });
  token = jwt.sign(
    { email: user.email, username: user.username, id: user.id },
    process.env.SECRET_KEY
  );
  user.token = token;
});

after("Destroy the database ", async () => {
  await User.destroy({ where: {}, truncate: true, cascade: true });
});

export { post, user, token };
