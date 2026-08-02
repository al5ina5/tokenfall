import { pgTable, text, timestamp, integer, bigint, numeric, index } from "drizzle-orm/pg-core";

// ── API Keys ──
export const apiKeys = pgTable("api_keys", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull().default("default"),
  keyHash: text("key_hash").notNull().unique(),
  keyPrefix: text("key_prefix").notNull(), // "tf_sk_a1b2..." first 12 chars for display
  monthlyLimit: bigint("monthly_limit", { mode: "number" }).default(10_000_000),
  allowedModels: text("allowed_models").default("*"), // comma-separated or "*"
  webhookUrl: text("webhook_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  rotatedAt: timestamp("rotated_at"),
}, (table) => ({
  userIdIdx: index("api_keys_user_id_idx").on(table.userId),
  keyHashIdx: index("api_keys_key_hash_idx").on(table.keyHash),
}));

// ── Users ──
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  walletAddress: text("wallet_address").unique(),
  creditBalance: bigint("credit_balance", { mode: "number" }).default(0),
  nftTier: text("nft_tier").default("none"), // none | common | rare | legendary
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastLoginAt: timestamp("last_login_at"),
});

// ── Usage Log ──
export const usageLog = pgTable("usage_log", {
  id: text("id").primaryKey(),
  apiKeyId: text("api_key_id").notNull(),
  userId: text("user_id").notNull(),
  model: text("model").notNull(),
  provider: text("provider").notNull(),
  tokensInput: integer("tokens_input").notNull(),
  tokensOutput: integer("tokens_output").notNull(),
  costCredits: integer("cost_credits").notNull(), // token credits charged
  costUsdProvider: integer("cost_usd_provider").notNull(), // what we paid, in cents
  latencyMs: integer("latency_ms"),
  success: text("success").default("true"), // true | error | rate_limited
  timestamp: timestamp("timestamp").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("usage_log_user_id_idx").on(table.userId),
}));

// ── Achievements ──
export const achievements = pgTable("achievements", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  badgeKey: text("badge_key").notNull(), // prompt_pioneer, token_whale, model_explorer, referral_lord
  tier: text("tier").notNull(), // bronze | silver | gold | diamond
  progress: integer("progress").default(0), // 0-100 percentage
  minted: text("minted").default("false"), // true once soulbound NFT minted on-chain
  earnedAt: timestamp("earned_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Referrals ──
export const referrals = pgTable("referrals", {
  id: text("id").primaryKey(),
  referrerId: text("referrer_id").notNull(),
  referredUserId: text("referred_user_id").notNull().unique(),
  referralCode: text("referral_code").notNull(),
  shardsEarned: integer("shards_earned").default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Credit Purchases (on-chain tx ref) ──
export const creditPurchases = pgTable("credit_purchases", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  planId: text("plan_id").notNull().default("custom"),
  amount: bigint("amount", { mode: "number" }).notNull(),
  costWei: numeric("cost_wei", { precision: 78, scale: 0 }).notNull(),
  txHash: text("tx_hash").notNull().unique(),
  status: text("status").notNull().default("credited"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("credit_purchases_user_id_idx").on(table.userId),
  txHashIdx: index("credit_purchases_tx_hash_idx").on(table.txHash),
}));
