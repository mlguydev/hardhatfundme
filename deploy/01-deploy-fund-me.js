const { network } = require("hardhat");
const { networkConfig, developmentChains } = require("../helper-hardhat-config")

module.exports = async({ getNamedAccounts, deployments }) => {
	const { deploy, log } = deployments;
	const { deployer } = await getNamedAccounts();
	const { verify } = require("../utils/verify");
	const chainId = network.config.chainId;
	let ethUsdPriceFeedAddress;
	
	if(developmentChains.includes(network.name)) {
		const ethUsdAggregator = await deployments.get("MockV3Aggregator");
		ethUsdPriceFeedAddress = ethUsdAggregator.address;
	} else {
		ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"];
	}

	const fundMe = await deploy("FundMe", {
		from: deployer,
		args: [ethUsdPriceFeedAddress], // priceFeed address
		log: true,
		waitConfirmations : network.config.blockConfirmations || 1,
	});
	
	console.log("FundMe contract deployed.")

	if (!developmentChains.includes(network.name) && [process.env.ETHERSCAN_API_KEY]) {
		await verify(fundMe.address, [ethUsdPriceFeedAddress]); 
		log("FundMe contract verified with etherscan.")
	}
	log("----------------------------------------------------");
}
module.exports.tags = ["all", "fundme"];