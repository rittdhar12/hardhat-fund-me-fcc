const { deployments, ethers, getNamedAccounts } = require("hardhat");
const { assert, expect } = require("chai");
const { developmentChains } = require("../../helper-hardhat-config");

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", async function () {
          let fundMe;
          let deployer;
          let mockV3Aggregator;
          const sendValue = ethers.parseEther("1"); // 1 ETH
          beforeEach(async () => {
              // deploy our fundMe contract using hardhat-deploy
              deployer = (await getNamedAccounts()).deployer;
              const contracts = await deployments.fixture(["all"]);
              const signer = await ethers.getSigner(deployer);
              const fundMeAddress = contracts["FundMe"].address;
              fundMe = await ethers.getContractAt(
                  "FundMe",
                  fundMeAddress,
                  signer
              );
              mockV3Aggregator = contracts["MockV3Aggregator"];
          });

          describe("constructor", async function () {
              it("sets the aggregator addresses correctly", async function () {
                  const response = await fundMe.getPriceFeed();
                  assert.equal(response, await mockV3Aggregator.address);
              });
          });

          describe("Fund", async function () {
              it("Fails if you dont send enough ETH", async function () {
                  // use Chai expect
                  await expect(fundMe.fund()).to.be.revertedWith(
                      "You need to spend more ETH!"
                  );
              });

              it("Updates the amount funded data structure", async function () {
                  await fundMe.fund({ value: sendValue });
                  const response = await fundMe.getAddressToAmountFunded(
                      deployer
                  );
                  assert.equal(response.toString(), sendValue.toString());
              });

              it("Adds funder to array of getFunder", async function () {
                  await fundMe.fund({ value: sendValue });
                  const funder = await fundMe.getFunder(0);
                  assert.equal(funder, deployer);
              });
          });

          describe("Withdaw", async function () {
              beforeEach(async function () {
                  await fundMe.fund({ value: sendValue });
              });

              it("Withdraw ETH from a single funder", async function () {
                  //Arrange
                  const startingFundMeBalance =
                      await ethers.provider.getBalance(fundMe.target);
                  const startingDeployerBalance =
                      await ethers.provider.getBalance(deployer);
                  //Act
                  const transactionResponse = await fundMe.withdraw();
                  const transactionReciept = await transactionResponse.wait(1);

                  const { gasUsed, gasPrice } = transactionReciept;
                  const gasCost = gasUsed * gasPrice;

                  const endingFundMeBalance = await ethers.provider.getBalance(
                      fundMe.target
                  );
                  const endingDeployerBalance =
                      await ethers.provider.getBalance(deployer);
                  //Assert

                  assert.equal(endingFundMeBalance, 0);
                  //Need to also calculate the gas cost as well
                  assert.equal(
                      (
                          startingFundMeBalance + startingDeployerBalance
                      ).toString(),
                      (endingDeployerBalance + gasCost).toString()
                  );
              });

              it("allows us to withdraw with multiple getFunder", async function () {
                  const accounts = await ethers.getSigners();

                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      );
                      await fundMeConnectedContract.fund({ value: sendValue });
                  }

                  const startingFundMeBalance =
                      await ethers.provider.getBalance(fundMe.target);
                  const startingDeployerBalance =
                      await ethers.provider.getBalance(deployer);

                  //Act
                  const transactionResponse = await fundMe.withdraw();
                  const transactionReciept = await transactionResponse.wait(1);

                  const { gasUsed, gasPrice } = transactionReciept;
                  const gasCost = gasUsed * gasPrice;

                  const endingFundMeBalance = await ethers.provider.getBalance(
                      fundMe.target
                  );
                  const endingDeployerBalance =
                      await ethers.provider.getBalance(deployer);

                  //Assert

                  assert.equal(endingFundMeBalance, 0);
                  //Need to also calculate the gas cost as well
                  assert.equal(
                      (
                          startingFundMeBalance + startingDeployerBalance
                      ).toString(),
                      (endingDeployerBalance + gasCost).toString()
                  );

                  await expect(fundMe.getFunder(0)).to.be.reverted;

                  for (i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address
                          ),
                          0
                      );
                  }
              });

              it("Only allows the owner to withdraw", async function () {
                  const accounts = await ethers.getSigners();
                  const attackerConnectedContract = await fundMe.connect(
                      accounts[1]
                  );
                  await expect(
                      attackerConnectedContract.withdraw()
                  ).to.be.revertedWithCustomError(fundMe, "FundMe__NotOwner");
              });

              it("Cheaper withdraw testing...", async function () {
                  const accounts = await ethers.getSigners();

                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      );
                      await fundMeConnectedContract.fund({ value: sendValue });
                  }

                  const startingFundMeBalance =
                      await ethers.provider.getBalance(fundMe.target);
                  const startingDeployerBalance =
                      await ethers.provider.getBalance(deployer);

                  //Act
                  const transactionResponse = await fundMe.cheaperWithdraw();
                  const transactionReciept = await transactionResponse.wait(1);

                  const { gasUsed, gasPrice } = transactionReciept;
                  const gasCost = gasUsed * gasPrice;

                  const endingFundMeBalance = await ethers.provider.getBalance(
                      fundMe.target
                  );
                  const endingDeployerBalance =
                      await ethers.provider.getBalance(deployer);

                  //Assert

                  assert.equal(endingFundMeBalance, 0);
                  //Need to also calculate the gas cost as well
                  assert.equal(
                      (
                          startingFundMeBalance + startingDeployerBalance
                      ).toString(),
                      (endingDeployerBalance + gasCost).toString()
                  );

                  await expect(fundMe.getFunder(0)).to.be.reverted;

                  for (i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address
                          ),
                          0
                      );
                  }
              });
          });
      });
