require("dotenv").config();

exports.calcNetAmount = (amount) => {
  const PERCENTAGE_FEE = parseFloat(process.env.PERCENTAGE_FEE);
  const FIXED_FEE = Number(process.env.FIXED_FEE);

  const percentageFee = amount * PERCENTAGE_FEE;
  const totalFee = percentageFee + FIXED_FEE;
  let netAmount = amount - totalFee;

  // if (netAmount > 2500) {
  //   netAmount = 2500;
  // }

  return {
    netAmount: Math.max(0, netAmount),
    totalFee
  };
};
