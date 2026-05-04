import { User } from "../models/User.js";
import { verifyToken } from "../utils/auth.js";

const ADMIN_API_KEY = process.env.ADMIN_API_KEY;
const SUPER_ADMIN_PERMISSION = "*";

const ROLE_PERMISSIONS = {
  admin: [SUPER_ADMIN_PERMISSION],
  manager: [SUPER_ADMIN_PERMISSION],
  marketing: ["content:write"],
};

function getTokenFromRequest(req) {
  const adminKey = req.headers["x-admin-key"];
  if (typeof adminKey === "string" && adminKey.trim()) {
    return adminKey.trim();
  }

  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) {
    return header.slice(7).trim();
  }

  return "";
}

export function isAdminRole(role) {
  return Object.prototype.hasOwnProperty.call(ROLE_PERMISSIONS, role);
}

export function getRolePermissions(role) {
  return ROLE_PERMISSIONS[role] || [];
}

export function hasAdminPermission(adminAuth, permission) {
  if (!adminAuth) return false;
  return (
    adminAuth.permissions.includes(SUPER_ADMIN_PERMISSION) ||
    adminAuth.permissions.includes(permission)
  );
}

async function resolveAdminAuth(req) {
  if (req.adminAuth) {
    return req.adminAuth;
  }

  const credential = getTokenFromRequest(req);
  if (!credential) {
    return null;
  }

  if (ADMIN_API_KEY && credential === ADMIN_API_KEY) {
    req.adminAuth = {
      type: "api-key",
      role: "admin",
      permissions: [SUPER_ADMIN_PERMISSION],
      user: null,
    };
    return req.adminAuth;
  }

  const payload = verifyToken(credential);
  if (!payload?.sub) {
    return null;
  }

  const user = await User.findById(payload.sub).select("-passwordHash");
  if (!user || !isAdminRole(user.role)) {
    return null;
  }

  req.adminAuth = {
    type: "user",
    role: user.role,
    permissions: getRolePermissions(user.role),
    user,
  };
  req.user = user;
  return req.adminAuth;
}

export async function requireAdmin(req, res, next) {
  try {
    const adminAuth = await resolveAdminAuth(req);
    if (!adminAuth) {
      return res.status(401).json({ message: "Admin authentication required" });
    }
    next();
  } catch (err) {
    return res.status(401).json({ message: "Admin authentication failed" });
  }
}

export function requireAdminPermission(...permissions) {
  return async (req, res, next) => {
    try {
      const adminAuth = await resolveAdminAuth(req);
      if (!adminAuth) {
        return res
          .status(401)
          .json({ message: "Admin authentication required" });
      }

      const allowed = permissions.every((permission) =>
        hasAdminPermission(adminAuth, permission),
      );
      if (!allowed) {
        return res.status(403).json({ message: "Forbidden" });
      }

      next();
    } catch (err) {
      return res.status(401).json({ message: "Admin authentication failed" });
    }
  };
}
