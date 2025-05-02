/**
 * 중개수수료 계산 함수
 * @param {string} type - 거래 유형 ("매매" | "전세" | "월세")
 * @param {number} price - 매매가 또는 전세보증금
 * @param {number} [deposit=0] - 월세 보증금
 * @param {number} [monthly=0] - 월세
 * @param {string} [category="주택"] - 주택 또는 비주택
 * @returns {{rate: number, commission: number, message: string | null}} - 수수료율, 수수료 금액, 메시지
 */
export const calculateCommission = (
  type,
  price,
  deposit = 0,
  monthlyFee = 0,
  category = "주택"
) => {
  let rate = 0;
  let max = 0;
  let 기준금액 = price;

  if (type === "월세") {
    const depositInWon = deposit * 10000;
    const monthlyInWon = monthlyFee * 10000;

    const 환산보증금 = depositInWon + monthlyInWon * 70;
    기준금액 =
      환산보증금 <= 50000000 ? 환산보증금 : depositInWon + monthlyInWon * 100;
  }

  if (category === "비주택") {
    rate = 0.009;
    return {
      rate,
      commission: 기준금액 * rate,
      message: "📌 비주택 매물은 최대 0.9% 이내에서 협의 가능합니다.",
    };
  }

  if (type === "매매") {
    if (price < 50000000) rate = 0.005;
    else if (price < 200000000) rate = 0.004;
    else if (price < 600000000) rate = 0.003;
    else if (price < 900000000) rate = 0.005;
    else if (price < 1200000000) rate = 0.004;
    else rate = 0.009;
  } else {
    if (기준금액 < 50000000) rate = 0.005;
    else if (기준금액 < 100000000) rate = 0.004;
    else if (기준금액 < 300000000) rate = 0.003;
    else if (기준금액 < 600000000) rate = 0.004;
    else if (기준금액 < 1200000000) rate = 0.005;
    else rate = 0.008;
  }

  max = 기준금액 * rate;

  return {
    rate,
    commission: Math.min(max, 기준금액 * rate),
    message: null,
  };
};
