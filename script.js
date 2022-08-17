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

// today's pokemon

$.ajax({
    "url": "https://pokeapi.co/api/v2/pokemon/150/",
    "method": "GET",
    "timeout": 0,
}).done(function (pokemon) {
    // console.log(pokemon);
    correctGuess["id"] = pokemon.id;
    correctGuess["name"] = pokemon.species.name;
    correctGuess["pic"] = pokemon.sprites.front_default;
    correctGuess["type1"] = pokemon.types[0].type.name;
    correctGuess["type2"] = pokemon.types.length > 1 ? pokemon.types[1].type.name : "none";
    correctGuess["weight"] = pokemon.weight;

    $.ajax({
        "url": pokemon.species.url,
        "method": "GET",
        "timeout": 0,
    }).done(function (species) {
        // console.log(species);
        correctGuess["isLegendary"] = species.is_legendary;

        $.ajax({
            "url": species.evolution_chain.url,
            "method": "GET",
            "timeout": 0,
        }).done(function (evolves) {
            // console.log(evolves);
            correctGuess["evolves"] = evolves.chain.evolves_to.length > 0 ? true : false;
            console.log(correctGuess);
        });
    });
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

// guess

$("#guess").submit(function (e) {
    const guess = $("input").val().charAt(0).toUpperCase() + $("input").val().slice(1);
    if (pokedex.indexOf(guess) > -1) {
        alert(guess);
        $.ajax({
            "url": "https://pokeapi.co/api/v2/pokemon/" + (pokedex.indexOf(guess) + 1) + "/",
            "method": "GET",
            "timeout": 0,
        }).done(function (response) {
            console.log(response);
            currentGuesses.push(response);
        });
    }

    e.preventDefault();
})