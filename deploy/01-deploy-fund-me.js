//import
//main function --> No
//calling of main function --> No
// hardhat deploy will auto deploy the function we have here

// function deployFunc(){
//     console.log("hi");
// }

// module.exports.default = deployFunc
const {
    networkConfig,
    developmentChains,
} = require("../helper-hardhat-config");
const { network } = require("hardhat");
const { verify } = require("../utils/verify");

module.exports = async (hre) => {
    const { getNamedAccounts, deployments } = hre;
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    const chainId = network.config.chainId;

    //Logic: If chainId is X use address Y for all networks

    // const ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]

    let ethUsdPriceFeedAddress;

    if (developmentChains.includes(network.name)) {
        const ethUsdAggregator = await deployments.get("MockV3Aggregator");
        ethUsdPriceFeedAddress = ethUsdAggregator.address;
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"];
    }

    //if the contract doesnt exist we deploy a minimial version for local testing

    //When going for localhost of harhat network we want to use a mock
    log("----------------------------------------------------");

    log("Deploying FundMe and waiting for confirmations...");

    //const args = [ethUsdPriceFeedAddress];

    const fundMe = await deploy("FundMe", {
        from: deployer,
        args: [ethUsdPriceFeedAddress], // put pricefeed address here
        logs: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    });
    log(`FundMe deployed at ${fundMe.address}`);

    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        await verify(fundMe.address, [ethUsdPriceFeedAddress]);
    }
    log("------------------------------------------------");
};

module.exports.tags = ["all", "fundme"];
// async default function but map these to hre
// module.exports = async ({ getNamedAccounts, deployments }) => {};
