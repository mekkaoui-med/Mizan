const button = document.getElementById("get-price");
const result = document.getElementById("result");

button.addEventListener("click", async () => {

    const response = await fetch(
        "https://api.goldprice.dev/v1/prices?symbol=XAU-USD-SPOT"
    );

    const data = await response.json();

    console.log(data);

});