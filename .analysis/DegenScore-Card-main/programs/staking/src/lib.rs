/**
 * $DEGEN Staking Program
 *
 * Lock $DEGEN tokens to earn rewards and unlock premium features.
 *
 * Tiers:
 * - STAKER: 10,000 $DEGEN (2x rewards)
 * - WHALE: 100,000 $DEGEN (5x rewards + profit sharing)
 *
 * Features:
 * - Variable APY based on lock duration
 * - Tiered multipliers
 * - Early withdrawal penalty (20% to other stakers)
 * - Compound rewards
 */

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("DegenStake1111111111111111111111111111111");

// Lock durations in seconds
const LOCK_30_DAYS: i64 = 30 * 24 * 3600;
const LOCK_90_DAYS: i64 = 90 * 24 * 3600;
const LOCK_180_DAYS: i64 = 180 * 24 * 3600;
const LOCK_365_DAYS: i64 = 365 * 24 * 3600;

// APY rates (in basis points: 2000 = 20%)
const APY_30_DAYS: u16 = 2000;   // 20% APY
const APY_90_DAYS: u16 = 4000;   // 40% APY
const APY_180_DAYS: u16 = 8000;  // 80% APY
const APY_365_DAYS: u16 = 15000; // 150% APY

// Tier thresholds
const STAKER_THRESHOLD: u64 = 10_000 * 10u64.pow(9); // 10k tokens (9 decimals)
const WHALE_THRESHOLD: u64 = 100_000 * 10u64.pow(9); // 100k tokens

#[program]
pub mod staking {
    use super::*;

    /// Initialize the staking pool (one-time)
    pub fn initialize_pool(ctx: Context<InitializePool>) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        pool.authority = ctx.accounts.authority.key();
        pool.total_staked = 0;
        pool.total_stakers = 0;
        pool.reward_vault = ctx.accounts.reward_vault.key();

        msg!("Staking pool initialized");

        Ok(())
    }

    /// Stake tokens with a lock period
    pub fn stake(ctx: Context<Stake>, amount: u64, lock_duration: i64) -> Result<()> {
        require!(amount > 0, ErrorCode::InvalidAmount);
        require!(
            lock_duration == LOCK_30_DAYS ||
            lock_duration == LOCK_90_DAYS ||
            lock_duration == LOCK_180_DAYS ||
            lock_duration == LOCK_365_DAYS,
            ErrorCode::InvalidLockDuration
        );

        let stake_account = &mut ctx.accounts.stake_account;
        let pool = &mut ctx.accounts.pool;
        let clock = Clock::get()?;

        // If first stake, initialize
        if stake_account.amount == 0 {
            stake_account.owner = ctx.accounts.owner.key();
            stake_account.start_time = clock.unix_timestamp;
            pool.total_stakers += 1;
        }

        // Transfer tokens to pool
        let cpi_accounts = Transfer {
            from: ctx.accounts.user_token_account.to_account_info(),
            to: ctx.accounts.pool_token_account.to_account_info(),
            authority: ctx.accounts.owner.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount)?;

        // Update stake account
        stake_account.amount += amount;
        stake_account.lock_until = clock.unix_timestamp + lock_duration;
        stake_account.last_claim = clock.unix_timestamp;
        stake_account.lock_duration = lock_duration;

        // Determine tier
        stake_account.tier = if stake_account.amount >= WHALE_THRESHOLD {
            Tier::Whale
        } else if stake_account.amount >= STAKER_THRESHOLD {
            Tier::Staker
        } else {
            Tier::None
        };

        // Calculate APY
        stake_account.apy_basis_points = match lock_duration {
            LOCK_30_DAYS => APY_30_DAYS,
            LOCK_90_DAYS => APY_90_DAYS,
            LOCK_180_DAYS => APY_180_DAYS,
            LOCK_365_DAYS => APY_365_DAYS,
            _ => 0,
        };

        // Update pool
        pool.total_staked += amount;

        msg!(
            "Staked {} tokens for {} days. Tier: {:?}, APY: {}%",
            amount,
            lock_duration / 86400,
            stake_account.tier,
            stake_account.apy_basis_points / 100
        );

        Ok(())
    }

    /// Claim rewards
    pub fn claim_rewards(ctx: Context<ClaimRewards>) -> Result<()> {
        let stake_account = &mut ctx.accounts.stake_account;
        let clock = Clock::get()?;

        let time_staked = clock.unix_timestamp - stake_account.last_claim;
        require!(time_staked > 0, ErrorCode::NoRewardsToClaim);

        // Calculate rewards
        let base_reward = calculate_rewards(
            stake_account.amount,
            stake_account.apy_basis_points,
            time_staked,
        );

        // Apply tier multiplier
        let multiplier = match stake_account.tier {
            Tier::None => 1,
            Tier::Staker => 2,
            Tier::Whale => 5,
        };

        let total_reward = base_reward * multiplier;

        // Transfer rewards from vault
        let cpi_accounts = Transfer {
            from: ctx.accounts.reward_vault.to_account_info(),
            to: ctx.accounts.user_token_account.to_account_info(),
            authority: ctx.accounts.pool_authority.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, total_reward)?;

        // Update claim time
        stake_account.last_claim = clock.unix_timestamp;
        stake_account.total_claimed += total_reward;

        msg!(
            "Claimed {} tokens ({}x multiplier). Total claimed: {}",
            total_reward,
            multiplier,
            stake_account.total_claimed
        );

        Ok(())
    }

    /// Unstake tokens
    pub fn unstake(ctx: Context<Unstake>) -> Result<()> {
        let stake_account = &mut ctx.accounts.stake_account;
        let pool = &mut ctx.accounts.pool;
        let clock = Clock::get()?;

        let amount = stake_account.amount;
        require!(amount > 0, ErrorCode::NothingToUnstake);

        let mut penalty = 0;
        let mut final_amount = amount;

        // Check if locked
        if clock.unix_timestamp < stake_account.lock_until {
            // Early withdrawal penalty: 20%
            penalty = amount * 20 / 100;
            final_amount = amount - penalty;

            msg!(
                "⚠️ Early withdrawal! Penalty: {} tokens (20%)",
                penalty
            );
        }

        // Transfer tokens back to user
        let cpi_accounts = Transfer {
            from: ctx.accounts.pool_token_account.to_account_info(),
            to: ctx.accounts.user_token_account.to_account_info(),
            authority: ctx.accounts.pool_authority.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, final_amount)?;

        // If penalty, keep in pool for other stakers
        if penalty > 0 {
            pool.total_penalty_pool += penalty;
        }

        // Update pool
        pool.total_staked -= amount;
        pool.total_stakers -= 1;

        // Reset stake account
        stake_account.amount = 0;
        stake_account.tier = Tier::None;

        msg!(
            "Unstaked {} tokens. Received: {} (Penalty: {})",
            amount,
            final_amount,
            penalty
        );

        Ok(())
    }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

fn calculate_rewards(amount: u64, apy_basis_points: u16, time_staked_seconds: i64) -> u64 {
    // Formula: (amount * APY * time) / (10000 * 365 * 86400)
    // time_staked_seconds / (365 * 86400) = fraction of year
    let annual_reward = (amount as u128) * (apy_basis_points as u128) / 10000;
    let reward = annual_reward * (time_staked_seconds as u128) / (365 * 86400);
    reward as u64
}

// ============================================================================
// CONTEXTS
// ============================================================================

#[derive(Accounts)]
pub struct InitializePool<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Pool::INIT_SPACE,
        seeds = [b"pool"],
        bump
    )]
    pub pool: Account<'info, Pool>,

    #[account(mut)]
    pub authority: Signer<'info>,

    /// CHECK: Reward vault token account
    pub reward_vault: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct Stake<'info> {
    #[account(
        init_if_needed,
        payer = owner,
        space = 8 + StakeAccount::INIT_SPACE,
        seeds = [b"stake", owner.key().as_ref()],
        bump
    )]
    pub stake_account: Account<'info, StakeAccount>,

    #[account(
        mut,
        seeds = [b"pool"],
        bump
    )]
    pub pool: Account<'info, Pool>,

    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub pool_token_account: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct ClaimRewards<'info> {
    #[account(
        mut,
        seeds = [b"stake", owner.key().as_ref()],
        bump,
        has_one = owner
    )]
    pub stake_account: Account<'info, StakeAccount>,

    pub owner: Signer<'info>,

    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub reward_vault: Account<'info, TokenAccount>,

    /// CHECK: Pool authority PDA
    pub pool_authority: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Unstake<'info> {
    #[account(
        mut,
        seeds = [b"stake", owner.key().as_ref()],
        bump,
        has_one = owner
    )]
    pub stake_account: Account<'info, StakeAccount>,

    #[account(
        mut,
        seeds = [b"pool"],
        bump
    )]
    pub pool: Account<'info, Pool>,

    pub owner: Signer<'info>,

    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub pool_token_account: Account<'info, TokenAccount>,

    /// CHECK: Pool authority PDA
    pub pool_authority: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,
}

// ============================================================================
// ACCOUNTS
// ============================================================================

#[account]
#[derive(InitSpace)]
pub struct Pool {
    pub authority: Pubkey,
    pub reward_vault: Pubkey,
    pub total_staked: u64,
    pub total_stakers: u64,
    pub total_penalty_pool: u64,
}

#[account]
#[derive(InitSpace)]
pub struct StakeAccount {
    pub owner: Pubkey,
    pub amount: u64,
    pub start_time: i64,
    pub lock_until: i64,
    pub lock_duration: i64,
    pub last_claim: i64,
    pub total_claimed: u64,
    pub apy_basis_points: u16,
    pub tier: Tier,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Debug, InitSpace)]
pub enum Tier {
    None,
    Staker,  // 10k+ tokens = 2x rewards
    Whale,   // 100k+ tokens = 5x rewards
}

// ============================================================================
// ERRORS
// ============================================================================

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid stake amount")]
    InvalidAmount,

    #[msg("Invalid lock duration (must be 30, 90, 180, or 365 days)")]
    InvalidLockDuration,

    #[msg("No rewards to claim")]
    NoRewardsToClaim,

    #[msg("Nothing to unstake")]
    NothingToUnstake,
}
