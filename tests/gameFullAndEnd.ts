import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { Anchor } from "../target/types/anchor";
import { expect } from "chai";
import { waitForRpc } from "./helper" ;
const { SystemProgram } = anchor.web3 ;

describe("create and start game", () => {

  anchor.setProvider(anchor.AnchorProvider.env());

  const provider = anchor.AnchorProvider.env();

  const game = anchor.web3.Keypair.generate();
  let gameList = anchor.web3.Keypair.generate() ;
  const player1 = anchor.web3.Keypair.generate();
  const player2 = anchor.web3.Keypair.generate();
  const player3 = anchor.web3.Keypair.generate();
  
  
  const entryPrice = Math.ceil(0.01*anchor.web3.LAMPORTS_PER_SOL) ;
  const playerBalance = anchor.web3.LAMPORTS_PER_SOL*2 ;

  const program = anchor.workspace.Anchor as Program<Anchor>;
  const solemInc = new anchor.web3.PublicKey("C8G8fK6G6tzPeFDXArqXPJusd1vDfQAftLwBNu3qmaRb") ;

  before( async () => {
    // await waitForRpc();
    // const tx = await provider.connection.requestAirdrop(solemInc, anchor.web3.LAMPORTS_PER_SOL );
    // await provider.connection.confirmTransaction(tx, "confirmed");
    // const balance = await provider.connection.getBalance(solemInc);
    // console.log('solem_inc balance', balance) ;
  });

  console.log("game pubkey", game.publicKey.toString() )
  console.log("provider pubkey", provider.wallet.publicKey.toString() );

  it("init", async () => {

    await program.methods
    .init()
    .accounts({
        gameList : gameList.publicKey,
        server : provider.wallet.publicKey,
        systemProgram : SystemProgram.programId
      })
    .signers([gameList]).rpc();

    
    const gameResult = await program.account.gamelist.fetch(gameList.publicKey);
    console.log('game result init', gameResult);
    expect(gameResult.games.length).equal(0);
    // expect(gameResult.authority.toString()).equal(provider.wallet.publicKey.toString());
    // expect(parseInt(gameResult.entryPrice.toString())).equal(entryPrice);
    // expect(parseInt(gameResult.entryPrice.toString())).equal(entryPrice);


  });


  it("create", async () => {

    let [gamePda] = await anchor.web3.PublicKey.findProgramAddress( 
      [game.publicKey.toBytes()], 
      program.programId
      );


    await program.methods
    .createGame( new anchor.BN(entryPrice) )
    .accounts({
        gameList : gameList.publicKey,
        gamePda : gamePda,
        authority : provider.wallet.publicKey,
        game : game.publicKey,
        systemProgram : SystemProgram.programId,
      })
    .signers([game]).rpc();


        
    const gameListResult = await program.account.gamelist.fetch(gameList.publicKey);
    console.log('game result init', gameListResult);
    expect(gameListResult.games.length).equal(1);
    
    const pk = new anchor.web3.PublicKey("86Cv87ngyvdDzwYc6qaAyCjrRobhPapUQ2oWexf1rrcY");

    // const testProgramFetch = await program. ;
    // console.log('testProgramFetching', testProgramFetch );

    
    const gameResult = await program.account.game.fetch(game.publicKey);
    expect(parseInt(gameResult.rm.toString())).equal(0);
    expect(gameResult.authority.toString()).equal(provider.wallet.publicKey.toString());
    expect(parseInt(gameResult.entryPrice.toString())).equal(entryPrice);
    expect(parseInt(gameResult.entryPrice.toString())).equal(entryPrice);


  });


  it("add player 1", async () => {

    const entryPrice = Math.ceil(0.01*anchor.web3.LAMPORTS_PER_SOL) ;

    await waitForRpc();
    const signatureAirdrop = await provider.connection.requestAirdrop(player1.publicKey, playerBalance) ;
    await provider.connection.confirmTransaction(signatureAirdrop) ;

    const solsBefore = await provider.connection.getBalance(player1.publicKey) ;


    const seed = Buffer.from(anchor.utils.bytes.utf8.encode("treasury"));
    let [treasuryPda] = await anchor.web3.PublicKey.findProgramAddress( 
      [seed], 
      program.programId
      );

    let [gamePda] = await anchor.web3.PublicKey.findProgramAddress( 
      [game.publicKey.toBytes()], 
      program.programId
      );

    const tx = await provider.connection.requestAirdrop(treasuryPda, anchor.web3.LAMPORTS_PER_SOL );
    await provider.connection.confirmTransaction(tx);
    const tx2 = await provider.connection.requestAirdrop(treasuryPda, anchor.web3.LAMPORTS_PER_SOL );
    await provider.connection.confirmTransaction(tx2);
    const treasuryBalance = await provider.connection.getBalance(treasuryPda);
    console.log('TREASURY SOLS', treasuryBalance);


    await program.methods
      .addPlayer()
      .accounts({

        treasury : treasuryPda,
        solemInc : solemInc,
        gamePda : gamePda,

        systemProgram : SystemProgram.programId,
        player : player1.publicKey,
        game : game.publicKey
      })
      .signers(
        [player1]
      ).rpc();
    
    const gameResult = await program.account.game.fetch(game.publicKey);

    const solsAfter = await provider.connection.getBalance(player1.publicKey) ;

    expect(parseInt(gameResult.rm.toString())).equal(0);
    expect(solsBefore-solsAfter).equals( entryPrice );
    expect(gameResult.authority.toString()).equal(provider.wallet.publicKey.toString());
    expect(gameResult.players[0].toString()).equal(player1.publicKey.toString());
    expect(parseInt(gameResult.entryPrice.toString())).equal(entryPrice);

  });

  it("add player 2", async () => {

    await waitForRpc();

    const signatureAirdrop = await provider.connection.requestAirdrop(player2.publicKey, playerBalance) ;
    await provider.connection.confirmTransaction(signatureAirdrop) ;

    const seed = Buffer.from(anchor.utils.bytes.utf8.encode("treasury"));
    let [treasuryPda] = await anchor.web3.PublicKey.findProgramAddress( 
      [seed], 
      program.programId
      );
      
    let [gamePda] = await anchor.web3.PublicKey.findProgramAddress( 
      [game.publicKey.toBytes()], 
      program.programId
      );

    await program.methods
    .addPlayer()
    .accounts({

        treasury : treasuryPda,
        solemInc : solemInc,
        gamePda : gamePda,

        systemProgram : SystemProgram.programId,
        player : player2.publicKey,
        game : game.publicKey
      })
      .signers(
        [player2]
      )
      .rpc();
    
    const gameResult = await program.account.game.fetch(game.publicKey);
    expect(parseInt(gameResult.rm.toString())).equal(0);
    expect(gameResult.authority.toString()).equal(provider.wallet.publicKey.toString());
    expect(gameResult.players[1].toString()).equal(player2.publicKey.toString());

  });


  it("add player 3", async () => {

    await waitForRpc();

    const signatureAirdrop = await provider.connection.requestAirdrop(player3.publicKey, playerBalance) ;
    await provider.connection.confirmTransaction(signatureAirdrop) ;

    console.log('player 3', player3.publicKey );

    const seed = Buffer.from(anchor.utils.bytes.utf8.encode("treasury"));
    let [treasuryPda] = await anchor.web3.PublicKey.findProgramAddress( 
      [seed], 
      program.programId
      );
      
    let [gamePda] = await anchor.web3.PublicKey.findProgramAddress( 
      [game.publicKey.toBytes()], 
      program.programId
      );

    await program.methods
    .addPlayer()
    .accounts({

        treasury : treasuryPda,
        solemInc : solemInc,
        gamePda : gamePda,

        systemProgram : SystemProgram.programId,
        player : player3.publicKey,
        game : game.publicKey
      })
      .signers(
        [player3]
      )
      .rpc();
    
    const gameResult = await program.account.game.fetch(game.publicKey);
    expect(parseInt(gameResult.rm.toString()) > 0 ).equal(true);
    expect(gameResult.authority.toString()).equal(provider.wallet.publicKey.toString());
    expect(gameResult.players[1].toString()).equal(player2.publicKey.toString());

  });

  it("end", async () => {

    await waitForRpc();


    let [gamePda] = await anchor.web3.PublicKey.findProgramAddress( 
      [game.publicKey.toBytes()], 
      program.programId
      );

    const player1BalanceBefore = await provider.connection.getBalance( player1.publicKey );

    await program.methods
    .endGame()
    .accounts({

      gameList : gameList.publicKey,
      gamePda : gamePda,

      authority : provider.wallet.publicKey,
      game : game.publicKey,
      winner : player1.publicKey,
      systemProgram : SystemProgram.programId,
    })
    .signers([]).rpc();
    
    const player1BalanceAfter = await provider.connection.getBalance( player1.publicKey );

    const gameListResult = await program.account.gamelist.fetch(gameList.publicKey);
    console.log('game result init', gameListResult);
    expect(gameListResult.games.length).equal(0);

    const gameResult = await program.account.game.fetch(game.publicKey);
    console.log(gameResult);
    console.log('REWARD MULTIPLICATOR', gameResult.rm );

    console.log(player1BalanceBefore, player1BalanceAfter);
    expect(player1BalanceBefore < player1BalanceAfter).equal(true);
    expect(gameResult.authority.toString()).equal(provider.wallet.publicKey.toString());
    expect(parseInt(gameResult.entryPrice.toString())).equal(entryPrice);
    expect(parseInt(gameResult.entryPrice.toString())).equal(entryPrice);


  });



  // it("remove player 2", async () => {

  //   await waitForRpc();

  //   const seed = Buffer.from(anchor.utils.bytes.utf8.encode("treasury"));
  //   let [treasuryPda] = await anchor.web3.PublicKey.findProgramAddress( 
  //     [seed], 
  //     program.programId
  //     );
      
  //   let [gamePda] = await anchor.web3.PublicKey.findProgramAddress( 
  //     [game.publicKey.toBytes()], 
  //     program.programId
  //     );

  //   await program.methods
  //   .removePlayer()
  //   .accounts({

  //       treasury : treasuryPda,

  //       systemProgram : SystemProgram.programId,
  //       player : player2.publicKey,
  //       game : game.publicKey
  //     })
  //     .signers(
  //       [player2]
  //     )
  //     .rpc();
    
  //   const gameResult = await program.account.game.fetch(game.publicKey);
  //   console.log('game result', gameResult );
  //   expect(parseInt(gameResult.rm.toString())).equal(0);
  //   expect(gameResult.authority.toString()).equal(provider.wallet.publicKey.toString());
  //   expect(gameResult.players[1].toString()).equal("11111111111111111111111111111111");

  // });


  // it("add player 3", async () => {

  //   await waitForRpc();

  //   const signatureAirdrop = await provider.connection.requestAirdrop(player3.publicKey, playerBalance) ;
  //   await provider.connection.confirmTransaction(signatureAirdrop) ;

  //   const seed = Buffer.from(anchor.utils.bytes.utf8.encode("treasury"));
  //   let [treasuryPda] = await anchor.web3.PublicKey.findProgramAddress( 
  //     [seed], 
  //     program.programId
  //     );
      
  //   let [gamePda] = await anchor.web3.PublicKey.findProgramAddress( 
  //     [game.publicKey.toBytes()], 
  //     program.programId
  //     );

  //   await program.methods
  //   .addPlayer()
  //   .accounts({

  //       treasury : treasuryPda,
  //       solemInc : solemInc,
  //       gamePda : gamePda,

  //       systemProgram : SystemProgram.programId,
  //       player : player3.publicKey,
  //       game : game.publicKey
  //     })
  //     .signers(
  //       [player3]
  //     )
  //     .rpc();
    
  //   const gameResult = await program.account.game.fetch(game.publicKey);
  //   expect(parseInt(gameResult.rm.toString())).equal(0);
  //   expect(gameResult.authority.toString()).equal(provider.wallet.publicKey.toString());
  //   expect(gameResult.players[1].toString()).equal(player3.publicKey.toString());

  // });

  // it("add player 2", async () => {

  //   await waitForRpc();

  //   const signatureAirdrop = await provider.connection.requestAirdrop(player2.publicKey, playerBalance) ;
  //   await provider.connection.confirmTransaction(signatureAirdrop) ;

  //   const seed = Buffer.from(anchor.utils.bytes.utf8.encode("treasury"));
  //   let [treasuryPda] = await anchor.web3.PublicKey.findProgramAddress( 
  //     [seed], 
  //     program.programId
  //     );
      
  //   let [gamePda] = await anchor.web3.PublicKey.findProgramAddress( 
  //     [game.publicKey.toBytes()], 
  //     program.programId
  //     );

  //   await program.methods
  //   .addPlayer()
  //   .accounts({

  //       treasury : treasuryPda,
  //       solemInc : solemInc,
  //       gamePda : gamePda,

  //       systemProgram : SystemProgram.programId,
  //       player : player2.publicKey,
  //       game : game.publicKey
  //     })
  //     .signers(
  //       [player2]
  //     )
  //     .rpc();
    
  //   const gameResult = await program.account.game.fetch(game.publicKey);
  //   expect(parseInt(gameResult.rm.toString())).equal(0);
  //   expect(gameResult.authority.toString()).equal(provider.wallet.publicKey.toString());
  //   expect(gameResult.players[2].toString()).equal(player2.publicKey.toString());

  // });

});
