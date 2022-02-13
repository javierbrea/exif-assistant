function percentage(value, perc) {
  return (perc * value) / 100;
}

function isApproximatelyEqual(value, valueToCompare, tolerancePercentage = 0.3) {
  const valueToCompareTolerance = percentage(valueToCompare, tolerancePercentage);
  const valueToComparePlusTolerance = valueToCompare + valueToCompareTolerance;
  const valueToCompareMinusTolerance = valueToCompare - valueToCompareTolerance;
  return value >= valueToCompareMinusTolerance && value <= valueToComparePlusTolerance;
}

module.exports = {
  isApproximatelyEqual,
};
