import { config } from "dotenv";
config();

import express from "express";
import { prisma } from "./db";
import { generateJwt, hashPassword, verifyPassword } from "./auth";
import { isAuthenticated } from "./middleware";
import cookieParser from "cookie-parser";

const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(cookieParser());

app.get("/", (req, res) => {
  res.render("pages/index");
});

app.get("/login", (req, res) => {
  res.render("pages/login");
});

app.post("/login", async (req, res) => {
  console.log(req.body);
  if (!req.body.email || !req.body.password) {
    return res.render("pages/login", {
      message: "Please provide an email and password",
    });
  }

  const user = await prisma.user.findUnique({
    where: { email: req.body.email },
  });
  if (!user) {
    return res.render("pages/login", {
      message: "Email or password is incorrect",
    });
  }

  const isPasswordCorrect = await verifyPassword(
    req.body.password,
    user.password
  );
  if (!isPasswordCorrect) {
    return res.render("pages/login", {
      message: "Email or password is incorrect",
    });
  }

  const token = await generateJwt(user.id);

  res.cookie("token", token, {
    httpOnly: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 24 * 1, // 7 days
  });
  res.redirect("/dashboard");
});

app.get("/register", (req, res) => {
  res.render("pages/register");
});

app.post("/register", async (req, res) => {
  console.log(req.body);
  if (!req.body.email || !req.body.password) {
    return res.render("pages/register", {
      message: "Please provide an email and password",
    });
  }

  const emailAlreadyInUse = await prisma.user.findUnique({
    where: { email: req.body.email },
  });
  if (emailAlreadyInUse) {
    return res.render("pages/register", {
      message: "Email already in use",
    });
  }
  const hashedPassword = await hashPassword(req.body.password);

  await prisma.user.create({
    data: {
      email: req.body.email,
      password: hashedPassword,
    },
  });

  return res.render("pages/register", {
    message: "You registered. You can now login!",
  });
});

app.get("/dashboard", isAuthenticated, async (req: any, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
  });

  return res.render("pages/auth/dashboard", {
    user,
  });
});

app.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/");
});

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
