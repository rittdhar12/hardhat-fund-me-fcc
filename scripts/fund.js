const { getNamedAccounts } = require("hardhat");

async function main() {
    const { deployer } = await getNamedAccounts();

    
    const contracts = await deployments.fixture(["all"]);
    const signer = await ethers.getSigner(deployer);
    const fundMeAddress = contracts["FundMe"].address;
    fundMe = await ethers.getContractAt("FundMe", fundMeAddress, signer);

    const transactionResponse = await fundMe.fund({
        value: ethers.parseEther("0.1"), // 1 ETH
    })
    await transactionResponse.wait(1)
    console.log("Funded")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
