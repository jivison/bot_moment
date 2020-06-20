export function calculatePercent(
  number1: number | string,
  number2: number | string,
  precision: number = 1
): string {
  return parseFloat(
    (
      ((typeof number1 === "number" ? number1 : Number(number1)) /
        (typeof number2 === "number" ? number2 : Number(number2))) *
      100
    ).toFixed(precision)
  ).toLocaleString();
}