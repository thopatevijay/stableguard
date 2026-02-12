use anchor_lang::prelude::*;

declare_id!("A1NxaEoNRreaTCMaiNLfXBKj1bU13Trhwjr2h5Xvbmmr");

#[program]
pub mod stableguard {
    use super::*;

    /// Initialize the treasury state PDA for the agent.
    pub fn initialize_treasury(ctx: Context<InitializeTreasury>) -> Result<()> {
        let treasury = &mut ctx.accounts.treasury;
        treasury.authority = ctx.accounts.authority.key();
        treasury.usdc_balance = 0;
        treasury.usdt_balance = 0;
        treasury.pyusd_balance = 0;
        treasury.total_value_usd = 0;
        treasury.last_rebalance = Clock::get()?.unix_timestamp;
        treasury.is_active = true;
        treasury.bump = ctx.bumps.treasury;
        msg!("Treasury initialized for authority: {}", treasury.authority);
        Ok(())
    }

    /// Update treasury balances after a swap or deposit.
    pub fn update_treasury(
        ctx: Context<UpdateTreasury>,
        usdc_balance: u64,
        usdt_balance: u64,
        pyusd_balance: u64,
        total_value_usd: u64,
    ) -> Result<()> {
        let treasury = &mut ctx.accounts.treasury;
        treasury.usdc_balance = usdc_balance;
        treasury.usdt_balance = usdt_balance;
        treasury.pyusd_balance = pyusd_balance;
        treasury.total_value_usd = total_value_usd;
        treasury.last_rebalance = Clock::get()?.unix_timestamp;
        msg!("Treasury updated: USDC={}, USDT={}, PYUSD={}", usdc_balance, usdt_balance, pyusd_balance);
        Ok(())
    }

    /// Log an agent action (alert, rebalance, emergency exit).
    pub fn log_action(
        ctx: Context<LogAction>,
        action_type: u8,
        from_token: u8,
        to_token: u8,
        amount: u64,
        risk_score: u8,
        details: String,
    ) -> Result<()> {
        require!(details.len() <= 200, StableGuardError::DetailsTooLong);

        let action_log = &mut ctx.accounts.action_log;
        let entry = ActionEntry {
            timestamp: Clock::get()?.unix_timestamp,
            action_type,
            from_token,
            to_token,
            amount,
            risk_score,
            details,
        };

        // Ring buffer: overwrite oldest if full
        if action_log.count < ActionLog::MAX_ENTRIES as u32 {
            action_log.entries.push(entry);
            action_log.count += 1;
        } else {
            let idx = action_log.head as usize;
            action_log.entries[idx] = entry;
            action_log.head = ((action_log.head as usize + 1) % ActionLog::MAX_ENTRIES) as u32;
        }

        action_log.total_actions += 1;
        Ok(())
    }

    /// Initialize the action log PDA.
    pub fn initialize_action_log(ctx: Context<InitializeActionLog>) -> Result<()> {
        let action_log = &mut ctx.accounts.action_log;
        action_log.authority = ctx.accounts.authority.key();
        action_log.entries = Vec::new();
        action_log.count = 0;
        action_log.head = 0;
        action_log.total_actions = 0;
        action_log.bump = ctx.bumps.action_log;
        msg!("Action log initialized");
        Ok(())
    }

    /// Initialize risk config with default thresholds.
    pub fn initialize_risk_config(
        ctx: Context<InitializeRiskConfig>,
        alert_threshold: u8,
        rebalance_threshold: u8,
        emergency_threshold: u8,
    ) -> Result<()> {
        let config = &mut ctx.accounts.risk_config;
        config.authority = ctx.accounts.authority.key();
        config.alert_threshold = alert_threshold;
        config.rebalance_threshold = rebalance_threshold;
        config.emergency_threshold = emergency_threshold;
        config.price_weight = 40;
        config.liquidity_weight = 30;
        config.volume_weight = 20;
        config.whale_weight = 10;
        config.is_active = true;
        config.bump = ctx.bumps.risk_config;
        msg!("Risk config initialized: alert={}, rebalance={}, emergency={}",
            alert_threshold, rebalance_threshold, emergency_threshold);
        Ok(())
    }

    /// Update risk config thresholds.
    pub fn update_risk_config(
        ctx: Context<UpdateRiskConfig>,
        alert_threshold: u8,
        rebalance_threshold: u8,
        emergency_threshold: u8,
    ) -> Result<()> {
        let config = &mut ctx.accounts.risk_config;
        config.alert_threshold = alert_threshold;
        config.rebalance_threshold = rebalance_threshold;
        config.emergency_threshold = emergency_threshold;
        msg!("Risk config updated");
        Ok(())
    }
}

// ── Accounts ────────────────────────────────────────────────────────────────

#[derive(Accounts)]
pub struct InitializeTreasury<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Treasury::INIT_SPACE,
        seeds = [b"treasury", authority.key().as_ref()],
        bump
    )]
    pub treasury: Account<'info, Treasury>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateTreasury<'info> {
    #[account(
        mut,
        seeds = [b"treasury", authority.key().as_ref()],
        bump = treasury.bump,
        has_one = authority,
    )]
    pub treasury: Account<'info, Treasury>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct InitializeActionLog<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + ActionLog::INIT_SPACE,
        seeds = [b"action_log", authority.key().as_ref()],
        bump
    )]
    pub action_log: Account<'info, ActionLog>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct LogAction<'info> {
    #[account(
        mut,
        seeds = [b"action_log", authority.key().as_ref()],
        bump = action_log.bump,
        has_one = authority,
    )]
    pub action_log: Account<'info, ActionLog>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct InitializeRiskConfig<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + RiskConfig::INIT_SPACE,
        seeds = [b"risk_config", authority.key().as_ref()],
        bump
    )]
    pub risk_config: Account<'info, RiskConfig>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateRiskConfig<'info> {
    #[account(
        mut,
        seeds = [b"risk_config", authority.key().as_ref()],
        bump = risk_config.bump,
        has_one = authority,
    )]
    pub risk_config: Account<'info, RiskConfig>,
    pub authority: Signer<'info>,
}

// ── State ───────────────────────────────────────────────────────────────────

#[account]
#[derive(InitSpace)]
pub struct Treasury {
    pub authority: Pubkey,
    pub usdc_balance: u64,
    pub usdt_balance: u64,
    pub pyusd_balance: u64,
    pub total_value_usd: u64,
    pub last_rebalance: i64,
    pub is_active: bool,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct ActionEntry {
    pub timestamp: i64,
    pub action_type: u8,   // 0=MONITOR, 1=ALERT, 2=REBALANCE, 3=EMERGENCY_EXIT
    pub from_token: u8,    // 0=USDC, 1=USDT, 2=PYUSD
    pub to_token: u8,
    pub amount: u64,
    pub risk_score: u8,
    #[max_len(200)]
    pub details: String,
}

#[account]
#[derive(InitSpace)]
pub struct ActionLog {
    pub authority: Pubkey,
    #[max_len(20)]
    pub entries: Vec<ActionEntry>,
    pub count: u32,
    pub head: u32,         // Ring buffer head pointer
    pub total_actions: u64,
    pub bump: u8,
}

impl ActionLog {
    pub const MAX_ENTRIES: usize = 20;
}

#[account]
#[derive(InitSpace)]
pub struct RiskConfig {
    pub authority: Pubkey,
    pub alert_threshold: u8,
    pub rebalance_threshold: u8,
    pub emergency_threshold: u8,
    pub price_weight: u8,
    pub liquidity_weight: u8,
    pub volume_weight: u8,
    pub whale_weight: u8,
    pub is_active: bool,
    pub bump: u8,
}

// ── Errors ──────────────────────────────────────────────────────────────────

#[error_code]
pub enum StableGuardError {
    #[msg("Details string exceeds 200 characters")]
    DetailsTooLong,
}
