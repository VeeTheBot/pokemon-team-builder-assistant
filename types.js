/*
    Author: Manhattan Calabro
*/

// Fetch all types' damage relations
let typeDictionary = new Object;

async function populateTypeDictionary() {
    // Fetch all types
    const res = await fetch(`https://pokeapi.co/api/v2/type/`);
    const data = await res.json();

    // Go through all types
    for(let index = 0; index < data["results"].length; index++) {
        let typeName = data["results"][index]["name"];

        // Fetch the type's damage relations
        const dmgRes = await fetch(`https://pokeapi.co/api/v2/type/${typeName}`);
        const dmgData = await dmgRes.json();

        // Fetch the matchups between types that this type is super effective against, not very effective against, and does nothing against
        let matchup = new Object;
        const double_damage_to = dmgData["damage_relations"]["double_damage_to"];
        for(let z = 0; z < double_damage_to.length; z++) {
            matchup[`${double_damage_to[z]["name"]}`] = 2;
        }
        const half_damage_to = dmgData["damage_relations"]["half_damage_to"];
        for(let z = 0; z < half_damage_to.length; z++) {
            matchup[`${half_damage_to[z]["name"]}`] = 0.5;
        }
        const no_damage_to = dmgData["damage_relations"]["no_damage_to"];
        for(let z = 0; z < no_damage_to.length; z++) {
            matchup[`${no_damage_to[z]["name"]}`] = 0;
        }

        // Add the type's matchups to the dictionary
        typeDictionary[`${typeName}`] = matchup;
    }
}

window.onload = populateTypeDictionary;