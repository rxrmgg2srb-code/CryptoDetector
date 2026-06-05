/**
 * DegenScore NFT Program
 *
 * Dynamic NFTs that represent a trader's DegenScore Card on-chain.
 *
 * Features:
 * - Mint NFTs with dynamic metadata
 * - Update scores on-chain
 * - Composable with other protocols
 * - 5% royalties to treasury
 * - Tradeable on all NFT marketplaces
 */

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount};
use mpl_token_metadata::instruction::{create_master_edition_v3, create_metadata_accounts_v3, update_metadata_accounts_v2};

declare_id!("DegenNFT11111111111111111111111111111111111");

#[program]
pub mod degen_nft {
    use super::*;

    /// Mint a new DegenScore NFT
    pub fn mint_degen_card(
        ctx: Context<MintDegenCard>,
        degen_score: u8,
        total_trades: u32,
        total_volume: u64,
        win_rate: u8,
        uri: String,
    ) -> Result<()> {
        require!(degen_score <= 100, ErrorCode::InvalidScore);
        require!(win_rate <= 100, ErrorCode::InvalidWinRate);

        let card_data = &mut ctx.accounts.card_data;
        card_data.owner = ctx.accounts.owner.key();
        card_data.mint = ctx.accounts.mint.key();
        card_data.degen_score = degen_score;
        card_data.total_trades = total_trades;
        card_data.total_volume = total_volume;
        card_data.win_rate = win_rate;
        card_data.last_updated = Clock::get()?.unix_timestamp;
        card_data.mint_number = ctx.accounts.global_state.total_minted + 1;
        card_data.is_genesis = ctx.accounts.global_state.total_minted < 1000; // First 1000 are Genesis

        // Update global state
        let global_state = &mut ctx.accounts.global_state;
        global_state.total_minted += 1;

        // Mint 1 token to owner (NFT standard)
        let cpi_accounts = token::MintTo {
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.token_account.to_account_info(),
            authority: ctx.accounts.owner.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::mint_to(cpi_ctx, 1)?;

        msg!(
            "Minted DegenScore NFT #{} - Score: {}, Trades: {}, Win Rate: {}%",
            card_data.mint_number,
            degen_score,
            total_trades,
            win_rate
        );

        Ok(())
    }

    /// Update the score on an existing NFT (owner only)
    pub fn update_score(
        ctx: Context<UpdateScore>,
        new_degen_score: u8,
        new_total_trades: u32,
        new_total_volume: u64,
        new_win_rate: u8,
    ) -> Result<()> {
        require!(new_degen_score <= 100, ErrorCode::InvalidScore);
        require!(new_win_rate <= 100, ErrorCode::InvalidWinRate);

        let card_data = &mut ctx.accounts.card_data;

        // Store old values for event
        let old_score = card_data.degen_score;

        // Update values
        card_data.degen_score = new_degen_score;
        card_data.total_trades = new_total_trades;
        card_data.total_volume = new_total_volume;
        card_data.win_rate = new_win_rate;
        card_data.last_updated = Clock::get()?.unix_timestamp;
        card_data.update_count += 1;

        msg!(
            "Updated DegenScore NFT #{} - Score: {} -> {}, Trades: {}, Updates: {}",
            card_data.mint_number,
            old_score,
            new_degen_score,
            new_total_trades,
            card_data.update_count
        );

        Ok(())
    }

    /// Initialize the global state (one-time)
    pub fn initialize_global_state(ctx: Context<InitializeGlobalState>) -> Result<()> {
        let global_state = &mut ctx.accounts.global_state;
        global_state.authority = ctx.accounts.authority.key();
        global_state.total_minted = 0;
        global_state.treasury = ctx.accounts.treasury.key();
        global_state.royalty_basis_points = 500; // 5% royalties

        msg!("Global state initialized - Royalties: 5%");

        Ok(())
    }

    /// Update royalty percentage (authority only)
    pub fn update_royalties(ctx: Context<UpdateRoyalties>, new_royalty_basis_points: u16) -> Result<()> {
        require!(new_royalty_basis_points <= 1000, ErrorCode::RoyaltiesTooHigh); // Max 10%

        let global_state = &mut ctx.accounts.global_state;
        global_state.royalty_basis_points = new_royalty_basis_points;

        msg!("Royalties updated to: {}%", new_royalty_basis_points / 100);

        Ok(())
    }
}

// ============================================================================
// CONTEXTS
// ============================================================================

#[derive(Accounts)]
pub struct MintDegenCard<'info> {
    #[account(
        init,
        payer = owner,
        space = 8 + CardData::INIT_SPACE,
        seeds = [b"card_data", mint.key().as_ref()],
        bump
    )]
    pub card_data: Account<'info, CardData>,

    #[account(
        mut,
        seeds = [b"global_state"],
        bump
    )]
    pub global_state: Account<'info, GlobalState>,

    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        init,
        payer = owner,
        mint::decimals = 0,
        mint::authority = owner,
    )]
    pub mint: Account<'info, Mint>,

    #[account(
        init,
        payer = owner,
        associated_token::mint = mint,
        associated_token::authority = owner,
    )]
    pub token_account: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, anchor_spl::associated_token::AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct UpdateScore<'info> {
    #[account(
        mut,
        seeds = [b"card_data", card_data.mint.as_ref()],
        bump,
        has_one = owner
    )]
    pub card_data: Account<'info, CardData>,

    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct InitializeGlobalState<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + GlobalState::INIT_SPACE,
        seeds = [b"global_state"],
        bump
    )]
    pub global_state: Account<'info, GlobalState>,

    #[account(mut)]
    pub authority: Signer<'info>,

    /// CHECK: Treasury wallet address
    pub treasury: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct UpdateRoyalties<'info> {
    #[account(
        mut,
        seeds = [b"global_state"],
        bump,
        has_one = authority
    )]
    pub global_state: Account<'info, GlobalState>,

    pub authority: Signer<'info>,
}

// ============================================================================
// ACCOUNTS
// ============================================================================

#[account]
#[derive(InitSpace)]
pub struct CardData {
    pub owner: Pubkey,
    pub mint: Pubkey,
    pub degen_score: u8,
    pub total_trades: u32,
    pub total_volume: u64,
    pub win_rate: u8,
    pub last_updated: i64,
    pub mint_number: u64,
    pub update_count: u32,
    pub is_genesis: bool,  // First 1000 cards
}

#[account]
#[derive(InitSpace)]
pub struct GlobalState {
    pub authority: Pubkey,
    pub treasury: Pubkey,
    pub total_minted: u64,
    pub royalty_basis_points: u16,
}

// ============================================================================
// ERRORS
// ============================================================================

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid DegenScore (must be 0-100)")]
    InvalidScore,

    #[msg("Invalid win rate (must be 0-100)")]
    InvalidWinRate,

    #[msg("Royalties cannot exceed 10%")]
    RoyaltiesTooHigh,
}
