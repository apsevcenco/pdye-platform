// загрузка текстов из админки

let heroTitle = localStorage.getItem("heroTitle")
let heroSubtitle = localStorage.getItem("heroSubtitle")

if(heroTitle){
document.getElementById("hero-title").innerText = heroTitle
}

if(heroSubtitle){
document.getElementById("hero-subtitle").innerText = heroSubtitle
}


// загрузка яхт из админки

let yachts = JSON.parse(localStorage.getItem("yachts")) || []

let grid = document.getElementById("yacht-grid")

yachts.forEach(yacht => {

let card = document.createElement("div")

card.className="yacht"

card.innerHTML = `
<img src="${yacht.image}">
<h3>${yacht.name}</h3>
<p>Market price: ${yacht.market}</p>
<p class="deal">Distressed: ${yacht.price}</p>
`

grid.appendChild(card)

})