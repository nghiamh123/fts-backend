import { requireAuth } from "./requireAuth.js";
import { Affiliate } from "../models/Affiliate.js";

export async function requireAffiliate(req, res, next) {
  // First run requireAuth
  requireAuth(req, res, async (err) => {
    if (err) return;
    if (!req.user) return; // requireAuth already sent response

    try {
      const affiliate = await Affiliate.findOne({
        userId: req.user._id,
        status: "active",
      });

      if (!affiliate) {
        return res
          .status(403)
          .json({ message: "Active affiliate account required" });
      }

      req.affiliate = affiliate;
      next();
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
}
