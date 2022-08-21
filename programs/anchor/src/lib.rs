use anchor_lang::{
    prelude::*,
    solana_program::{program::invoke_signed, program::invoke, system_instruction}
    };
use std::str::FromStr;

declare_id!("86Cv87ngyvdDzwYc6qaAyCjrRobhPapUQ2oWexf1rrcY");

const TREASURY_PDA_SEED : &[u8] = b"treasury" ;

#[program]
pub mod anchor {
    use super::*;

    pub fn init(ctx:Context<Init>) -> Result<()> {
        let game_list = &mut ctx.accounts.game_list ;
        Ok(())
    }

    //The server create a game and add it to the game_list
    pub fn create_game(ctx: Context<Create>, entry_price : u64) -> Result<()> {

        msg!("A new game is created as {} with entry price of {}.", ctx.accounts.game.key(), entry_price);
        let game = &mut ctx.accounts.game ;

        let game_list = &mut ctx.accounts.game_list ;
        game_list.games.push(game.key());

        game.authority = ctx.accounts.authority.key() ;
        game.entry_price = entry_price ;
        game.rm = 0 ;

        let (game_pda, game_seed) = Pubkey::find_program_address(&[&game.key().to_bytes()], ctx.program_id );
        invoke(
            &system_instruction::transfer( &ctx.accounts.authority.key, &game_pda, 890880),
            &[
                ctx.accounts.authority.to_account_info(),
                ctx.accounts.game_pda.to_account_info(),
                ctx.accounts.system_program.to_account_info()
            ]
        )?;

        Ok(())
    }
    pub fn add_player(ctx: Context<Add>) -> Result<()> {

        //TODO !!
        //the game Account should no be loaded in the contexte but fetched from le game_list account
        //=> If there is an error to add the playerAddress in game Account's player array, 
        //should fetch an other game Account in the list (who is not full of players)
        let (treasury_pda, bump_seed) = Pubkey::find_program_address(&[TREASURY_PDA_SEED], ctx.program_id );
        let solem_inc_pk = Pubkey::from_str("C8G8fK6G6tzPeFDXArqXPJusd1vDfQAftLwBNu3qmaRb").unwrap();

        let entry_price = ctx.accounts.game.entry_price ;

        if ctx.accounts.player.lamports() >= entry_price {

            let game = &mut ctx.accounts.game ;//This is the game Account we should get from the list's adresses
            let mut full = false ;
            let mut i = 0 ;
            let mut can_add = true ;
            loop {
                if i < 3 {
                    if game.players[i].to_string() == ctx.accounts.player.key.to_string() {
                        can_add = false ;
                    } 
                }else {
                    break ;
                }
                i = i + 1 ;
            }
            if can_add {
                let mut i = 0 ;
                loop {
                    if i < 3 {
            
                        if game.players[i].to_string() == "11111111111111111111111111111111" {
                            game.players[i] = *ctx.accounts.player.key ;
                            invoke(
                                &system_instruction::transfer( &ctx.accounts.player.key, &treasury_pda, entry_price),
                                &[
                                    ctx.accounts.player.to_account_info(),
                                    ctx.accounts.treasury.to_account_info(),
                                    ctx.accounts.system_program.to_account_info()
                                ]
                            )?;
                            if i >= 2 {
                                full = true ;
                            }else{
                                msg!("Player {} enter in game.", ctx.accounts.player.key.to_string()); 
                            }
                            break ;
                        }
    
                    }else {
                        break ;
                    }
                    i = i + 1 ;
                }
                if full {

                    // msg!("Treasury lamports: {}", ctx.accounts.treasury.lamports() );
                    let treasury_funds = ctx.accounts.treasury.lamports() ;

                    let now_ts = Clock::get().unwrap().unix_timestamp ;

                    // Pubkey::new_unique(); 
                    // msg!("pk {}", pkr.to_string() );   

                    let random = now_ts%1000 + 1  ;

                    let players_funds = 3*game.entry_price*9/10 ;

                    if random > 690 + 210 + 70 + 29 && treasury_funds >= players_funds*50 {
                        game.rm = 50 ;
                    } else if random > 690 + 210 + 70 && treasury_funds >= players_funds*10 {
                        game.rm = 10 ;
                    } else if random > 690 + 210 && treasury_funds >= players_funds*5   {
                        game.rm = 5 ;
                    } else if random > 690 && treasury_funds >= players_funds*3  {
                        game.rm = 3 ;
                    }else{
                        game.rm = 2 ;
                    }

                    let final_reward = game.entry_price*(game.rm as u64) ;
                    let (game_pda, game_seed) = Pubkey::find_program_address(&[&game.key().to_bytes()], ctx.program_id );

                    let comission = entry_price*3/10 ;

                    invoke_signed(
                        &system_instruction::transfer(&treasury_pda, &game_pda, final_reward),
                        &[
                            ctx.accounts.treasury.to_account_info(),
                            ctx.accounts.game_pda.to_account_info(),
                            ctx.accounts.system_program.to_account_info()
                        ],
                        &[&[
                            TREASURY_PDA_SEED.as_ref(),
                            &[bump_seed],
                        ]],
                    )?;
                    invoke_signed(
                        &system_instruction::transfer( &treasury_pda, &solem_inc_pk, comission),
                        &[
                            ctx.accounts.treasury.to_account_info(),
                            ctx.accounts.solem_inc.to_account_info(),
                            ctx.accounts.system_program.to_account_info()
                        ],
                        &[&[
                            TREASURY_PDA_SEED.as_ref(),
                            &[bump_seed],
                        ]],
                    )?;


                    msg!(
                        "Player {} enter. The game {} started with a Reward Multiplicator of {} = {} lamports.", 
                        ctx.accounts.player.key.to_string(),
                        game.key(),
                        game.rm,
                        final_reward
                    );
    
                }
            }

        }

        Ok(())
    }
    pub fn remove_player(ctx : Context<Remove>) -> Result<()> {

        let refund = ctx.accounts.game.entry_price ;
        let (treasury_pda, bump_seed) = Pubkey::find_program_address(&[TREASURY_PDA_SEED], ctx.program_id );

        let player = ctx.accounts.player.key.to_string() ;

        let empty_pubkey : Pubkey = Pubkey::new(&[0;32]) ;
        let game = &mut ctx.accounts.game ;

        let mut i1 = 0 ;
        let mut playersInGame = 0 ;
        loop { 
            if i1 < 3 {
                if game.players[i1].to_string() != "11111111111111111111111111111111" {
                    playersInGame = playersInGame + 1 ;
                }
                i1 = i1 + 1 ;
            }else{
                break ;
            }
        }
        if playersInGame < 3 {

            let mut i = 0 ;
            loop {
                if i < 3 {

                    if game.players[i].to_string() == ctx.accounts.player.key.to_string() {

                        invoke_signed(
                            &system_instruction::transfer(&treasury_pda, &ctx.accounts.player.key(), refund),
                            &[
                                ctx.accounts.treasury.to_account_info(),
                                ctx.accounts.player.to_account_info(),
                                ctx.accounts.system_program.to_account_info()
                            ],
                            &[&[
                                TREASURY_PDA_SEED.as_ref(),
                                &[bump_seed],
                            ]],
                        )?;
                

                        game.players[i] = empty_pubkey ;

                        msg!("player {} has left the game and got a refund of {} lamports.", ctx.accounts.player.key(), refund );
                        break ;
                    }
                }else {

                    break ;
                }
                i = i + 1 ;
            }

        }else{
            msg!("player {} canot leave the game in the program beacause it already started.", ctx.accounts.player.key() );
        }
        Ok(())
    }
    pub fn end_game(ctx: Context<End> ) -> Result<()> {

        let game = &mut ctx.accounts.game ;
        game.winner = ctx.accounts.winner.key() ;

        let game_list = &mut ctx.accounts.game_list ;
        let position = game_list.games.iter().position(|x| *x == game.key()).expect("not found");
        game_list.games.remove(position);

        let reward = game.entry_price * (game.rm as u64) ;

        let (game_pda, game_seed) = Pubkey::find_program_address(&[&game.key().to_bytes()], ctx.program_id );

        invoke_signed(
            &system_instruction::transfer(&game_pda, &ctx.accounts.winner.key(), reward),
            &[
                ctx.accounts.game_pda.to_account_info(),
                ctx.accounts.winner.to_account_info(),
                ctx.accounts.system_program.to_account_info()
            ],
            &[&[
                game.key().to_bytes().as_ref(),
                &[game_seed],
            ]],
        )?;

        msg!(
            "The game {} is over. Winner is {} and has been credited of {} lamports.", 
            game.key(),
            &ctx.accounts.winner.key(), 
            reward
        );

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Init<'info> {
    #[account(mut)]
    pub server : Signer<'info>,
    #[account(
        init,
        payer = server,
        space = 8 + 32*100)]
    pub game_list : Account<'info, Gamelist>,
    pub system_program : Program<'info, System>
}


#[derive(Accounts)]
pub struct Create<'info> {
    #[account(mut)]
    pub game_list : Account<'info, Gamelist>,
    ///CHECK : can be unsafe
    #[account(mut)]
    pub game_pda : AccountInfo<'info>,
    #[account(mut)]
    pub authority : Signer<'info>,
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 64 + 32*3 + 32 + 8)]
    pub game : Account<'info, Game>,
    pub system_program : Program<'info, System>
}

#[derive(Accounts)]
pub struct Add<'info> {

    ///CHECK : can be unsafe
    #[account(mut)]
    pub treasury : AccountInfo<'info>,
    ///CHECK : can be unsafe
    #[account(mut)]
    pub solem_inc : AccountInfo<'info>,
    ///CHECK : can be unsafe
    #[account(mut)]
    pub game_pda : AccountInfo<'info>,
    
    pub system_program : Program<'info, System>,
    #[account(mut)]
    pub player : Signer<'info>,
    #[account(mut)]
    pub game : Account<'info, Game>
}

#[derive(Accounts)]
pub struct Remove<'info> {

    ///CHECK : can be unsafe
    #[account(mut)]
    pub treasury : AccountInfo<'info>,

    pub system_program : Program<'info, System>,
    #[account(mut)]
    pub player : Signer<'info>,
    #[account(mut)]
    pub game : Account<'info, Game>
}

#[derive(Accounts)]
pub struct End<'info> {
    #[account(mut)]
    pub game_list : Account<'info, Gamelist>,
    ///CHECK : can be unsafe
    #[account(mut)]
    pub game_pda : AccountInfo<'info>,

    pub system_program : Program<'info, System>,
    #[account(mut)]
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub winner : UncheckedAccount<'info>,
    #[account(mut)]
    pub authority : Signer<'info>,
    #[account(mut, has_one = authority)]
    pub game : Account<'info, Game>
}

#[account]
pub struct Gamelist {
    pub games : Vec<Pubkey> 
}

#[account]
pub struct Game {
    pub authority : Pubkey,
    pub rm : u8,
    pub entry_price : u64,
    pub players : [Pubkey;3],
    pub winner : Pubkey,
    pub bump : u8
}

#[account]
pub struct Player {}