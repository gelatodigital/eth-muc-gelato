import { utils } from 'ethers';

import { task } from 'hardhat/config';
import { join } from 'path';


task('etherscan-verify', 'verify').setAction(async ({}, hre) => {

  await hre.run('verify:verify', {
    address: "0x5B91C8E7a2DEABC623E6Ab34E8c26F27Cc18bC66",
    constructorArguments: ["0xc22b93F15c703D9f6C9A4F0aF1Af237b84F97d88"],
  });
});
