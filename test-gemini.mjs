const API_KEY = "AIzaSyDw-RRKx1lfmoCrGgN_pSGe9-NgsKd8Ohg";
const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;


const body = {
    contents: [{ parts: [{ text: 'Say {"ok":true} as JSON only' }] }],
    generationConfig: { responseMimeType: "application/json", temperature: 0 }
};

console.log("Sending request to 2.5-flash...");
const resp = await fetch(URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
});

console.log("HTTP Status:", resp.status);
const json = await resp.json();
if (!resp.ok) {
    console.log("ERROR:", JSON.stringify(json?.error, null, 2));
} else {
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
    console.log("text:", text);
}
