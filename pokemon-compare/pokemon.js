/*
    Author: Manhattan Calabro
*/

// Fetch the Pokémon when the name is submitted
async function populateSlot(index) {
    // The user's input
    let input = document.getElementById("input" + index.toString()).value;



    // Fetch and wait for data
    updateStatus("Loading...");
    let url = "https://pokeapi.co/api/v2/pokemon/" + input;
    let res = await fetch(url);



    //#region Invalid Pokémon
    // If an invalid Pokémon name is entered; display an error
    if(res["status"] != 200) {
        // Make error message visible
        updateStatus("Invalid Pokémon!", "red");

        // "Invalid Pokémon" image
        updateSprite(index, "./invalid_pokemon.png");

        // No stats
        for(let z = 0; z < 6; z++) {
            updateStat(index, z+1, "");
        }

        // No types
        updateType(index, "");
        updateType(index, "", false);

        // No damage relations
        clearElementChildren(document.getElementById("weak-list-" + index.toString()));
        clearElementChildren(document.getElementById("immune-list-" + index.toString()));
        clearElementChildren(document.getElementById("resist-list-" + index.toString()));

        return;
    }
    //#endregion



    // Get the Pokémon from the API
    let pokemon = await res.json();



    //#region Replace the Pokémon's image
    updateSprite(index, pokemon["sprites"]["front_default"]);
    //#endregion



    //#region Replace the Pokémon's base stats
    let stats = pokemon["stats"];

    for(let z = 0; z < stats.length; z++) {
        let statVal = stats[z]["base_stat"];

        updateStat(index, z+1, statVal);
    }
    //#endregion



    //#region Replace the Pokémon's type images
    let types = pokemon["types"];

    url = "https://pokeapi.co/api/v2/type/" + types[0]["type"]["name"];
    res = await fetch(url);
    let typePrimary = await res.json();
    let typeSecondary;

    updateType(index, typePrimary["sprites"]["generation-viii"]["sword-shield"]["name_icon"]);

    // If there is more than one type, add it
    if(types.length > 1) {
        // Get the second type
        url = "https://pokeapi.co/api/v2/type/" + types[1]["type"]["name"];
        res = await fetch(url);
        typeSecondary = await res.json();

        updateType(index, typeSecondary["sprites"]["generation-viii"]["sword-shield"]["name_icon"], false);
    }
    // Otherwise, hide the second type
    else {
        updateType(index, "", false);
    }
    //#endregion



    //#region Replace the Pokémon's damage relations (defensive only)
    let damageRelations = new Map();

    // Add immunities
    let subMap = new Map();
    let tempTypeArray = typePrimary["damage_relations"]["no_damage_from"];
    for(let z = 0; z < tempTypeArray.length; z++) {
        // Add the type to the immunities if it's not in the map yet
        if(!subMap.has(tempTypeArray[z]["name"])) {
            subMap.set(tempTypeArray[z]["name"], tempTypeArray[z]["url"]);
        }
    }
    if(typeSecondary != null) {
        tempTypeArray = typeSecondary["damage_relations"]["no_damage_from"];
        for(let z = 0; z < tempTypeArray.length; z++) {
            // Add the type to the immunities if it's not in the map yet
            if(!subMap.has(tempTypeArray[z]["name"])) {
                subMap.set(tempTypeArray[z]["name"], tempTypeArray[z]["url"]);
            }
        }
    }
    damageRelations.set("immune", subMap);

    // Add weaknesses
    subMap = new Map();
    tempTypeArray = typePrimary["damage_relations"]["double_damage_from"];
    for(let z = 0; z < tempTypeArray.length; z++) {
        // Add the type to the weaknesses if it's not immune and it's not in the map yet
        if(!damageRelations.get("immune").has(tempTypeArray[z]["name"]) && !subMap.has(tempTypeArray[z]["name"])) {
            subMap.set(tempTypeArray[z]["name"], tempTypeArray[z]["url"]);
        }
    }
    if(typeSecondary != null) {
        tempTypeArray = typeSecondary["damage_relations"]["double_damage_from"];
        for(let z = 0; z < tempTypeArray.length; z++) {
            // Add the type to the weaknesses if it's not immune and it's not in the map yet
            if(!damageRelations.get("immune").has(tempTypeArray[z]["name"]) && !subMap.has(tempTypeArray[z]["name"])) {
                subMap.set(tempTypeArray[z]["name"], tempTypeArray[z]["url"]);
            }
        }
    }
    damageRelations.set("weak", subMap);

    // Add resistances
    subMap = new Map();
    tempTypeArray = typePrimary["damage_relations"]["half_damage_from"];
    for(let z = 0; z < tempTypeArray.length; z++) {
        // If the type is both a weakness and a resistance, delete it from the weaknesses
        if(damageRelations.get("weak").has(tempTypeArray[z]["name"])) {
            damageRelations.get("weak").delete(tempTypeArray[z]["name"]);
        }
        // Otherwise, add the type to the resistances if it's not immune and it's not in the map yet
        else if(!damageRelations.get("immune").has(tempTypeArray[z]["name"]) && !subMap.has(tempTypeArray[z]["name"])) {
            subMap.set(tempTypeArray[z]["name"], tempTypeArray[z]["url"]);
        }
    }
    if(typeSecondary != null) {
        tempTypeArray = typeSecondary["damage_relations"]["half_damage_from"];
        for(let z = 0; z < tempTypeArray.length; z++) {
            // If the type is both a weakness and a resistance, delete it from the weaknesses
            if(damageRelations.get("weak").has(tempTypeArray[z]["name"])) {
                damageRelations.get("weak").delete(tempTypeArray[z]["name"]);
            }
            // Otherwise, add the type to the resistances if it's not immune and it's not in the map yet
            else if(!damageRelations.get("immune").has(tempTypeArray[z]["name"]) && !subMap.has(tempTypeArray[z]["name"])) {
                subMap.set(tempTypeArray[z]["name"], tempTypeArray[z]["url"]);
            }
        }
    }
    damageRelations.set("resist", subMap);

    // Display the damage relations
    for(let [key, map] of damageRelations) {
        let list = document.getElementById(key + "-list-" + index.toString());

        // Clear out the previous damage relation lists
        clearElementChildren(list);

        // Populate the damage relation lists
        for(let [typeName, typeValue] of map) {
            let element = document.createElement("img");

            url = "https://pokeapi.co/api/v2/type/" + typeName;
            res = await fetch(url);
            let typeImg = await res.json();

            element.src = typeImg["sprites"]["generation-viii"]["sword-shield"]["name_icon"];

            element.classList.add("type-img");
            element.alt = typeName;

            list.append(element);
        }
    }
    //#endregion



    // Done loading; hide loading message
    updateStatus("");
}



//#region Update functions

// Update the status message
function updateStatus(message, color="black") {
    let statusMessage = document.getElementById("status-message");
    
    // Change the message
    statusMessage.innerText = message;

    // Update the colour
    statusMessage.style = "color: " + color.toString();
}

/*
    Update the Pokémon image

    index: The index of the Pokémon slot to access
    sprite: The new image
*/
function updateSprite(index, sprite) {
    document.getElementById("img" + index.toString()).src = sprite;
}

/*
    Updates one of the stats

    slotIndex: The index of the Pokémon slot to access
    statIndex: Which stat to update
    value: A String representing the new stat value
*/
function updateStat(slotIndex, statIndex, value) {
    document.getElementById("stat" + slotIndex.toString() + "_" + statIndex.toString()).innerText = value.toString();
}

/*
    Updates one of the types

    index: The index of the Pokémon slot to access
    type: The url to the type image
    primary: Determines if this function updates the primary typing or the secondary typing
*/
function updateType(index, type, primary=true) {
    if(primary) {
        document.getElementById("typePrimary" + index.toString()).src = type;
    }
    else {
        document.getElementById("typeSecondary" + index.toString()).src = type;
    }
}

// Clears the given element of its children
function clearElementChildren(element) {
    while(element.firstChild) {
        element.firstChild.remove();
    }
}

//#endregion