const cluster : "localnet" | "devnet" = "localnet" ;

export const waitForRpc = (duration = 10000) => {
    return new Promise((resolve, reject) => {
        //@ts-ignore
        if ( cluster !== "localnet" ) {
            setTimeout(() =>{
                resolve(true);
            },duration);
        }else{
            resolve(true) ;
        }
    })
}