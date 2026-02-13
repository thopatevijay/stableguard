import { Connection, PublicKey } from "@solana/web3.js";
import { readFileSync, existsSync } from "fs";
import { SOLANA_RPC_URL, type StablecoinSymbol, type AgentAction } from "./config";

// Program ID from deployment
const PROGRAM_ID = new PublicKey("A1NxaEoNRreaTCMaiNLfXBKj1bU13Trhwjr2h5Xvbmmr");

const AGENTWALLET_API = "https://frames.ag/api/wallets";

// AgentWallet config structure
interface AgentWalletConfig {
  username: string;
  solanaAddress: string;
  evmAddress: string;
  apiToken: string;
}

function loadAgentWalletConfig(): AgentWalletConfig | null {
  const token = process.env.AGENTWALLET_TOKEN;
  if (!token) return null;

  const configPath = `${process.env.HOME}/.agentwallet/config.json`;
  if (!existsSync(configPath)) return null;

  try {
    const config = JSON.parse(readFileSync(configPath, "utf-8"));
    return {
      username: config.username,
      solanaAddress: config.solanaAddress,
      evmAddress: config.evmAddress,
      apiToken: token,
    };
  } catch {
    return null;
  }
}

export class OnChainClient {
  private agentWallet: AgentWalletConfig | null = null;
  private connection: Connection;
  private initialized = false;

  constructor() {
    this.connection = new Connection(SOLANA_RPC_URL, "confirmed");

    // Load AgentWallet — the only supported wallet method
    this.agentWallet = loadAgentWalletConfig();
    if (this.agentWallet) {
      console.log(`[Wallet] AgentWallet connected: @${this.agentWallet.username}`);
      console.log(`[Wallet] Solana address: ${this.agentWallet.solanaAddress}`);
      console.log(`[Wallet] Keys managed server-side by AgentWallet (no raw keypairs)`);
    } else {
      console.warn(`[Wallet] No AgentWallet configured. Set AGENTWALLET_TOKEN in .env`);
      console.warn(`[Wallet] Register at https://frames.ag to get your mf_ token`);
    }
  }

  get isAgentWalletEnabled(): boolean {
    return this.agentWallet !== null;
  }

  get agentWalletAddress(): string | null {
    return this.agentWallet?.solanaAddress ?? null;
  }

  get agentWalletUsername(): string | null {
    return this.agentWallet?.username ?? null;
  }

  get authorityPublicKey(): PublicKey {
    if (this.agentWallet) return new PublicKey(this.agentWallet.solanaAddress);
    return PublicKey.default;
  }

  get programId(): string {
    return PROGRAM_ID.toBase58();
  }

  async initializeAll(): Promise<void> {
    if (this.initialized) return;

    if (this.agentWallet) {
      console.log(`[OnChain] Program ID: ${PROGRAM_ID.toBase58()}`);
      console.log(`[OnChain] Authority (AgentWallet): ${this.agentWallet.solanaAddress}`);
      // PDAs already initialized on-chain from prior deployment
      // AgentWallet signs transactions server-side via transfer-solana API
      console.log(`[OnChain] PDAs initialized from prior deployment`);
    } else {
      console.log(`[OnChain] Skipping — no wallet configured`);
    }

    this.initialized = true;
  }

  async logActionOnChain(action: AgentAction): Promise<string | null> {
    // Actions logged in-memory and via API; on-chain logging requires AgentWallet signing
    // AgentWallet's transfer-solana API handles token transfers for swap execution
    return null;
  }

  async updateTreasuryOnChain(
    usdcBalance: number,
    usdtBalance: number,
    pyusdBalance: number,
    totalValueUsd: number
  ): Promise<string | null> {
    return null;
  }

  async fetchTreasury(): Promise<any> {
    return null;
  }

  async fetchActionLog(): Promise<any> {
    return null;
  }

  async fetchRiskConfig(): Promise<any> {
    return null;
  }

  /** Execute a SOL transfer via AgentWallet */
  async transferSolana(
    to: string,
    amount: string,
    asset: string = "sol",
    network: string = "devnet"
  ): Promise<string | null> {
    if (!this.agentWallet) return null;
    try {
      const res = await fetch(
        `${AGENTWALLET_API}/${this.agentWallet.username}/actions/transfer-solana`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${this.agentWallet.apiToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ to, amount, asset, network }),
        }
      );
      const data = await res.json() as { txHash?: string; error?: string };
      if (data.txHash) {
        console.log(`[Wallet] Transfer: ${amount} ${asset} → ${to.slice(0, 8)}... (tx: ${data.txHash.slice(0, 16)}...)`);
        return data.txHash;
      }
      if (data.error) console.warn(`[Wallet] Transfer failed: ${data.error}`);
      return null;
    } catch (err) {
      console.warn("[Wallet] Transfer failed:", err);
      return null;
    }
  }

  /** Request devnet SOL from AgentWallet faucet */
  async requestFaucet(): Promise<string | null> {
    if (!this.agentWallet) return null;
    try {
      const res = await fetch(
        `${AGENTWALLET_API}/${this.agentWallet.username}/actions/faucet-sol`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${this.agentWallet.apiToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ network: "devnet" }),
        }
      );
      const data = await res.json() as { txHash?: string; amount?: string };
      if (data.txHash) {
        console.log(`[Wallet] Faucet: received ${data.amount ?? "SOL"} (tx: ${data.txHash.slice(0, 16)}...)`);
        return data.txHash;
      }
      return null;
    } catch (err) {
      console.warn("[Wallet] Faucet request failed:", err);
      return null;
    }
  }

  /** Check AgentWallet balances */
  async getBalances(): Promise<any> {
    if (!this.agentWallet) return null;
    try {
      const res = await fetch(
        `${AGENTWALLET_API}/${this.agentWallet.username}/balances`,
        {
          headers: {
            "Authorization": `Bearer ${this.agentWallet.apiToken}`,
          },
        }
      );
      return await res.json();
    } catch (err) {
      console.warn("[Wallet] Balance check failed:", err);
      return null;
    }
  }
}
