
const dayTime = document.getElementById("date");
const responseState = document.getElementById("responseState");
const pricesContainer = document.querySelector(".prices");

// URLs des APIs
const SPOT_URL = "https://xaus.com/api/v1/spot?currency=MAD&unit=gram&compact=1";
const GOLD_HISTORY_URL = "https://xaus.com/api/v1/history";
const SILVER_CHART_URL = "https://xaus.com/api/v1/chart?symbol=silver&range=1y&interval=1d";



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

  const previousPoint = points.at(-2).c;
  const latestPoint = points.at(-1).c;

  return ((latestPoint - previousPoint) / previousPoint) * 100;
}

async function getSilverVariationPercent() {
  const response = await fetch(SILVER_CHART_URL);
  if (!response.ok) throw new Error("Erreur historique Argent");

  const data = await response.json();
  const points = data.points;

  const previousPoint = points.at(-2).c;
  const latestPoint = points.at(-1).c;

  return ((latestPoint - previousPoint) / previousPoint) * 100;
}

//f u1-2
async function renderPrices() {
  try {
    responseState.textContent = "";

    
    const response = await fetch(SPOT_URL);
    if (!response.ok) {
      if (response.status === 429) {
        throw new Error("Le quota de requêtes a été dépassé.");
      }
      if (response.status >= 500) {
        throw new Error("Le serveur rencontre un problème. Réessayez plus tard.");
      }
      throw new Error("Erreur lors de la récupération des prix.");
    }

    const spotData = await response.json();

    const updateDate =
      spotData.price_as_of.split("T")[0] +
      " " +
      spotData.price_as_of.split("T")[1].split(".")[0];

    const currentGoldPrice = spotData.xau.price;
    const currentSilverPrice = (spotData.silver_usd_oz * spotData.fx_rate) / 31.1034768;

    const goldPercent = await getGoldVariationPercent();
    const silverPercent = await getSilverVariationPercent();

    const metals = [
      {
        name: "Or · 24 Carats",
        currentPrice: currentGoldPrice,
        diffPercent: goldPercent,
        currency: "MAD / g",
        lastUpdate: updateDate,
      },
      {
        name: "Argent · Pur",
        currentPrice: currentSilverPrice,
        diffPercent: silverPercent,
        currency: "MAD / g",
        lastUpdate: updateDate,
      },
    ];

    pricesContainer.innerHTML = "";

    metals.forEach((metal) => {
      const previousPriceInMAD = metal.currentPrice / (1 + metal.diffPercent / 100);
      const diffValueMAD = metal.currentPrice - previousPriceInMAD;

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
              ${sign}${diffValueMAD.toFixed(2)} MAD (${sign}${metal.diffPercent.toFixed(2)} %)
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


document.addEventListener("DOMContentLoaded", () => {
  todayTime();
  renderPrices();
});