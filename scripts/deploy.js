const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying EightBallPool contract...");

  // Your house wallet address
  const HOUSE_WALLET = "0xd5c1960d24693105659bc740e065c049784639c7";

  const EightBallPool = await ethers.getContractFactory("EightBallPool");
  const eightBallPool = await EightBallPool.deploy();

  await eightBallPool.deployed();

  console.log("EightBallPool deployed to:", eightBallPool.address);
  console.log("House wallet set to:", HOUSE_WALLET);
  console.log("House edge: 10%");
  
  // Verify the house wallet is set correctly
  const houseWallet = await eightBallPool.houseWallet();
  console.log("Confirmed house wallet:", houseWallet);
  
  const houseEdge = await eightBallPool.houseEdge();
  console.log("Confirmed house edge:", Number(houseEdge) / 10, "%");

  console.log("\n🎉 Contract deployment completed!");
  console.log("📝 Contract Address:", eightBallPool.address);
  console.log("💰 House Wallet:", HOUSE_WALLET);
  console.log("💵 House Edge: 10%");
  console.log("\nUpdate your frontend with this contract address!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });