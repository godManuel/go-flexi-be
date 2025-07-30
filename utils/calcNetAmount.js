exports.calcNetAmount = (amount) => {
  const PERCENTAGE_FEE = parseFloat(process.env.PERCENTAGE_FEE);
  const FIXED_FEE = Number(process.env.FIXED_FEE);

  const percentageFee = amount * PERCENTAGE_FEE;
  let totalFee = percentageFee + FIXED_FEE;

  totalFee = Math.min(2500, totalFee); // Cap totalFee at 2500

  let netAmount = amount - totalFee;
  netAmount = Math.max(0, netAmount); // Ensure netAmount is not negative

  return {
    netAmount,
    totalFee
  };
};
