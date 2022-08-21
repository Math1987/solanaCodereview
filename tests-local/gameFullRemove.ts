import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { Anchor } from "../target/types/anchor";
import { expect } from "chai";
import { waitForRpc } from "./helper" ;
const { SystemProgram } = anchor.web3 ;

const entryPrice = Math.ceil(0.01*anchor.web3.LAMPORTS_PER_SOL) ;


describe("create and start game", () => {

  anchor.setProvider(anchor.AnchorProvider.env());

  const provider = anchor.AnchorProvider.env();

  const game = anchor.web3.Keypair.generate();
  const player1 = anchor.web3.Keypair.generate();
  const player2 = anchor.web3.Keypair.generate();
  const player3 = anchor.web3.Keypair.generate();
  
  
  const playerBalance = anchor.web3.LAMPORTS_PER_SOL*2 ;

  const program = anchor.workspace.Anchor as Program<Anchor>;

  before( async () => {
    // await waitForRpc();
    // const tx = await provider.connection.requestAirdrop(solemInc, anchor.web3.LAMPORTS_PER_SOL );
    // await provider.connection.confirmTransaction(tx, "confirmed");
    // const balance = await provider.connection.getBalance(solemInc);
    // console.log('solem_inc balance', balance) ;
  });

  console.log("game pubkey", game.publicKey.toString() )
  console.log("provider pubkey", provider.wallet.publicKey.toString() );


  it("create", async () => {

    let [gamePda] = await anchor.web3.PublicKey.findProgramAddress( 
      [game.publicKey.toBytes()], 
      program.programId
      );


    await program.methods
    .createGame( new anchor.BN(entryPrice) )
    .accounts({
        gamePda : gamePda,
        authority : provider.wallet.publicKey,
        game : game.publicKey,
        systemProgram : SystemProgram.programId,
      })
    .signers([game]).rpc();
    
    const gameResult = await program.account.game.fetch(game.publicKey);
    expect(parseInt(gameResult.rm.toString())).equal(0);
    expect(gameResult.authority.toString()).equal(provider.wallet.publicKey.toString());
    expect(parseInt(gameResult.entryPrice.toString())).equal(entryPrice);
    expect(parseInt(gameResult.entryPrice.toString())).equal(entryPrice);


  });


  it("add player 1", async () => {

    await waitForRpc();
    const signatureAirdrop = await provider.connection.requestAirdrop(player1.publicKey, playerBalance) ;
    await provider.connection.confirmTransaction(signatureAirdrop) ;

    const solemInc = new anchor.web3.PublicKey("7YW6bHV4RugiazD4XEcFfp54KvgYHYZRzTAKatkQ8NrU") ;
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
        player : player1.publicKey,
        game : game.publicKey
      })
      .signers(
        [player1]
      ).rpc();
    
    const gameResult = await program.account.game.fetch(game.publicKey);

    expect(parseInt(gameResult.rm.toString())).equal(0);
    expect(gameResult.authority.toString()).equal(provider.wallet.publicKey.toString());
    expect(gameResult.players[0].toString()).equal(player1.publicKey.toString());
    expect(parseInt(gameResult.entryPrice.toString())).equal(entryPrice);

  });

  it("add player 2", async () => {

    await waitForRpc();

    const signatureAirdrop = await provider.connection.requestAirdrop(player2.publicKey, playerBalance) ;
    await provider.connection.confirmTransaction(signatureAirdrop) ;

    const solemInc = new anchor.web3.PublicKey("7YW6bHV4RugiazD4XEcFfp54KvgYHYZRzTAKatkQ8NrU") ;
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

  it("add player 3, should set a reward multiplicator", async () => {

    await waitForRpc();

    const signatureAirdrop = await provider.connection.requestAirdrop(player3.publicKey, playerBalance) ;
    await provider.connection.confirmTransaction(signatureAirdrop, "finalized") ;

    const solemInc = new anchor.web3.PublicKey("7YW6bHV4RugiazD4XEcFfp54KvgYHYZRzTAKatkQ8NrU") ;
    const seed = Buffer.from(anchor.utils.bytes.utf8.encode("treasury"));
    let [treasuryPda] = await anchor.web3.PublicKey.findProgramAddress( 
      [seed], 
      program.programId
      );

    let [gamePda] = await anchor.web3.PublicKey.findProgramAddress( 
      [game.publicKey.toBytes()], 
      program.programId
      );

      console.log("game pda", gamePda.toString() );


    const tAirdrop = await provider.connection.requestAirdrop(treasuryPda, playerBalance) ;
    await provider.connection.confirmTransaction(tAirdrop) ;
    console.log("treasury PDA balance", await provider.connection.getBalance(treasuryPda));

    const providerBalance = await provider.connection.getBalance(provider.wallet.publicKey) ;
    await provider.connection.confirmTransaction(tAirdrop) ;
    console.log("provider wallet balance", providerBalance );

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
      ).rpc();
    
    const gameResult = await program.account.game.fetch(game.publicKey);
    expect(parseInt(gameResult.rm.toString()) > 0 ).equal(true);
    expect(gameResult.authority.toString()).equal(provider.wallet.publicKey.toString());
    expect(gameResult.players[2].toString()).equal(player3.publicKey.toString());

  });

  it("remove player 1", async () => {


    await waitForRpc();

    const signatureAirdrop = await provider.connection.requestAirdrop(player2.publicKey, playerBalance) ;
    await provider.connection.confirmTransaction(signatureAirdrop) ;

    const solsBefore = await provider.connection.getBalance(player1.publicKey);

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
    .removePlayer()
    .accounts({

        treasury : treasuryPda,

        systemProgram : SystemProgram.programId,
        player : player1.publicKey,
        game : game.publicKey
      })
      .signers(
        [player1]
      )
      .rpc();
    
    const solsAfter = await provider.connection.getBalance(player1.publicKey);


    const gameResult = await program.account.game.fetch(game.publicKey);

    expect(gameResult.authority.toString()).equal(provider.wallet.publicKey.toString());
    expect(gameResult.players[0].toString() === "11111111111111111111111111111111").equal(false);

  });



});
