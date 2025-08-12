use anchor_lang::prelude::*;
use pyth_solana_receiver_sdk::price_update::{PriceUpdateV2};
use pyth_solana_receiver_sdk::price_update::get_feed_id_from_hex;
use std::str::FromStr;

declare_id!("");

pub const FEE_WALLET: &str = "";

#[program]
pub mod predictions_platform {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        let state = &mut ctx.accounts.state;
        let current_round = &mut ctx.accounts.current_round;
        let next_round = &mut ctx.accounts.next_round;
        let price_update = &mut ctx.accounts.price_update;

        // Set the initial metadata first
        vault.owner = ctx.accounts.payer.key();
        vault.balance = 0;   
        
        state.current_round_id = 0;
        state.next_round_id = 1;
        state.current_round = current_round.key();
        state.next_round = next_round.key();
        state.round_start_time = Clock::get()?.unix_timestamp;

        // Initialize rounds without price first
        current_round.id = state.current_round_id;
        next_round.id = state.next_round_id;
        current_round.start_time = Some(Clock::get()?.unix_timestamp);
        current_round.end_time = Some(Clock::get()?.unix_timestamp + 3600);
        current_round.end_price = None; 
        current_round.is_active = true;
        current_round.total_bets_up = 0;
        current_round.total_bets_down = 0;
        current_round.total_pool = 0;
        current_round.winning_pool = 0;

        // Initialize next round
        next_round.start_time = None;
        next_round.start_price = None;
        next_round.end_time = None;
        next_round.is_active = false;    
        next_round.end_price = None; 
        next_round.total_bets_up = 0;
        next_round.total_bets_down = 0;
        next_round.total_pool = 0;
        next_round.winning_pool = 0;

        // Get initial SOL price last
        let maximum_age: u64 = 60;
        let feed_id: [u8; 32] = get_feed_id_from_hex("0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d")?;
        let initial_price = price_update.get_price_no_older_than(&Clock::get()?, maximum_age, &feed_id)?;
        
        // Set the price after initialization
        current_round.start_price = Some(initial_price.price);

        Ok(())
    }

    // Place a bet
    pub fn place_bet(ctx: Context<PlaceBet>, direction: Direction, amount: u64) -> Result<()> {
        require!(
            amount >= 5_000_000 && amount <= 10_000_000_000,
            BettingError::InvalidAmount
        );

        let next_round = &mut ctx.accounts.next_round;
        let vault = &mut ctx.accounts.vault;
        let user_bet = &mut ctx.accounts.user_bet;
        
        // Ensure the next round is in the betting phase
        require!(!next_round.is_active, BettingError::RoundStarted);

        // Calculate fee (5%)
        let fee = amount.checked_mul(5).ok_or(BettingError::Overflow)?
            .checked_div(100).ok_or(BettingError::Overflow)?;
        let bet_amount = amount.checked_sub(fee).ok_or(BettingError::Overflow)?;

        // Transfer bet amount to vault
        anchor_lang::system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: ctx.accounts.user.to_account_info(),
                    to: vault.to_account_info(),
                },
            ),
            bet_amount,
        )?;

        // Transfer fee to fee wallet
        anchor_lang::system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: ctx.accounts.user.to_account_info(),
                    to: ctx.accounts.fee_wallet.to_account_info(),
                },
            ),
            fee,
        )?;

        // Initialize user bet account
        user_bet.round_id = next_round.id;
        user_bet.user = ctx.accounts.user.key();
        user_bet.direction = direction.clone();
        user_bet.amount = bet_amount;
        user_bet.claimed = false;

        // Update round totals
        match direction {
            Direction::Up => next_round.total_bets_up = next_round.total_bets_up
                .checked_add(bet_amount).ok_or(BettingError::Overflow)?,
            Direction::Down => next_round.total_bets_down = next_round.total_bets_down
                .checked_add(bet_amount).ok_or(BettingError::Overflow)?,
        }

        // Update total pool
        next_round.total_pool = next_round.total_pool
            .checked_add(bet_amount).ok_or(BettingError::Overflow)?;

        // Update vault balance
        vault.balance = vault.balance.checked_add(bet_amount).ok_or(BettingError::Overflow)?;

        Ok(())
    }

    // End the betting round
    pub fn end_round(ctx: Context<EndRound>) -> Result<()> {
        let state = &mut ctx.accounts.state;
        let current_round = &mut ctx.accounts.current_round;
        let next_round = &mut ctx.accounts.next_round;
        let betting_round = &mut ctx.accounts.betting_round;
    
        // Ensure the current round has ended
        let current_time = Clock::get()?.unix_timestamp;
        require!(
            current_round.end_time.is_some() && current_time >= current_round.end_time.unwrap(),
            BettingError::RoundNotEnded
        );

        // Fetch SOL price
        let price_update = &mut ctx.accounts.price_update;
        let maximum_age: u64 = 60;
        let feed_id: [u8; 32] = get_feed_id_from_hex("0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d")?;
        let end_price = price_update.get_price_no_older_than(&Clock::get()?, maximum_age, &feed_id)?;

        // Determine outcome
        let start_price = current_round.start_price.ok_or(BettingError::NoStartPrice)?;
        let outcome = if Some(end_price.price) > Some(start_price) {
            Direction::Up
        } else {
            Direction::Down
        };

        // Update current round
        current_round.end_price = Some(end_price.price);
        current_round.outcome = Some(outcome.clone());
        current_round.is_active = false;
        current_round.winning_pool = match outcome {
            Direction::Up => current_round.total_bets_up,
            Direction::Down => current_round.total_bets_down,
        };

        // Set up next round
        next_round.start_time = Some(current_time);
        next_round.end_time = Some(current_time + 3600);
        next_round.start_price = Some(end_price.price);
        next_round.is_active = true;

        // Initialize new betting round
        betting_round.id = state.next_round_id + 1;
        betting_round.is_active = false;
        betting_round.total_bets_up = 0;
        betting_round.total_bets_down = 0;
        betting_round.total_pool = 0;
        betting_round.winning_pool = 0;

        // Update state
        state.current_round = state.next_round;
        state.current_round_id = state.next_round_id;
        state.next_round = betting_round.key();
        state.next_round_id = betting_round.id;
        state.round_start_time = Clock::get()?.unix_timestamp;
    
        Ok(())
    }    

    // Add new instruction for vault withdrawal
    pub fn withdraw_from_vault(ctx: Context<WithdrawFromVault>, amount: u64) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        
        // Ensure caller is vault owner
        require!(
            ctx.accounts.owner.key() == vault.owner,
            BettingError::Unauthorized
        );

        // Calculate available balance (total balance minus active bets)
        let available_balance = vault.balance
            .checked_sub(ctx.accounts.current_round.total_bets_up)
            .and_then(|bal| bal.checked_sub(ctx.accounts.current_round.total_bets_down))
            .ok_or(BettingError::InsufficientBalance)?;

        // Ensure withdrawal won't affect active bets
        require!(
            amount <= available_balance,
            BettingError::InsufficientBalance
        );

        // Transfer lamports directly
        let vault_info = vault.to_account_info();
        let owner_info = ctx.accounts.owner.to_account_info();

        **vault_info.try_borrow_mut_lamports()? = vault_info.lamports()
            .checked_sub(amount)
            .ok_or(BettingError::InsufficientBalance)?;

        **owner_info.try_borrow_mut_lamports()? = owner_info.lamports()
            .checked_add(amount)
            .ok_or(BettingError::Overflow)?;

        // Update vault balance
        vault.balance = vault.balance.checked_sub(amount).ok_or(BettingError::Overflow)?;

        Ok(())
    }

    // New instruction for claiming winnings
    pub fn claim_winnings(ctx: Context<ClaimWinnings>) -> Result<()> {
        let round = &mut ctx.accounts.round;
        let user_bet = &mut ctx.accounts.user_bet;
        let vault = &mut ctx.accounts.vault;

        require!(!round.is_active, BettingError::RoundActive);
        let outcome = round.outcome.as_ref().ok_or(BettingError::RoundNotEnded)?;
        
        // Verify user won
        require!(user_bet.direction == *outcome, BettingError::InvalidBet);
        require!(user_bet.claimed == false, BettingError::Claimed);

        // Calculate payout
        let odds = round.total_pool as f64 / round.winning_pool as f64;
        let payout = ((user_bet.amount as f64 * odds) as u64).min(round.total_pool);

        // Transfer winnings
        let vault_info = vault.to_account_info();
        let user_info = ctx.accounts.user.to_account_info();
    
        **vault_info.try_borrow_mut_lamports()? = vault_info.lamports()
            .checked_sub(payout)
            .ok_or(BettingError::InsufficientBalance)?;
    
        **user_info.try_borrow_mut_lamports()? = user_info.lamports()
            .checked_add(payout)
            .ok_or(BettingError::Overflow)?;

        // Mark bet as claimed
        user_bet.claimed = true;

        // Update vault balance
        vault.balance = vault.balance.checked_sub(payout).ok_or(BettingError::Overflow)?;

        Ok(())
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum Direction {
    Up,
    Down,
}

#[account]
#[derive(Default)]
pub struct Round {
    pub id: u64,
    pub start_time: Option<i64>,
    pub end_time: Option<i64>,
    pub start_price: Option<i64>,
    pub end_price: Option<i64>,
    pub total_bets_up: u64,
    pub total_bets_down: u64,
    pub is_active: bool,
    pub outcome: Option<Direction>,
    pub total_pool: u64,
    pub winning_pool: u64,
}

#[account]
pub struct UserBet {
    pub round_id: u64,
    pub user: Pubkey,
    pub direction: Direction,
    pub amount: u64,
    pub claimed: bool,
}

#[error_code]
pub enum BettingError {
    #[msg("Round closed")]
    BettingClosed,
    #[msg("Round not ended")]
    RoundNotEnded,
    #[msg("No start price")]
    NoStartPrice,
    #[msg("Round started")]
    RoundStarted,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Insufficient balance")]
    InsufficientBalance,
    #[msg("Overflow")]
    Overflow,
    #[msg("Invalid fee wallet")]
    InvalidFeeWallet,
    #[msg("Round active")]
    RoundActive,
    #[msg("Already claimed")]
    Claimed,
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Invalid bet")]
    InvalidBet,
}

#[account]
#[derive(Default)]
pub struct Vault {
    pub owner: Pubkey,
    pub balance: u64
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init,
        payer = payer,
        space = 8 + 32 + 8,
        seeds = [b"vault"],
        bump
    )]
    pub vault: Account<'info, Vault>,
    #[account(
        init,
        payer = payer,
        space = 8 + 8 + 8 + 32 + 32 + 8,
        seeds = [b"state"],
        bump
    )]
    pub state: Account<'info, State>,
    #[account(
        init,
        payer = payer,
        space = 8 +  // discriminator
                8 +  // id
                9 +  // start_time
                9 +  // end_time
                9 +  // start_price
                9 +  // end_price
                8 +  // total_bets_up
                8 +  // total_bets_down
                1 +  // is_active
                2 +  // outcome
                8 +  // total_pool
                8 + 20,
        seeds = [b"round", 0_u64.to_le_bytes().as_ref()],
        bump
    )]
    pub current_round: Box<Account<'info, Round>>,
    #[account(
        init,
        payer = payer,
        space = 8 + 8 + 9 + 9 + 9 + 9 + 8 + 8 + 1 + 2 + 8 + 8 + 20,
        seeds = [b"round", 1_u64.to_le_bytes().as_ref()],
        bump
    )]
    pub next_round: Box<Account<'info, Round>>,
    #[account(mut)]
    pub price_update: Account<'info, PriceUpdateV2>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct PlaceBet<'info> {
    #[account(mut)]
    pub state: Account<'info, State>,
    #[account(mut)]
    pub next_round: Account<'info, Round>,
    #[account(mut)]
    pub vault: Account<'info, Vault>,
    #[account(
        init,
        payer = user,
        space = 8 + 8 + 32 + 2 + 8 + 1,
        seeds = [
            b"user_bet",
            next_round.id.to_le_bytes().as_ref(),
            user.key().as_ref()
        ],
        bump
    )]
    pub user_bet: Box<Account<'info, UserBet>>,
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        mut,
        constraint = fee_wallet.key() == Pubkey::from_str(FEE_WALLET).unwrap() @ BettingError::InvalidFeeWallet
    )]
    /// CHECK: This is the fee wallet
    pub fee_wallet: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct EndRound<'info> {
    #[account(mut)]
    pub state: Account<'info, State>,
    #[account(mut)]
    pub current_round: Account<'info, Round>,
    #[account(mut)]
    pub next_round: Account<'info, Round>,
    #[account(
        init,
        payer = user,
        space = 8 + 8 + 9 + 9 + 9 + 9 + 8 + 8 + 1 + 2 + 8 + 8 + 20,
        seeds = [b"round", (state.next_round_id + 1).to_le_bytes().as_ref()],
        bump
    )]
    pub betting_round: Box<Account<'info, Round>>,
    #[account(mut)]
    pub vault: Account<'info, Vault>,
    #[account(mut)]
    pub price_update: Account<'info, PriceUpdateV2>,
    #[account(mut, constraint = user.key == &Pubkey::from_str("Dhg7qk1boCoMQotctSZANV7bDnbs3ThDMP4VZmheevEB").unwrap())]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct WithdrawFromVault<'info> {
    #[account(mut, constraint = owner.key == &vault.owner)]
    pub vault: Account<'info, Vault>,
    pub owner: Signer<'info>,
    #[account(mut)]
    pub current_round: Account<'info, Round>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClaimWinnings<'info> {
    #[account(mut)]
    pub round: Account<'info, Round>,
    #[account(
        mut,
        seeds = [
            b"user_bet",
            round.id.to_le_bytes().as_ref(),
            user.key().as_ref()
        ],
        constraint = !user_bet.claimed @ BettingError::Claimed,
        constraint = user_bet.round_id == round.id @ BettingError::InvalidBet,
        constraint = user_bet.user == user.key() @ BettingError::Unauthorized,
        bump
    )]
    pub user_bet: Account<'info, UserBet>,
    #[account(mut)]
    pub vault: Account<'info, Vault>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct State {
    pub current_round_id: u64,      // Changed from u64
    pub next_round_id: u64,         // Changed from u64
    pub current_round: Pubkey,
    pub next_round: Pubkey,
    pub round_start_time: i64,      // Keep i64 for timestamp
}

#[error_code]
pub enum ErrorCode {
    #[msg("Arithmetic overflow")]
    Overflow,
}
