import { PasskeyServer } from "passkey-kit";
import { env } from "~/env";
import { Account, Keypair, StrKey } from "@stellar/stellar-sdk/minimal"
import { basicNodeSigner } from "@stellar/stellar-sdk/minimal/contract";
import { Server } from "@stellar/stellar-sdk/minimal/rpc";


export const rpc = new Server(env.NEXT_PUBLIC_RPC_URL);

export const mockPubkey = StrKey.encodeEd25519PublicKey(Buffer.alloc(32))
export const mockSource = new Account(mockPubkey, '0')

export const fundKeypair = new Promise<Keypair>(async (resolve) => {
    const now = new Date();

    now.setMinutes(0, 0, 0);

    const nowData = new TextEncoder().encode(now.getTime().toString());
    const hashBuffer = await crypto.subtle.digest('SHA-256', nowData);
    const keypair = Keypair.fromRawEd25519Seed(Buffer.from(hashBuffer))
    const publicKey = keypair.publicKey()

    rpc.getAccount(publicKey)
        .catch(() => rpc.requestAirdrop(publicKey))
        .catch(() => { })

    resolve(keypair)
})
export const fundPubkey = (await fundKeypair).publicKey()
export const fundSigner = basicNodeSigner(await fundKeypair, env.NEXT_PUBLIC_NETWORK_PASSPHRASE)




// export const rpc = new Server(env.RPC_URL);
// export const mockPubkey = StrKey.encodeEd25519PublicKey(Buffer.alloc(32))
// export const mockSource = new Account(mockPubkey, '0')

// export const fundKeypair = new Promise<Keypair>(async (resolve) => {
//   const now = new Date();

//   now.setMinutes(0, 0, 0);

//   const nowData = new TextEncoder().encode(now.getTime().toString());
//   const hashBuffer = await crypto.subtle.digest('SHA-256', nowData);
//   const keypair = Keypair.fromRawEd25519Seed(Buffer.from(hashBuffer))
//   const publicKey = keypair.publicKey()

//   rpc.getAccount(publicKey)
//       .catch(() => rpc.requestAirdrop(publicKey))
//       .catch(() => { })

//   resolve(keypair)
// })

// export const ser = new PasskeyServer({
//   rpcUrl: env.RPC_URL,
//   launchtubeUrl: env.LAUNCHTUBE_URL,
//   launchtubeJwt: env.LAUNCHETUBE_JWT,
//   mercuryUrl: env.MERCURYT_URL,
//   mercuryJwt: env.MERCURY_JWT,
// });

export const account = new PasskeyServer({
  rpcUrl: env.RPC_URL,
  launchtubeUrl: env.LAUNCHTUBE_URL,
  launchtubeJwt: env.LAUNCHETUBE_JWT,
  // mercuryProjectName: import.meta.env.VITE_mercuryProjectName,
  mercuryUrl: env.MERCURYT_URL,
  mercuryJwt: env.MERCURY_JWT,
});