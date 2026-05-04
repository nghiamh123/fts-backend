import { Router } from "express";
import { User } from "../../models/User.js";
import {
  getRolePermissions,
  isAdminRole,
  requireAdmin,
} from "../../middleware/requireAdmin.js";
import { signToken, verifyPassword } from "../../utils/auth.js";

const router = Router();

function buildAdminProfile(req) {
  const adminAuth = req.adminAuth;

  if (!adminAuth) return null;

  if (adminAuth.type === "api-key") {
    return {
      id: "api-key",
      email: "",
      fullName: "System Admin",
      role: adminAuth.role,
      permissions: adminAuth.permissions,
      authMode: adminAuth.type,
    };
  }

  return {
    id: adminAuth.user._id,
    email: adminAuth.user.email,
    fullName: adminAuth.user.fullName,
    role: adminAuth.role,
    permissions: adminAuth.permissions,
    authMode: adminAuth.type,
  };
}

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!isAdminRole(user.role)) {
      return res
        .status(403)
        .json({ message: "This account cannot access admin" });
    }

    const accessToken = signToken({
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    res.json({
      ok: true,
      accessToken,
      admin: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        permissions: getRolePermissions(user.role),
        authMode: "user",
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/me", requireAdmin, (req, res) => {
  const admin = buildAdminProfile(req);
  res.json(admin);
});

router.post("/verify", requireAdmin, (req, res) => {
  res.json({ ok: true, admin: buildAdminProfile(req) });
});

export default router;
