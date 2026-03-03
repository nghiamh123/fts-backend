import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "../models/User.js";
import { Category } from "../models/Category.js";
import { Product } from "../models/Product.js";
import { Affiliate } from "../models/Affiliate.js";
import { ReferralConfig } from "../models/ReferralConfig.js";
import { hashPassword } from "../utils/auth.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/FTS_STREETWEAR";

async function seed() {
  try {
    console.log("Connecting strictly to database...");
    await mongoose.connect(MONGO_URI);
    
    console.log("Dropping relevant collections to start fresh (users, categories, products, affiliates, referralconfig) ...");
    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    await Affiliate.deleteMany({});
    await ReferralConfig.deleteMany({});
    
    // Seed Referral Config
    await ReferralConfig.create({
      discountType: "percent",
      discountValue: 10,
      minOrderAmount: 0,
      referrerReward: 0,
      isActive: true,
    });
    console.log("Configured Referrals (10% off).");

    // Seed Categories
    const catShirt = await Category.create({ name: "T-Shirt", description: "Áo thun FTS" });
    const catHoodie = await Category.create({ name: "Hoodie", description: "Áo hoodie FTS" });
    console.log("Seed Categories created.");

    // Seed Products
    const prod1 = await Product.create({
      name: "FTS Signature T-Shirt",
      description: "Áo thun đen in logo signature",
      price: 350000,
      categoryId: catShirt._id,
      images: ["/placeholder.png"]
    });
    const prod2 = await Product.create({
      name: "FTS Dark Night Hoodie",
      description: "Hoodie đen 100% cotton",
      price: 650000,
      categoryId: catHoodie._id,
      images: ["/placeholder.png"]
    });
    console.log("Seed Products created.");

    // Seed Admin / Referrer User
    const adminPass = hashPassword("12345678");
    const admin = await User.create({
      email: "admin@fromthestress.com",
      passwordHash: adminPass,
      fullName: "Admin FTS",
      phone: "0900111222"
    });
    
    // Make Admin an Affiliate explicitly
    const adminAffiliate = await Affiliate.create({
      userId: admin._id,
      status: "active",
      commissionRate: 15,
      walletBalance: 250000,
      totalEarned: 250000,
      pendingBalance: 50000,
      totalReferrals: 3,
      totalOrders: 5,
    });
    
    // Update admin user to hold affiliate info immediately
    admin.affiliateId = adminAffiliate._id;
    await admin.save();
    
    console.log(`Seed Admin & Affiliate User created!`);
    console.log(`- Email: admin@fromthestress.com`);
    console.log(`- Pass: 12345678`);
    console.log(`- Mã giới thiệu: ${admin.referralCode} (Dùng mã này để giảm giá / nhận hoa hồng 15%)`);

    // Seed normal user
    const userPass = hashPassword("12345678");
    const user = await User.create({
      email: "buyer@gmail.com",
      passwordHash: userPass,
      fullName: "Buyer 1",
      phone: "0999888777"
    });
    
    console.log(`Seed Normal Buyer created!`);
    console.log(`- Email: buyer@gmail.com`);
    console.log(`- Pass: 12345678`);

    console.log("\n✅ Database Seeding completed successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Error seeding DB:", err);
    process.exit(1);
  }
}

seed();
