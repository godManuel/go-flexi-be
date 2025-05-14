exports.calcNetAmount = (amount) => {
  const percentageFee = amount * PERCENTAGE_FEE;
  const totalFee = percentageFee + FIXED_FEE;
  const netAmount = amount - totalFee;
  return {
    netAmount: Math.max(0, netAmount), // Ensure no negative credits
    totalFee: totalFee,
  };
};
