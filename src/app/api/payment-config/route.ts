export async function GET() {
  const recipient = process.env.PAYMENT_WALLET_ADDRESS;
  const creditsPerSonic = Number(process.env.CREDITS_PER_SONIC || 10_000_000);
  const chainId = Number(process.env.SONIC_CHAIN_ID || 146);

  if (!recipient) return Response.json({ configured: false, chainId, creditsPerSonic }, { status: 503 });
  return Response.json({ configured: true, recipient, chainId, creditsPerSonic, symbol: "S" });
}
