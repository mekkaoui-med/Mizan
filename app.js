
const dayTime = document.getElementById("date");
const responseState = document.getElementById("responseState");
const pricesContainer = document.querySelector(".prices");
const currencySelect = document.getElementById("currency-select");

//us5
const weightInput = document.getElementById("input-gold-argent");
const metalSelect = document.getElementById("select-metal");
const weightError = document.getElementById("weight-error");
const estimateResult = document.getElementById("estimate-result");
const estimateCurrency = document.getElementById("estimate-currency");

const GOLD_HISTORY_URL = "https://xaus.com/api/v1/history";
const SILVER_CHART_URL = "https://xaus.com/api/v1/chart?symbol=silver&range=1y&interval=1d";

let latestPrices = {
  gold: 0,
  argent: 0,
  currency: "MAD",
};


function calculateEstimate(weight, pricePerGram) {
  return weight * pricePerGram;
}



function todayTime() {
  const date = new Date();
  dayTime.textContent = date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

async function getGoldVariationPercent() {
  const response = await fetch(GOLD_HISTORY_URL);
  if (!response.ok) throw new Error("Erreur historique Or");
  const data = await response.json();
  const points = data.points;
  return ((points.at(-1).c - points.at(-2).c) / points.at(-2).c) * 100;
}

async function getSilverVariationPercent() {
  const response = await fetch(SILVER_CHART_URL);
  if (!response.ok) throw new Error("Erreur historique Argent");
  const data = await response.json();
  const points = data.points;
  return ((points.at(-1).c - points.at(-2).c) / points.at(-2).c) * 100;
}


function updateEstimate() {
  const rawValue = weightInput.value.trim();
  const selectedMetal = metalSelect.value;
  const currentPricePerGram = latestPrices[selectedMetal];

  estimateCurrency.textContent = latestPrices.currency;

  if (rawValue === "") {
    weightError.textContent = "Veuillez saisir un poids.";
    estimateResult.textContent = "--";
    return;
  }

  const weight = Number(rawValue);

  if (isNaN(weight) || weight <= 0) {
    weightError.textContent = "Veuillez saisir un poids valide et supérieur à 0.";
    estimateResult.textContent = "--";
    return;
  }

  weightError.textContent = "";

  if (currentPricePerGram === 0) {
    estimateResult.textContent = "Chargement...";
    return;
  }

  const total = calculateEstimate(weight, currentPricePerGram);
  estimateResult.textContent = total.toFixed(2);
}


async function renderPrices() {
  try {
    responseState.textContent = "";

    const currentCurrency = currencySelect.value;
    const spotUrl = `https://xaus.com/api/v1/spot?currency=${currentCurrency}&unit=gram&compact=1`;

    const response = await fetch(spotUrl);
    if (!response.ok) {
      if (response.status === 429) throw new Error("Le quota de requêtes a été dépassé.");
      if (response.status >= 500) throw new Error("Le serveur rencontre un problème.");
      throw new Error("Erreur lors de la récupération des prix.");
    }

    const spotData = await response.json();

    const updateDate =
      spotData.price_as_of.split("T")[0] +
      " " +
      spotData.price_as_of.split("T")[1].split(".")[0];

    const currentGoldPrice = spotData.xau.price;
    const fxRate = spotData.fx_rate || 1;
    const currentSilverPrice = (spotData.silver_usd_oz * fxRate) / 31.1034768;

    latestPrices.gold = currentGoldPrice;
    latestPrices.argent = currentSilverPrice;
    latestPrices.currency = currentCurrency;

    updateEstimate();

    const goldPercent = await getGoldVariationPercent();
    const silverPercent = await getSilverVariationPercent();

    const metals = [
      {
        name: "Or · 24 Carats",
        currentPrice: currentGoldPrice,
        diffPercent: goldPercent,
        currency: `${currentCurrency} / g`,
        lastUpdate: updateDate,
      },
      {
        name: "Argent · Pur",
        currentPrice: currentSilverPrice,
        diffPercent: silverPercent,
        currency: `${currentCurrency} / g`,
        lastUpdate: updateDate,
      },
    ];

    pricesContainer.innerHTML = "";

    metals.forEach((metal) => {
      const previousPrice = metal.currentPrice / (1 + metal.diffPercent / 100);
      const diffValue = metal.currentPrice - previousPrice;

      const isPositive = metal.diffPercent >= 0;
      const arrow = isPositive ? "↑" : "↓";
      const statusClass = isPositive ? "positive" : "negative";
      const sign = isPositive ? "+" : "";

      const cardHTML = `
        <article class="price-card">
          <div class="metal-name">${metal.name}</div>
          <div class="price">
            <span>${metal.currentPrice.toFixed(2)}</span>
            <span>${metal.currency}</span>
          </div>
          <div class="goldVariation">
            <span class="${statusClass}">${arrow}</span>
            <span class="${statusClass}">
              ${sign}${diffValue.toFixed(2)} ${currentCurrency} (${sign}${metal.diffPercent.toFixed(2)} %)
            </span>
            par rapport à hier
          </div>
          <div class="update">
            <p>Dernière mise à jour : <span>${metal.lastUpdate}</span></p>
          </div>
        </article>
      `;

      pricesContainer.innerHTML += cardHTML;
    });

  } catch (error) {
    responseState.textContent = error.message;
  }
}



weightInput.addEventListener("input", updateEstimate);
metalSelect.addEventListener("change", updateEstimate);

currencySelect.addEventListener("change", () => {
  localStorage.setItem("selectedCurrency", currencySelect.value);
  renderPrices();
});

document.addEventListener("DOMContentLoaded", () => {
  todayTime();

  const savedCurrency = localStorage.getItem("selectedCurrency") || "MAD";
  currencySelect.value = savedCurrency;

  renderPrices();
});