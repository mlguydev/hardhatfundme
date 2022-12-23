const { deployments, ethers, getNamedAccounts } = require("hardhat");
const { assert, expect } = require("chai");
const { developmentChains } = require("../../helper-hardhat-config");

!developmentChains.includes(network.name) ? describe.skip :
describe("FundMe", function () {
	let fundMe;
	let deployer;
	let MockV3Aggregator;
	//const sendValue = "10000000" // 1 ETH
	const sendValue= ethers.utils.parseEther("0.00054"); // Also 1 ETH

	beforeEach(async function() {
		deployer =  (await getNamedAccounts()).deployer;
		await deployments.fixture(["all"]);
		fundMe = await ethers.getContract("FundMe", deployer);
		MockV3Aggregator = await ethers.getContract("MockV3Aggregator", deployer);
	});

	describe("constructor", function () {
		it("sets the aggregator addresses correctly", async function () {
			const response = await fundMe.getPriceFeed();
			assert.equal(response, MockV3Aggregator.address);
		});
	});

	describe("fund", function () {
		it("fails if you don't send enough ETH", async function () {
			await expect(fundMe.fund()).to.be.revertedWith("You need to spend more ETH!");
		});
		it("updates the amount funded data structure", async function () {
			await fundMe.fund({value: sendValue})
			const response = await fundMe.getAddressToAmountFunded(deployer);
			assert.equal(response.toString(), sendValue);
		});
		it("adds funder to array of getFunders()", async function () {
			await fundMe.fund({value: sendValue});
			const funder = await fundMe.getFunders(0);
			assert.equal(funder, deployer);
		});
	});
	

	describe("withdraw", function () {
		beforeEach(async function () {
			await fundMe.fund({value: sendValue});
		});
		it("withdraw ETH from a single founder", async function () {
			const startFundMeBalance = await fundMe.provider.getBalance(fundMe.address);
			const startDeployerBalance = await fundMe.provider.getBalance(deployer);
			const transactionResponse = await fundMe.withdraw();
			const transactionReceipt = await transactionResponse.wait(1)
			const { gasUsed, effectiveGasPrice } = transactionReceipt;
			const gasCost = gasUsed.mul(effectiveGasPrice);
			const endFundMeBalance = await fundMe.provider.getBalance(fundMe.address);
			const endDeployerBalance = await fundMe.provider.getBalance(deployer);
			assert.equal(endFundMeBalance, 0);
			assert.equal(
				startFundMeBalance.add(startDeployerBalance).toString(), 
				endDeployerBalance.add(gasCost).toString()
			);
		});
		it("allows us to withdraw with multiple getFunders()", async function () {
			const accounts = await ethers.getSigners();
			for (let i = 1; i < 6; i++) {
				const fundMeConnectedContract = await fundMe.connect(accounts[i]);
				await fundMeConnectedContract.fund({value: sendValue});
			}
			const startFundMeBalance = await fundMe.provider.getBalance(fundMe.address);
			const startDeployerBalance = await fundMe.provider.getBalance(deployer);
			const transactionResponse = await fundMe.withdraw();
			const transactionReceipt = await transactionResponse.wait(1)
			const { gasUsed, effectiveGasPrice } = transactionReceipt;
			const gasCost = gasUsed.mul(effectiveGasPrice);
			const endFundMeBalance = await fundMe.provider.getBalance(fundMe.address);
			const endDeployerBalance = await fundMe.provider.getBalance(deployer);
			assert.equal(endFundMeBalance, 0);
			assert.equal(
				startFundMeBalance.add(startDeployerBalance).toString(), 
				endDeployerBalance.add(gasCost).toString()
			);
			await expect(fundMe.getFunders(0)).to.be.reverted
			for (i =1; i < 6; i++) {
				assert.equal(await fundMe.getAddressToAmountFunded(accounts[i].address), 0);
			}
		})
		it("only allows the owner to withdraw", async function () {
			const accounts = await ethers.getSigners();
			const attacker = accounts[1];
			const attackerConnectedContract = await fundMe.connect(attacker);
			await expect(attackerConnectedContract.withdraw()).to.be.revertedWithCustomError(
				attackerConnectedContract, "FundMe__NotOwner"
			);
		});
	});

	describe("cheaperWithdraw testing", async function () {
		beforeEach(async function () {
			await fundMe.fund({value: sendValue});
		});

		it("withdraw ETH from a single founder", async function () {
			const startFundMeBalance = await fundMe.provider.getBalance(fundMe.address);
			const startDeployerBalance = await fundMe.provider.getBalance(deployer);
			const transactionResponse = await fundMe.cheaperWithdraw();
			const transactionReceipt = await transactionResponse.wait(1)
			const { gasUsed, effectiveGasPrice } = transactionReceipt;
			const gasCost = gasUsed.mul(effectiveGasPrice);
			const endFundMeBalance = await fundMe.provider.getBalance(fundMe.address);
			const endDeployerBalance = await fundMe.provider.getBalance(deployer);
			assert.equal(endFundMeBalance, 0);
			assert.equal(
				startFundMeBalance.add(startDeployerBalance).toString(), 
				endDeployerBalance.add(gasCost).toString()
			);
		});
		it("allows us to cheaperWithdraw with multiple getFunders()", async function () {
			const accounts = await ethers.getSigners();
			for (let i = 1; i < 6; i++) {
				const fundMeConnectedContract = await fundMe.connect(accounts[i]);
				await fundMeConnectedContract.fund({value: sendValue});
			}
			const startFundMeBalance = await fundMe.provider.getBalance(fundMe.address);
			const startDeployerBalance = await fundMe.provider.getBalance(deployer);
			const transactionResponse = await fundMe.cheaperWithdraw();
			const transactionReceipt = await transactionResponse.wait(1)
			const { gasUsed, effectiveGasPrice } = transactionReceipt;
			const gasCost = gasUsed.mul(effectiveGasPrice);
			const endFundMeBalance = await fundMe.provider.getBalance(fundMe.address);
			const endDeployerBalance = await fundMe.provider.getBalance(deployer);
			assert.equal(endFundMeBalance, 0);
			assert.equal(
				startFundMeBalance.add(startDeployerBalance).toString(), 
				endDeployerBalance.add(gasCost).toString()
			);
			await expect(fundMe.getFunders(0)).to.be.reverted
			for (i =1; i < 6; i++) {
				assert.equal(await fundMe.getAddressToAmountFunded(accounts[i].address), 0);
			}
		})
		it("only allows the owner to cheaperWithdraw", async function () {
			const accounts = await ethers.getSigners();
			const attacker = accounts[1];
			const attackerConnectedContract = await fundMe.connect(attacker);
			await expect(attackerConnectedContract.cheaperWithdraw()).to.be.revertedWithCustomError(
				attackerConnectedContract, "FundMe__NotOwner"
			);
		});
	});


});
