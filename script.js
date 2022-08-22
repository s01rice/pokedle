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


// today's pokemon

function getPokemon(num) {

    let poke = {};

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

        $.ajax({
            "url": pokemon.species.url,
            "method": "GET",
            "timeout": 0,
        }).done(function (species) {
            // console.log(species);
            poke["isLegendary"] = species.is_legendary;

            $.ajax({
                "url": species.evolution_chain.url,
                "method": "GET",
                "timeout": 0,
            }).done(function (evolves) {
                console.log(evolves);
                poke["evolves"] = evolves.chain.evolves_to.length > 0 ? true : false;
            });
        });
    });
    return poke;
}

// compare pokemon

function comparePkmn(correctGuess, guess) {

}

// user clicks submit
$("document").ready(function () {

    correctGuess = getPokemon(3);
    console.log(correctGuess);
    var currentGuess;

    $("#guess").submit(function (e) {
        const guess = $("input").val().charAt(0).toUpperCase() + $("input").val().slice(1);
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