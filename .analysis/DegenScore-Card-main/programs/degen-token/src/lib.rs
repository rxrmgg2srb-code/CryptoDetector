/**
 * $DEGEN Token Program
 *
 * The native utility token of the DegenScore ecosystem.
 *
 * Features:
 * - Mintable SPL token
 * - Transfer fees (5% burn, 5% to treasury)
 * - Anti-whale protection (max 1% of supply per wallet)
 * - Pausable in emergencies
 * - Upgradeable authority
 */

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Burn, Mint, MintTo, Token, TokenAccount, Transfer};

declare_id!("DegenScore11111111111111111111111111111111");

#[program]
pub mod degen_token {
    use super::*;

    /// Initialize the $DEGEN token mint
    pub fn initialize(ctx: Context<Initialize>, decimals: u8) -> Result<()> {
        let token_data = &mut ctx.accounts.token_data;
        token_data.authority = ctx.accounts.authority.key();
        token_data.total_supply = 1_000_000_000 * 10u64.pow(decimals as u32); // 1B tokens
        token_data.circulating_supply = 0;
        token_data.decimals = decimals;
        token_data.is_paused = false;
        token_data.burn_rate = 500; // 5% (in basis points: 500/10000)
        token_data.treasury_rate = 500; // 5%
        token_data.treasury = ctx.accounts.treasury.key();
        token_data.max_wallet_percent = 100; // 1% (in basis points: 100/10000)

        msg!("$DEGEN Token initialized with {} decimals", decimals);
        msg!("Total supply: {} tokens", token_data.total_supply);

        Ok(())
    }

    /// Mint new tokens (only authority)
    pub fn mint_tokens(ctx: Context<MintTokens>, amount: u64) -> Result<()> {
        let token_data = &mut ctx.accounts.token_data;

        require!(!token_data.is_paused, ErrorCode::ProgramPaused);

        // Check total supply limit
        require!(
            token_data.circulating_supply + amount <= token_data.total_supply,
            ErrorCode::ExceedsMaxSupply
        );

        // Mint tokens
        let cpi_accounts = MintTo {
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.destination.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        token::mint_to(cpi_ctx, amount)?;

        token_data.circulating_supply += amount;

        msg!("Minted {} tokens. New circulating supply: {}", amount, token_data.circulating_supply);

        Ok(())
    }

    /// Transfer tokens with automatic fees
    pub fn transfer_with_fees(ctx: Context<TransferWithFees>, amount: u64) -> Result<()> {
        let token_data = &ctx.accounts.token_data;

        require!(!token_data.is_paused, ErrorCode::ProgramPaused);

        // Calculate fees
        let burn_amount = amount * token_data.burn_rate as u64 / 10000;
        let treasury_amount = amount * token_data.treasury_rate as u64 / 10000;
        let recipient_amount = amount - burn_amount - treasury_amount;

        // Anti-whale check: recipient can't hold more than max_wallet_percent
        let max_wallet_amount = token_data.total_supply * token_data.max_wallet_percent as u64 / 10000;
        let recipient_new_balance = ctx.accounts.to.amount + recipient_amount;

        require!(
            recipient_new_balance <= max_wallet_amount,
            ErrorCode::ExceedsMaxWalletSize
        );

        // Transfer to recipient
        let cpi_accounts = Transfer {
            from: ctx.accounts.from.to_account_info(),
            to: ctx.accounts.to.to_account_info(),
            authority: ctx.accounts.from_authority.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, recipient_amount)?;

        // Transfer to treasury
        if treasury_amount > 0 {
            let cpi_accounts = Transfer {
                from: ctx.accounts.from.to_account_info(),
                to: ctx.accounts.treasury_account.to_account_info(),
                authority: ctx.accounts.from_authority.to_account_info(),
            };
            let cpi_program = ctx.accounts.token_program.to_account_info();
            let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
            token::transfer(cpi_ctx, treasury_amount)?;
        }

        // Burn tokens
        if burn_amount > 0 {
            let cpi_accounts = Burn {
                mint: ctx.accounts.mint.to_account_info(),
                from: ctx.accounts.from.to_account_info(),
                authority: ctx.accounts.from_authority.to_account_info(),
            };
            let cpi_program = ctx.accounts.token_program.to_account_info();
            let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
            token::burn(cpi_ctx, burn_amount)?;
        }

        msg!(
            "Transfer: {} to recipient, {} to treasury, {} burned",
            recipient_amount,
            treasury_amount,
            burn_amount
        );

        Ok(())
    }

    /// Pause/unpause the token (emergency only)
    pub fn set_paused(ctx: Context<SetPaused>, paused: bool) -> Result<()> {
        let token_data = &mut ctx.accounts.token_data;
        token_data.is_paused = paused;

        msg!("Token paused status set to: {}", paused);

        Ok(())
    }

    /// Update fee rates (authority only)
    pub fn update_fees(ctx: Context<UpdateFees>, burn_rate: u16, treasury_rate: u16) -> Result<()> {
        require!(burn_rate + treasury_rate <= 2000, ErrorCode::FeesTooHigh); // Max 20% total fees

        let token_data = &mut ctx.accounts.token_data;
        token_data.burn_rate = burn_rate;
        token_data.treasury_rate = treasury_rate;

        msg!("Fees updated - Burn: {}%, Treasury: {}%", burn_rate / 100, treasury_rate / 100);

        Ok(())
    }
}

// ============================================================================
// CONTEXTS
// ============================================================================

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + TokenData::INIT_SPACE,
        seeds = [b"token_data"],
        bump
    )]
    pub token_data: Account<'info, TokenData>,

    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(mut)]
    pub mint: Account<'info, Mint>,

    /// CHECK: Treasury wallet address
    pub treasury: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct MintTokens<'info> {
    #[account(
        mut,
        seeds = [b"token_data"],
        bump,
        has_one = authority
    )]
    pub token_data: Account<'info, TokenData>,

    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(mut)]
    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub destination: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct TransferWithFees<'info> {
    #[account(
        seeds = [b"token_data"],
        bump
    )]
    pub token_data: Account<'info, TokenData>,

    #[account(mut)]
    pub from: Account<'info, TokenAccount>,

    #[account(mut)]
    pub to: Account<'info, TokenAccount>,

    #[account(mut)]
    pub treasury_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub mint: Account<'info, Mint>,

    pub from_authority: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct SetPaused<'info> {
    #[account(
        mut,
        seeds = [b"token_data"],
        bump,
        has_one = authority
    )]
    pub token_data: Account<'info, TokenData>,

    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct UpdateFees<'info> {
    #[account(
        mut,
        seeds = [b"token_data"],
        bump,
        has_one = authority
    )]
    pub token_data: Account<'info, TokenData>,

    pub authority: Signer<'info>,
}

// ============================================================================
// ACCOUNTS
// ============================================================================

#[account]
#[derive(InitSpace)]
pub struct TokenData {
    pub authority: Pubkey,
    pub treasury: Pubkey,
    pub total_supply: u64,
    pub circulating_supply: u64,
    pub decimals: u8,
    pub is_paused: bool,
    pub burn_rate: u16,        // In basis points (500 = 5%)
    pub treasury_rate: u16,     // In basis points (500 = 5%)
    pub max_wallet_percent: u16, // In basis points (100 = 1%)
}

// ============================================================================
// ERRORS
// ============================================================================

#[error_code]
pub enum ErrorCode {
    #[msg("Program is paused")]
    ProgramPaused,

    #[msg("Exceeds maximum supply")]
    ExceedsMaxSupply,

    #[msg("Exceeds maximum wallet size (anti-whale protection)")]
    ExceedsMaxWalletSize,

    #[msg("Total fees cannot exceed 20%")]
    FeesTooHigh,
}
