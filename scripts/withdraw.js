const { TransactionResponse } = require("ethers");
const { getNamedAccounts } = require("hardhat");

async function main() {
    const { deployer } = await getNamedAccounts();
    const contracts = await deployments.fixture(["all"]);
    const signer = await ethers.getSigner(deployer);
    const fundMeAddress = contracts["FundMe"].address;
    fundMe = await ethers.getContractAt("FundMe", fundMeAddress, signer);

    console.log("Funding ...")
    const transactionResponse  = await fundMe.withdraw()
    await transactionResponse.wait(1)
    console.log("Got it back")
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
