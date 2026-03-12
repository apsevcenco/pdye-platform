let yachts = JSON.parse(localStorage.getItem("yachts")) || [];

document.getElementById("yachts-count").innerText = yachts.length;