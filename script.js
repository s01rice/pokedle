let currentGuesses = [];
var pokedex = [];
var correctGuess = {};
var currentGuess = {};

// capitalize first letter for fomatting

function capitalize(word) {
    //    return word.charAt(0).toUpperCase() + word.slice(1);
    return word.split('-').map((x) => x.charAt(0).toUpperCase() + x.slice(1)).join(' ');
}

// fill pokedex with all 905 pokemon

$.ajax({
    "url": "https://pokeapi.co/api/v2/pokemon-species/?limit=905",
    "method": "GET",
    "timeout": 0,
}).done(function (response) {
    // console.log(response);
    response.results.forEach(function (a) {
        pokedex.push(capitalize(a.name));
    })
});


// autocomplete for guess box, shows the first 5 results

$(function () {
    $("#pokemon").autocomplete({
        source: function (request, response) {
            var results = $.ui.autocomplete.filter(pokedex, request.term).slice(0, 5);
            response(results);
        }
    })
});


// evolution format data functions from Oxleberry (https://codepen.io/oxleberry/pen/dyYLyVW)
// takes multi-level evolution structure from PokeAPI and converts it to a single-level data structure

const getImageId = (urlStr) => {
    let regex = /[^v]\d/;
    let searchIdx = urlStr.search(regex)
    let evoId = urlStr.slice(searchIdx + 1, -1);
    return evoId;
}

function setEvo(data) {
    let trackingApiData = [data.chain];
    let evoId = getImageId(data.chain.species.url);
    let evoChainFormattedData = [{
        id: evoId,
        name: data.chain.species.name,
    }];

    let maxEvo = 2;
    for (var i = 0; i < maxEvo; i++) {

        if (trackingApiData[i].evolves_to.length > 1) {

            let multiEvoPath = [];
            trackingApiData[i].evolves_to.forEach((pokemon) => {
                trackingApiData.push(pokemon);
                evoId = getImageId(pokemon.species.url);
                multiEvoPath.push({
                    id: evoId,
                    name: pokemon.species.name,
                });
            });
            evoChainFormattedData.push(multiEvoPath);

        } else {
            if (trackingApiData[i].evolves_to.length) {
                let nextEvoData = trackingApiData[i].evolves_to[0];
                trackingApiData.push(nextEvoData);
                evoId = getImageId(nextEvoData.species.url);
                evoChainFormattedData.push({
                    id: evoId,
                    name: nextEvoData.species.name,
                });
            } else {
                i = maxEvo;
            }
        }
    }
    return evoChainFormattedData;
}

// Finds if pokemon has a next evolution from the formatted evolution data

function hasNextEvolution(pokemonName, evoChainArr) {
    for (var i = 0; i < evoChainArr.length; i++) {
        if (evoChainArr[i].name === pokemonName) {

            // if next element is a multi-evolution then this pokemon can evolve 
            if (Array.isArray(evoChainArr[i + 1])) {
                return "Yes";
            } else {
                // false = single-path evolution

                // checks if pokemon is at end of the evolution chain
                // if true, pokemon can no longer evolve - return false
                return (i == evoChainArr.length - 1) ? "No" : "Yes";
            }
        }
    }
    // if pokemon cannot be found then it is in a nested array and therefore a final evolution that cannot evolve
    return "Yes";
}

// Get pokemon info via number


function getPokemon(num) {

    let poke = {};


    // initial API call for generic pokemon info

    $.ajax({
        "url": "https://pokeapi.co/api/v2/pokemon/" + num + "/",
        "async": false,
        "method": "GET",
        "timeout": 0,
    }).done(function (pokemon) {

        // console.log(pokemon);
        poke["id"] = pokemon.id;
        poke["name"] = pokemon.species.name;
        poke["pic"] = pokemon.sprites.front_default;
        poke["types"] = pokemon.types.map((type) => capitalize(type.type.name));
        poke["type"] = pokemon.types.map((type) => capitalize(type.type.name)).join(",<br/>");
        // poke["type2"] = pokemon.types.length > 1 ? pokemon.types[1].type.name : "none";
        poke["abilities"] = pokemon.abilities.map((ability) => capitalize(ability.ability.name));
        poke["ability"] = pokemon.abilities.map((ability) => capitalize(ability.ability.name)).join(",<br/>");
        poke["weight"] = pokemon.weight;

        // second API call for more specific info

        $.ajax({
            "url": pokemon.species.url,
            "async": false,
            "method": "GET",
            "timeout": 0,
        }).done(function (species) {

            // console.log(species);
            poke["eggGroups"] = species.egg_groups.map((group) => capitalize(group.name));
            poke["eggGroup"] = species.egg_groups.map((group) => capitalize(group.name)).join(",<br/>");
            // poke["isLegendary"] = species.is_legendary;

            // last API call for evolution tree

            $.ajax({
                "url": species.evolution_chain.url,
                "async": false,
                "method": "GET",
                "timeout": 0,
            }).done(function (evolves) {
                // console.log(evolves);
                let evoFind = setEvo(evolves);
                poke["evolves"] = hasNextEvolution(poke["name"], evoFind);
            });
        });
    });
    return poke;

}

// compare pokemon

function comparePkmn() {
    let format = {};
    // ID, type, ability, eggs, evolves, weight
    console.log(currentGuess);
    // console.log(correctGuess);

    // id and weight comparison
    format["id"] = currentGuess.id === correctGuess.id ? "green none" : "red " + (currentGuess.id < correctGuess.id ? "up" : "down");
    format["weight"] = currentGuess.weight === correctGuess.weight ? "green none" : "red " + (currentGuess.weight < correctGuess.weight ? "up" : "down");

    format["evolves"] = currentGuess.evolves === correctGuess.evolves ? "green" : "red";

    // type, ability, eggs comparison use the same logic as they are all arrays

    // if same length
    if (currentGuess.types.length == correctGuess.types.length) {
        let counter = 0;
        currentGuess.types.forEach(type => {
            if (correctGuess.types.includes(type)) ++counter;
        })
        format["types"] = counter === correctGuess.types.length ? "green" : counter > 0 ? "yellow" : "red";
    } else {
        // different length, only possible yellow/red
        let counter = 0;
        currentGuess.types.forEach(type => {
            if (correctGuess.types.includes(type)) ++counter;
        })
        format["types"] = counter > 0 ? "yellow" : "red";
    }


    if (currentGuess.abilities.length == correctGuess.abilities.length) {
        let counter = 0;
        currentGuess.abilities.forEach(ability => {
            if (correctGuess.abilities.includes(ability)) ++counter;
        })
        format["abilities"] = counter === correctGuess.abilities.length ? "green" : counter > 0 ? "yellow" : "red";
    } else {
        // different length, only possible yellow/red
        let counter = 0;
        currentGuess.abilities.forEach(ability => {
            if (correctGuess.abilities.includes(ability)) ++counter;
        })
        format["abilities"] = counter > 0 ? "yellow" : "red";
    }


    if (currentGuess.eggGroups.length == correctGuess.eggGroups.length) {
        let counter = 0;
        currentGuess.eggGroups.forEach(eggGroup => {
            if (correctGuess.eggGroups.includes(eggGroup)) ++counter;
        })
        format["eggGroups"] = counter === correctGuess.eggGroups.length ? "green" : counter > 0 ? "yellow" : "red";
    } else {
        // different length, only possible yellow/red
        let counter = 0;
        currentGuess.eggGroups.forEach(eggGroup => {
            if (correctGuess.eggGroups.includes(eggGroup)) ++counter;
        })
        format["eggGroups"] = counter > 0 ? "yellow" : "red";
    }

    let html = '<div class="cell pic ' + currentGuess.types[0] + '"><img src=' + currentGuess.pic + '></div>' +
        '<div class="cell ' + format.id + '">' + currentGuess.id + '</div>' +
        '<div class="cell ' + format.types + '">' + currentGuess.type + '</div>' +
        '<div class="cell ' + format.abilities + '">' + currentGuess.ability + '</div>' +
        '<div class="cell ' + format.eggGroups + '">' + currentGuess.eggGroup + '</div>' +
        '<div class="cell ' + format.weight + '">' + parseFloat(currentGuess.weight / 10).toFixed(1) + ' kg</div>' +
        '<div class="cell ' + format.evolves + '">' + currentGuess.evolves + '</div>';
    return html;
}

let head = '<div class="cell title">Pokemon</div>' +
    '<div class="cell title">Number</div>' +
    '<div class="cell title">Types</div>' +
    '<div class="cell title">Abilities</div>' +
    '<div class="cell title">Egg Group</div>' +
    '<div class="cell title">Weight</div>' +
    '<div class="cell title">Evolves?</div>';

// user clicks submit
$("document").ready(function () {

    console.log(Math.seedrandom(new Date().toJSON().slice(0, 10)));
    let x = (Math.floor(Math.random() * 905));
    correctGuess = getPokemon(x);

    $("#guess").submit(function (e) {
        let guess = capitalize($("input").val());
        if (pokedex.indexOf(guess) > -1) {
            // console.log(guess);
            currentGuess = getPokemon(pokedex.indexOf(guess) + 1);
            let t = comparePkmn();
            if (currentGuesses.length == 0) {
                currentGuesses.push(t);
                $("#guess-list").append('<li class="grid-container">' + head + "</li>");
            }
            $("#guess-list").append('<li class="grid-container">' + t + "</li>");
        }
        e.preventDefault();
        $("#guess")[0].reset();

        if (currentGuess.id == correctGuess.id) {
            console.log("Success!");
            $("#pokemon").prop("disabled", true);
            $("#button").prop("disabled", true);
            $(".guesses").append('<h1>Success!</h1><h2>Come back again tomorrow!</h2>');
        }
    })
})