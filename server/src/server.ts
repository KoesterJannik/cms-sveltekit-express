import { config } from "dotenv";
config();

import express from "express";
import { prisma } from "./db";
import { generateJwt, hashPassword, verifyPassword } from "./auth";
import { isAuthenticated } from "./middleware";
import cookieParser from "cookie-parser";
import cors from "cors";

const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(cookieParser());
// enable CORS and allow all origins
app.use(
  cors({
    origin: "*",
  })
);

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

app.get("/manage-content", isAuthenticated, async (req: any, res) => {
  const allProjects = await prisma.projects.findMany({
    where: { userId: req.userId },
  });
  console.log(allProjects);
  return res.render("pages/auth/manage-content", {
    allProjects,
  });
});
app.post(
  "/manage-content/create-project",
  isAuthenticated,
  async (req: any, res) => {
    if (!req.body.projectName || !req.body.projectDescription)
      return res.redirect("/manage-content");
    await prisma.projects.create({
      data: {
        name: req.body.projectName,
        description: req.body.projectDescription,
        userId: req.userId,
      },
    });
    return res.redirect("/manage-content");
  }
);

app.post(
  "/manage-content/delete-project/:id",
  isAuthenticated,
  async (req: any, res) => {
    console.log("HIT");
    await prisma.projects.delete({
      where: {
        id: parseInt(req.params.id),
        userId: req.userId,
      },
    });
    return res.redirect("/manage-content");
  }
);

app.post(
  "/manage-content/edit-project/:id",
  isAuthenticated,
  async (req: any, res) => {
    await prisma.projects.update({
      where: {
        id: parseInt(req.params.id),
        userId: req.userId,
      },
      data: {
        name: req.body.projectName,
        description: req.body.projectDescription,
      },
    });
    return res.redirect("/manage-content");
  }
);

app.get("/rest/projects/:userId", async (req, res) => {
  const projects = await prisma.projects.findMany({
    where: { userId: parseInt(req.params.userId) },
  });
  return res.json(projects);
});
// get a single project from user

app.get("/rest/projects/:userId/:projectId", async (req, res) => {
  const project = await prisma.projects.findUnique({
    where: {
      id: parseInt(req.params.projectId),
      userId: parseInt(req.params.userId),
    },
  });
  return res.json(project);
});

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
