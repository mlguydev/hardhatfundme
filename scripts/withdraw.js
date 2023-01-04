const { getNamedAccounts, ethers } = require("hardhat");

async function main () {
	let fundMe, deployer;
	deployer = (await getNamedAccounts()).deployer;
	console.log(deployer)
	fundMe = await ethers.getContract("FundMe", deployer);
	// const { deployer } = await getNamedAccounts();
	// const deployer2 = (await getNamedAccounts()).deployer;
	// console.log(`Deployer: ${deployer}`)
	// const fundMe = await ethers.getContract("FundMe", deployer2);
	console.log("Withdrawing...");
	const transactionResponse = await fundMe.withdraw();
	await transactionResponse.wait(1);
	console.log("Got it back!")

}

main () 
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	})