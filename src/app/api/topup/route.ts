// Credits are granted only after a verified native Sonic EVM transfer.

import { NextRequest } from "next/server";
import { JsonRpcProvider, getAddress, parseEther } from "ethers";
import { db } from "@/db";
import { creditPurchases, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

const RPC_URL = process.env.SONIC_RPC_URL || "https://rpc.soniclabs.com";
const SONIC_CHAIN_ID = Number(process.env.SONIC_CHAIN_ID || 146);
const CREDITS_PER_SONIC = Number(process.env.CREDITS_PER_SONIC || 10_000_000);

export async function POST(req: NextRequest) {
  let body: { userId?: string; walletAddress?: string; txHash?: string; expectedWei?: string };
  try { body = await req.json(); } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { userId, walletAddress, txHash, expectedWei } = body;
  const recipient = process.env.PAYMENT_WALLET_ADDRESS;
  if (!userId || !walletAddress || !txHash || !expectedWei) {
    return Response.json({ error: "Payment transaction, wallet, and amount are required." }, { status: 400 });
  }
  if (!recipient) return Response.json({ error: "Payments are not configured yet. Add PAYMENT_WALLET_ADDRESS in Vercel." }, { status: 503 });

  const existingPurchase = await db.select().from(creditPurchases).where(eq(creditPurchases.txHash, txHash)).limit(1);
  if (existingPurchase.length) return Response.json({ error: "This transaction was already credited." }, { status: 409 });

  try {
    const provider = new JsonRpcProvider(RPC_URL, { name: "sonic", chainId: SONIC_CHAIN_ID });
    const tx = await provider.getTransaction(txHash);
    if (!tx || tx.to === null) return Response.json({ error: "Transaction not found." }, { status: 402 });
    if (tx.chainId !== BigInt(SONIC_CHAIN_ID)) return Response.json({ error: "Transaction is not on Sonic." }, { status: 402 });
    if (tx.from.toLowerCase() !== getAddress(walletAddress).toLowerCase()) return Response.json({ error: "Sender does not match connected wallet." }, { status: 402 });
    if (tx.to.toLowerCase() !== getAddress(recipient).toLowerCase()) return Response.json({ error: "Payment recipient does not match TokenFall treasury." }, { status: 402 });
    if (tx.value < BigInt(expectedWei)) return Response.json({ error: "Verified payment is lower than the selected plan." }, { status: 402 });

    const receipt = await tx.wait(1);
    if (!receipt || receipt.status !== 1) return Response.json({ error: "Payment transaction failed or is not confirmed." }, { status: 402 });

    const sonicPaid = Number(tx.value) / 1e18;
    const credits = Math.floor(sonicPaid * CREDITS_PER_SONIC);
    if (credits <= 0) return Response.json({ error: "Payment is below the minimum credit amount." }, { status: 402 });

    const sender = getAddress(walletAddress);
    const [existing] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const currentBalance = existing?.creditBalance ?? 0;
    const newBalance = currentBalance + credits;

    if (existing) {
      await db.update(users).set({ creditBalance: newBalance, walletAddress: sender }).where(eq(users.id, userId));
    } else {
      await db.insert(users).values({ id: userId, walletAddress: sender, creditBalance: credits });
    }

    await db.insert(creditPurchases).values({ id: nanoid(), userId, amount: credits, costSol: Number(tx.value), txHash });
    return Response.json({ userId, creditBalance: newBalance, added: credits, txHash, chainId: SONIC_CHAIN_ID });
  } catch (error) {
    console.error("Sonic payment verification failed", error);
    return Response.json({ error: "Could not verify Sonic payment. Check the transaction hash and try again." }, { status: 502 });
  }
}
