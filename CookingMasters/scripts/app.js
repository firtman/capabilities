import Router from './Router.js';
import { Cooking } from './Cooking.js';
import { Capabilities } from './Capabilities.js';
import { lessBrightness, moreBrightness, turnOff, turnOn } from './BTLights.js';

window.app = {}
app.router = Router;
app.cooking = Cooking;
app.recipes = [];
app.capabilities = Capabilities;

window.addEventListener("DOMContentLoaded", () => {
    app.router.init();
    app.cooking.init(document.querySelector("#cooking"));
    loadRecipes();    
});

export async function alertTimerFinished(timer) {
    console.log(`Timer finished: ${timer.name}`);

    const gamepads = await navigator.getGamepads();
    if (gamepads[0]!=null) {
        gamepads[0].vibrationActuator.playEffect("dual-rumble", {
            startDelay: 0,
            duration: 1200,
            weakMagnitude: 1.0,
            strongMagnitude: 1.0,
          });
    }
    if (app.capabilities.bluetoothConnected) {
        setTimeout(moreBrightness, 0);
        setTimeout(turnOff, 300);
        setTimeout(turnOn, 600);
        setTimeout(lessBrightness, 1000);
        setTimeout(moreBrightness, 1200);
        setTimeout(lessBrightness, 1500);
    }
}


function beep() {
    function onebeep() {
        const context = new AudioContext();
        let shortoscillator = context.createOscillator();
        shortoscillator.connect(context.destination);
        shortoscillator.type = 'square';
        shortoscillator.frequency.value = 500;
        shortoscillator.start(context.currentTime);
        shortoscillator.stop(context.currentTime + 0.05);    
    }
    onebeep();
    setTimeout(() => {
        onebeep()    
    }, 100)
}
app.beep = beep;

async function loadRecipes() {
    const response = await fetch("/data/recipes.json");
    app.recipes = await response.json();
    renderRecipes();
}

function renderRecipes() {
    renderRecipe(document.querySelector("#recipe-week"), app.recipes[0], "large");
    renderRecipe(document.querySelector("#recipe-most"), app.recipes[1], "large");
    const theRest = app.recipes.slice(2);
    document.querySelector("#all ul").innerHTML = "";
    theRest.forEach(r => {
        const li = document.createElement("li");
        document.querySelector("#all ul").appendChild(li);
        renderRecipe(li, r, "small");
    })
}

function renderRecipe(element, recipe, className) {
    element.innerHTML = `
        <a href="javascript:app.router.go('/recipe/${recipe.slug}')" class="${className} recipe">
            <img src="images/original/${recipe.image}">
            <h4>${recipe.name}</h4>
            <p class="metadata">${recipe.type} | ${Object.keys(recipe.ingredients).length} ingredients | ${recipe.duration} min</p>
        </a>
    `
}

export async function renderRecipeDetails(id) {
    if (app.recipes.length==0) {
        await loadRecipes();
    }    
    const recipe = app.recipes.filter(r=>r.slug==id)[0];
    document.querySelector("#recipe h2").textContent = recipe.name;
    document.querySelector("#recipe img").src = 
        `/images/original/${recipe.image}`;
    document.querySelector("#recipe .metadata").textContent = 
        `${Object.keys(recipe.ingredients).length} ingredients |
         ${recipe.duration} minutes | ${recipe.type}`;
    document.querySelector("#recipe .description").textContent = recipe.description;
    
    const list = document.querySelector("#recipe dl");
    list.innerHTML = "";
    for (let ingredient in recipe.ingredients) {
        list.innerHTML += `
            <dt>${ingredient}</dt><dd>${recipe.ingredients[ingredient]}</dd>
        `
    }
    document.querySelector("#recipe button").onclick = () => {
        app.cooking.start(recipe);
    }

}