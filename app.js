const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");

const app = express();

app.use(express.json());

const filePath = path.join(__dirname, "userData.db");

let dataBase = null;

const initiateDatabase = async () => {
  try {
    dataBase = await open({
      filename: filePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Starting at http://localhost:3000")
    );
  } catch (error) {
    console.log(`DB Error ${error.message}`);
    process.exit(1);
  }
};

initiateDatabase();

let validateUser = async (userName) => {
  const validateQuery = `SELECT
    *
  FROM
    user
  WHERE
    username = '${userName}';`;
  const validResult = await dataBase.get(validateQuery);
  return validResult;
};

//API 1
app.post("/reqister/", async (request, response) => {
  let { username, name, password, gender, location } = request.body;
  const encryptPass = bcrypt.hash(password, 10);
  let validationUser = await validateUser(username);
  if (validationUser === undefined) {
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const createUserQuery = `INSERT INTO
        user(username, name, password, gender, location)
        VALUES('${username}', '${name}', '${encryptPass}', '${gender}', '${location}');`;
      let createUser = dataBase.run(createUserQuery);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//API 2
app.post("/login/", async (request, response) => {
  let { username, password } = request.body;
  let validationUser = await validateUser(username);
  if (validationUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    let validatePass = await bcrypt.compare(password, validationUser.password);
    if (validatePass === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//API 3

app.put("/change-password/", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  let validationUser1 = await validateUser(username);
  if (validationUser1 === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    let validatePass = await bcrypt.compare(password, validationUser1.password);
    if (validatePass === true) {
      if (password.length <= 5) {
        const encryptPass = bcrypt.hash(password, 10);
        const updatePassQuery = `
            UPDATE TABLE user
            SET
            password = ${encryptPass}
            WHERE
            username = '${username}';`;
        let updatePass = await dataBase.run(updatePassQuery);
        response.status(200);
        response.send("Password update");
      } else {
        response.status(400);
        response.send("Password is too short");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});
module.exports = app;
