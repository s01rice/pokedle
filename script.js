let currentGuesses = [];
var pokedex = [];
var correctGuess = {};

// fill pokedex

$.ajax({
    "url": "https://pokeapi.co/api/v2/pokemon-species/?limit=905",
    "method": "GET",
    "timeout": 0,
}).done(function (response) {
    console.log(response);
    response.results.forEach(function (a) {
        pokedex.push(a.name.charAt(0).toUpperCase() + a.name.slice(1));
    })
});


// autocomplete for guess box

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
                return true;
            } else {
                // false = single-path evolution

                // checks if pokemon is at end of the evolution chain
                // if true, pokemon can no longer evolve - return false
                return (i == evoChainArr.length - 1) ? false : true;
            }
        }
    }
    // if pokemon cannot be found then it is in a nested array and therefore a final evolution that cannot evolve
    return false;
}

// Get pokemon info via number

function getPokemon(num) {

    let poke = {};

    //initial API call for generic pokemon info

    $.ajax({
        "url": "https://pokeapi.co/api/v2/pokemon/" + num + "/",
        "method": "GET",
        "timeout": 0,
    }).done(function (pokemon) {
        console.log(pokemon);
        poke["id"] = pokemon.id;
        poke["name"] = pokemon.species.name;
        poke["pic"] = pokemon.sprites.front_default;
        poke["types"] = pokemon.types.map((type) => type.type.name);
        poke["type"] = pokemon.types.map((type) => type.type.name).join(", ");
        // poke["type2"] = pokemon.types.length > 1 ? pokemon.types[1].type.name : "none";
        poke["abilities"] = pokemon.abilities.map((ability) => ability.ability.name);
        poke["ability"] = pokemon.abilities.map((ability) => ability.ability.name).join(", ");
        poke["weight"] = pokemon.weight;

        // second API call for more specific info

        $.ajax({
            "url": pokemon.species.url,
            "method": "GET",
            "timeout": 0,
        }).done(function (species) {
            console.log(species);
            poke["eggGroups"] = species.egg_groups.map((group) => group.name);
            poke["eggGroup"] = species.egg_groups.map((group) => group.name).join(", ");
            poke["isLegendary"] = species.is_legendary;

            // last API call for evolution tree

            $.ajax({
                "url": species.evolution_chain.url,
                "method": "GET",
                "timeout": 0,
            }).done(function (evolves) {
                // console.log(evolves);
                let evoFind = setEvo(evolves);
                poke["evolves"] = hasNextEvolution(poke["name"], evoFind)
            });
        });
    });
    return poke;
}

function capitalize(word) {
    return word.charAt(0).toUpperCase() + word.slice(1);
}

// compare pokemon

function comparePkmn(correctGuess, guess) {
    let format = {};
}

// user clicks submit
$("document").ready(function () {

    correctGuess = getPokemon(150);
    console.log(correctGuess);
    var currentGuess;

    $("#guess").submit(function (e) {
        // const guess = $("input").val().charAt(0).toUpperCase() + $("input").val().slice(1);
        const guess = capitalize($("input").val());
        if (pokedex.indexOf(guess) > -1) {
            console.log(guess);
            currentGuess = getPokemon(pokedex.indexOf(guess) + 1);
            console.log(currentGuess);
            // comparePkmn(correctGuess, currentGuess);
            $("#guess-list").append("<li>a</li>");
        }

        e.preventDefault();
    })
})