const { assert } = require("chai");
const { getNamedAccounts, ethers, network } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");

developmentChains.includes(network.name) ? describe.skip :
describe("FundMe", async function () {

	let fundMe, deployer;
	const sendValue = ethers.utils.parseEther("0.1");

	beforeEach(async function () {
		deployer = (await getNamedAccounts()).deployer;
		console.log(deployer)
		fundMe = await ethers.getContract("FundMe", deployer);
	});

	it("allows people to fund and withdraw", async function () {
		const fundTx = await fundMe.fund({value: sendValue});
		console.log("Funded and waiting");
		fundTx.wait(1);
		const withdrawTx = await fundMe.withdraw();
		console.log("Withdrawn and waiting")
		withdrawTx.wait(1);
		console.log("Checking balance");
		const endingFundMeBalance = await fundMe.provider.getBalance(fundMe.address);
		assert(endingFundMeBalance.toString(), "0");
	});
});