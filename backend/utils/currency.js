import axios from "axios";

let cache = { rates: null, fetchedAt: 0 };

export async function getRates(base = "USD") {
  const now = Date.now();
  if (
    cache.rates &&
    now - cache.fetchedAt < 60 * 60 * 1000 &&
    cache.base === base
  ) {
    return cache.rates;
  }
  const url = `https://api.exchangerate-api.com/v4/latest/${base}`;
  const { data } = await axios.get(url);
  cache = { rates: data.rates, fetchedAt: now, base };
  return data.rates;
}

export async function convert(amount, from, to) {
  if (from === to) return amount;
  const rates = await getRates(from);
  const rate = rates[to];
  if (!rate) throw new Error("Unsupported target currency");
  return amount * rate;
}
