import { AnchorProvider, Program, Wallet, BN } from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { readFileSync } from "fs";
import { SOLANA_RPC_URL, type StablecoinSymbol, type AgentAction } from "./config";

// Program ID from deployment
const PROGRAM_ID = new PublicKey("A1NxaEoNRreaTCMaiNLfXBKj1bU13Trhwjr2h5Xvbmmr");

// IDL loaded at runtime
const idl = require("../../target/idl/stableguard.json");

const TOKEN_INDEX: Record<StablecoinSymbol, number> = {
  USDC: 0,
  USDT: 1,
  PYUSD: 2,
};

const ACTION_TYPE_INDEX: Record<string, number> = {
  MONITOR: 0,
  ALERT: 1,
  REBALANCE: 2,
  EMERGENCY_EXIT: 3,
};

export class OnChainClient {
  private program: Program;
  private provider: AnchorProvider;
  private authority: Keypair;
  private initialized = false;

  constructor() {
    // Load wallet keypair
    const keypairPath = process.env.WALLET_KEYPAIR_PATH || `${process.env.HOME}/.config/solana/id.json`;
    const keypairData = JSON.parse(readFileSync(keypairPath, "utf-8"));
    this.authority = Keypair.fromSecretKey(Uint8Array.from(keypairData));

    const connection = new Connection(SOLANA_RPC_URL, "confirmed");
    const wallet = new Wallet(this.authority);
    this.provider = new AnchorProvider(connection, wallet, {
      commitment: "confirmed",
    });

    this.program = new Program(idl as any, this.provider);
  }

  get authorityPublicKey(): PublicKey {
    return this.authority.publicKey;
  }

  private getTreasuryPDA(): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("treasury"), this.authority.publicKey.toBuffer()],
      PROGRAM_ID
    );
  }

  private getActionLogPDA(): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("action_log"), this.authority.publicKey.toBuffer()],
      PROGRAM_ID
    );
  }

  private getRiskConfigPDA(): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("risk_config"), this.authority.publicKey.toBuffer()],
      PROGRAM_ID
    );
  }

  async initializeAll(): Promise<void> {
    if (this.initialized) return;

    console.log(`[OnChain] Authority: ${this.authority.publicKey.toBase58()}`);
    console.log(`[OnChain] Program ID: ${PROGRAM_ID.toBase58()}`);

    // Check if already initialized by trying to fetch accounts
    const [treasuryPDA] = this.getTreasuryPDA();
    const [actionLogPDA] = this.getActionLogPDA();
    const [riskConfigPDA] = this.getRiskConfigPDA();

    try {
      await (this.program.account as any).treasury.fetch(treasuryPDA);
      console.log("[OnChain] Treasury PDA already initialized");
    } catch {
      console.log("[OnChain] Initializing Treasury PDA...");
      const tx = await this.program.methods
        .initializeTreasury()
        .accounts({ authority: this.authority.publicKey })
        .rpc();
      console.log(`[OnChain] Treasury initialized: ${tx}`);
    }

    try {
      await (this.program.account as any).actionLog.fetch(actionLogPDA);
      console.log("[OnChain] ActionLog PDA already initialized");
    } catch {
      console.log("[OnChain] Initializing ActionLog PDA...");
      const tx = await this.program.methods
        .initializeActionLog()
        .accounts({ authority: this.authority.publicKey })
        .rpc();
      console.log(`[OnChain] ActionLog initialized: ${tx}`);
    }

    try {
      await (this.program.account as any).riskConfig.fetch(riskConfigPDA);
      console.log("[OnChain] RiskConfig PDA already initialized");
    } catch {
      console.log("[OnChain] Initializing RiskConfig PDA...");
      const tx = await this.program.methods
        .initializeRiskConfig(26, 51, 76)
        .accounts({ authority: this.authority.publicKey })
        .rpc();
      console.log(`[OnChain] RiskConfig initialized: ${tx}`);
    }

    this.initialized = true;
    console.log("[OnChain] All PDAs ready");
  }

  async logActionOnChain(action: AgentAction): Promise<string | null> {
    try {
      const actionType = ACTION_TYPE_INDEX[action.type] ?? 0;
      const fromToken = TOKEN_INDEX[action.fromToken] ?? 0;
      const toToken = action.toToken ? TOKEN_INDEX[action.toToken] : 0;
      const details = action.details.slice(0, 200);

      const tx = await this.program.methods
        .logAction(actionType, fromToken, toToken, new BN(0), action.riskScore, details)
        .accounts({ authority: this.authority.publicKey })
        .rpc();

      console.log(`[OnChain] Action logged: ${action.type} (tx: ${tx.slice(0, 16)}...)`);
      return tx;
    } catch (error) {
      console.error("[OnChain] Failed to log action:", error);
      return null;
    }
  }

  async updateTreasuryOnChain(
    usdcBalance: number,
    usdtBalance: number,
    pyusdBalance: number,
    totalValueUsd: number
  ): Promise<string | null> {
    try {
      const tx = await this.program.methods
        .updateTreasury(
          new BN(usdcBalance),
          new BN(usdtBalance),
          new BN(pyusdBalance),
          new BN(totalValueUsd)
        )
        .accounts({ authority: this.authority.publicKey })
        .rpc();

      console.log(`[OnChain] Treasury updated (tx: ${tx.slice(0, 16)}...)`);
      return tx;
    } catch (error) {
      console.error("[OnChain] Failed to update treasury:", error);
      return null;
    }
  }

  async fetchTreasury(): Promise<any> {
    const [pda] = this.getTreasuryPDA();
    return (this.program.account as any).treasury.fetch(pda);
  }

  async fetchActionLog(): Promise<any> {
    const [pda] = this.getActionLogPDA();
    return (this.program.account as any).actionLog.fetch(pda);
  }

  async fetchRiskConfig(): Promise<any> {
    const [pda] = this.getRiskConfigPDA();
    return (this.program.account as any).riskConfig.fetch(pda);
  }
}
