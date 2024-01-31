import type { NextApiRequest, NextApiResponse } from 'next';
import {ethers} from "ethers";

const abi = [
    "function mint()"
]
const contractAddr = "0x15EBaAD8717A6B71116ffAF1E0FD4A3b4DE0F96C"
const rpcUrl = 'https://base.publicnode.com'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        // Process the vote
        // For example, let's assume you receive an option in the body
        try {
            console.log("req.body", req.body);

            const fid = req.body.untrustedData.fid;
            const addressFromFid = await getAddrByFid(fid);
            console.log(
              "Extracted address from FID: ",
              addressFromFid
            );

            const wallet = new ethers.Wallet(process.env.PRIVATE_KEY || "", new ethers.JsonRpcProvider(rpcUrl));
            const contract = new ethers.Contract(contractAddr, abi, wallet)
              
            // Send the transaction
            const tx = await contract.mint()
            const receipt =  await tx.wait()

            const txStr = JSON.stringify(tx);
            const receiptStr = JSON.stringify(receipt);

            const blockNumber = receipt.blockNumber;

            //TODO get block number
            // console.log("receipt", receipt.blockNumber);

            // Return an HTML response
            res.setHeader('Content-Type', 'text/html');
            res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Vote Recorded</title>
          <meta property="og:title" content="Vote Recorded">
          <meta
            property="og:image"
            content="https://on-chain-cow-farcaster-frame.vercel.app/img/on-chain-cow-happy-cow.png"
          />
          <meta name="fc:frame" content="vNext">
          <meta name="param:tx" content="${txStr}">
          <meta name="param:receipt" content="${receiptStr}">
          <meta name="param:blockNumber" content="${blockNumber}">
          <meta
            property="fc:frame:image"
            content="https://on-chain-cow-farcaster-frame.vercel.app/img/on-chain-cow-happy-cow.png"
          />
        </head>
      </html>
    `);
        } catch (error) {
            console.error(error);
            res.status(500).send('Error generating image');
        }
    } else {
        // Handle any non-POST requests
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

// Based on https://github.com/coinbase/build-onchain-apps/blob/b0afac264799caa2f64d437125940aa674bf20a2/template/app/api/frame/route.ts#L13
async function getAddrByFid(fid: number) {
    console.log("Extracting address for FID: ", fid);
    const options = {
      method: "GET",
      url: `https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}`,
      headers: {
        accept: "application/json",
        api_key: process.env.NEYNAR_API_KEY || "",
      },
    };
    console.log("Fetching user address from Neynar API");
    const resp = await fetch(options.url, { headers: options.headers });
    console.log("Response: ", resp);
    const responseBody = await resp.json(); // Parse the response body as JSON
    if (responseBody.users) {
      const userVerifications = responseBody.users[0];
      if (userVerifications.verifications) {
        console.log(
          "User address from Neynar API: ",
          userVerifications.verifications[0]
        );
        return userVerifications.verifications[0].toString();
      }
    }
    console.log("Could not fetch user address from Neynar API for FID: ", fid);
    return "0x0000000000000000000000000000000000000000";
  }
  