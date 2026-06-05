
async function check() {
    const res = await fetch("https://finans.truncgil.com/today.json");
    const data = await res.json();
    console.log("USD:", JSON.stringify(data.USD, null, 2));
    console.log("GA:", JSON.stringify(data["gram-altin"], null, 2));
}
check();
