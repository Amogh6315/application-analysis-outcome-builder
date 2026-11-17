import { Router } from "express";

const router = Router();

function getNameFromEmail(email: string): string {
  const username = email.split("@")[0];

  return username
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

router.post("/login", (req, res) => {
  const email =
    typeof req.body?.email === "string"
      ? req.body.email.trim().toLowerCase()
      : "";

  const token =
    typeof req.body?.token === "string"
      ? req.body.token
      : "";

  if (!email || !token) {
    return res.status(400).json({
      success: false,
      message: "Email and access token are required.",
    });
  }

  const validEmail = /^[a-zA-Z0-9._%+-]+@whatfix\.com$/.test(email);

  if (!validEmail) {
    return res.status(403).json({
      success: false,
      message: "Only Whatfix email addresses are allowed.",
    });
  }

  const expectedToken = process.env.OUTCOME_BUILDER_TOKEN;

  if (!expectedToken || token !== expectedToken) {
    return res.status(403).json({
      success: false,
      message: "Invalid access token.",
    });
  }

  const name = getNameFromEmail(email);

  return res.status(200).json({
    success: true,
    user: {
      name,
      email,
      initials: getInitials(name),
    },
  });
});

export default router;