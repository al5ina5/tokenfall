// Credits are granted only after a verified native Sonic EVM transfer.

import { NextRequest } from "next/server";
import { JsonRpcProvider, getAddress, parseEther } from "ethers";
import { db } from "@/db";
import { creditPurchases, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getPlan } from "@/lib/plans";

const RPC_URL = process.env.SONIC_RPC_URL || "https://rpc.soniclabs.com";
const SONIC_CHAIN_ID = Number(process.env.SONIC_CHAIN_ID || 146);

export async function POST(req: NextRequest) {
  let body: { userId?: string; walletAddress?: string; txHash?: string; planId?: string };
  try { body = await req.json(); } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { userId, walletAddress, txHash, planId } = body;
  const plan = planId ? getPlan(planId) : undefined;
  const recipient = process.env.PAYMENT_WALLET_ADDRESS;

  if (!userId || !walletAddress || !txHash || !plan) {
    return Response.json({ error: "A valid plan, wallet, and transaction are required." }, { status: 400 });
  }
  if (!recipient) return Response.json({ error: "Payments are not configured yet." }, { status: 503 });

  const existingPurchase = await db.select().from(creditPurchases).where(eq(creditPurchases.txHash, txHash)).limit(1);
  if (existingPurchase.length) return Response.json({ error: "This transaction was already credited.", code: "ALREADY_CREDITED" }, { status: 409 });

  try {
    const provider = new JsonRpcProvider(RPC_URL, { name: "sonic", chainId: SONIC_CHAIN_ID });
    const tx = await provider.getTransaction(txHash);
    if (!tx || tx.to === null) return Response.json({ error: "Transaction not found yet.", code: "PAYMENT_PENDING" }, { status: 202 });
    if (tx.chainId !== BigInt(SONIC_CHAIN_ID)) return Response.json({ error: "Transaction is not on Sonic.", code: "WRONG_NETWORK" }, { status: 402 });
    if (tx.from.toLowerCase() !== getAddress(walletAddress).toLowerCase()) return Response.json({ error: "Sender does not match connected wallet." }, { status: 402 });
    if (tx.to.toLowerCase() !== getAddress(recipient).toLowerCase()) return Response.json({ error: "Payment recipient does not match TokenFall treasury." }, { status: 402 });

    const requiredWei = parseEther(plan.priceSonic);
    if (tx.value < requiredWei) return Response.json({ error: `This plan requires ${plan.priceSonic} S.` }, { status: 402 });

    const receipt = await tx.wait(1);
    if (!receipt || receipt.status !== 1) return Response.json({ error: "Payment failed on Sonic.", code: "PAYMENT_FAILED" }, { status: 402 });

    const sender = getAddress(walletAddress);
    const [existing] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const currentBalance = existing?.creditBalance ?? 0;
    const newBalance = currentBalance + plan.credits;

    await db.transaction(async (transaction) => {
      await transaction.insert(creditPurchases).values({
        id: nanoid(), userId, planId: plan.id, amount: plan.credits,
        costWei: tx.value.toString(), txHash, status: "credited",
      });
      if (existing) {
        await transaction.update(users).set({ creditBalance: newBalance, walletAddress: sender }).where(eq(users.id, userId));
      } else {
        await transaction.insert(users).values({ id: userId, walletAddress: sender, creditBalance: plan.credits });
      }
    });

    return Response.json({ userId, creditBalance: newBalance, added: plan.credits, txHash, planId: plan.id });
  } catch (error) {
    console.error("Sonic payment verification failed", error);
    return Response.json({ error: "Could not verify Sonic payment. Check the transaction and try again." }, { status: 502 });
  }
}
