const dayTime = document.getElementById("date");

const responseState = document.getElementById("responseState");
const PannelResponse = document.getElementById("responsePannel");
const goldTimeUpdate = document.getElementById("last-update");
const selverTimeUpdate = document.getElementById("last-update-arg");
const goldPrice = document.getElementById("goldPrice");
const argentPrice = document.getElementById("argentPrice");

const variationGold = document.getElementById("variation-value-gold");
const goldIconVariation = document.getElementById("variation-icon-gold");

const variationArg = document.getElementById("variation-value-argent");
const iconVariationArg = document.getElementById("variation-icon-argent");

const history_Url = "https://xaus.com/api/v1/history";

function todayTime() {
  const date = new Date();
  dayTime.textContent = date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

async function getData() {
  try {
    const response = await fetch(
      "https://xaus.com/api/v1/spot?currency=MAD&unit=gram&compact=1",
    );
    if (!response.ok) {
      throw new Error("Failed to fetch data from the API");
    }
    const oz = 31.1;
    const data = await response.json();
    const fxRate = data.fx_rate;
    // console.log(fxRate)
    let updateDate =
      data.price_as_of.split("T")[0] +
      " " +
      data.price_as_of.split("T")[1].split(".")[0];
    goldTimeUpdate.textContent = updateDate;
    selverTimeUpdate.textContent = updateDate;

    const priceGold = data.xau.price;
    goldPrice.textContent = priceGold.toFixed(2);

    const selverPrices = (data.silver_usd_oz * data.fx_rate) / 31.1034768;
    argentPrice.textContent = selverPrices.toFixed(2);
    responseState.textContent = "";
  } catch (error) {
    // console.error("Error:", error.message);
    responseState.textContent =
      "Unable to retrieve prices. Please try / refrech again later.";
  }
}

async function goldLastDayPrice(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("faild to fetch from the API");
    }
    const data = await response.json();
    const points = data.points;

    const today = new Date().toISOString().split("T")[0];
    const yasterdayData = points.filter((point) => point.d < today).at(-1);

    if (!yasterdayData) {
      throw new Error("non jour precident valable ");
    }
    const goldYasterdayPrice = yasterdayData.c;

    const todayData = points.find((date) => date.d == today);
    const goldTodayPrice = todayData.c;

    return {
      goldTodayPrice: goldTodayPrice,
      goldYasterdayPrice: goldYasterdayPrice,
    };
  } catch (error) {
    return {
      success: false,
      price: null,
      error: error.message,
    };
  }
}

async function argLastDayPrice() {
  try {
    const response = await fetch(
      "https://xaus.com/api/v1/chart?symbol=silver&range=1y&interval=1d",
    );
    if (!response.ok) {
      throw new Error("fiald to fetch from hte api");
    }
    const data = await response.json();
    const points = data.points;

    if (!points || points.length < 2) {
      throw new Error("non jour precident valable");
    }

    const argTodayPrice = points.at(-1).c;
    const argYasterDayPrice = points.at(-2).c;

    return {
      argTodayPrice: argTodayPrice,
      argYasterDayPrice: argYasterDayPrice,
    };
  } catch (error) {
    return {
      success: false,
      price: null,
      error: error.message,
    };
  }
}

async function calculeVariation(url) {
  const { goldTodayPrice, goldYasterdayPrice } = await goldLastDayPrice(url);
  const {argTodayPrice, argYasterDayPrice} = await argLastDayPrice()
  
  const goldVariation = (
    ((goldTodayPrice - goldYasterdayPrice) / goldYasterdayPrice) *
    100
  ).toFixed(2);
  const argVariation = (
    ((argTodayPrice - argYasterDayPrice) / argYasterDayPrice) * 100
  ).toFixed(2)

  if (goldVariation > 0) {
    variationGold.textContent = "+" + goldVariation + " %";
    variationGold.classList.add("positive");
    variationGold.classList.remove("negative");

    goldIconVariation.classList.add("positive");
    goldIconVariation.classList.remove("negative");
    goldIconVariation.textContent = "↑";
  } else {
    variationGold.textContent = goldVariation + " %";
    variationGold.classList.add("negative");
    variationGold.classList.remove("positive");

    goldIconVariation.classList.add("negative");
    goldIconVariation.classList.remove("positive");
    goldIconVariation.textContent = "↓";
  }

  if (argVariation > 0) {
    variationArg.textContent = "+" + argVariation + " %";
    variationArg.classList.add("positive");
    variationArg.classList.remove("negative");

    iconVariationArg.classList.add("positive");
    iconVariationArg.classList.remove("negative");
    iconVariationArg.textContent = "↑";
  } else {
    variationArg.textContent = argVariation + " %";
    variationArg.classList.add("negative");
    variationArg.classList.remove("positive");

    iconVariationArg.classList.add("negative");
    iconVariationArg.classList.remove("positive");
    iconVariationArg.textContent = "↓";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  getData();
});

todayTime();
argLastDayPrice();
calculeVariation(history_Url);
