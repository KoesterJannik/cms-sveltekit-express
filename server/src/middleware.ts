import { verifyJwt } from "./auth";

export async function isAuthenticated(req: any, res: any, next: any) {
  if (!req.cookies.token) {
    return res.redirect("/login");
  }

  try {
    const decoded = (await verifyJwt(req.cookies.token)) as any;
    req.userId = decoded.userId;
    return next();
  } catch (err) {
    console.error(err);
    return res.redirect("/login");
  }
}
