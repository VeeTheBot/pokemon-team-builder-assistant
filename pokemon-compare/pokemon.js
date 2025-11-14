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

    let temp = typePrimary["damage_relations"]["double_damage_from"];
    let weakArray = new Array();
    for(let z = 0; z < temp.length; z++) {
        let weakMap = {"name" : temp[z]["name"], "url" : temp[z]["url"]};
        weakArray.push(weakMap);
    }
    console.log(weakArray);

    console.log(weakArray.includes({"ground" : "https://pokeapi.co/api/v2/type/5/"}));

    damageRelations.set("weak", typePrimary["damage_relations"]["double_damage_from"].concat(typeSecondary["damage_relations"]["double_damage_from"]));
    damageRelations.set("immune", typePrimary["damage_relations"]["no_damage_from"].concat(typeSecondary["damage_relations"]["no_damage_from"]));
    damageRelations.set("resist", typePrimary["damage_relations"]["half_damage_from"].concat(typeSecondary["damage_relations"]["half_damage_from"]));

    // Possibly rebuild the map to make searching and comparison easier? We could make functions to handle them, but having separate functions will make the time complexity slower, since each will most like run through an array in a for loop at least once.

    // If there are any types in the immunity section, remove them from the weakness section and the resistance section.
    for(let i = 0; i < damageRelations.get("immune").length; i++) {
        let immunity = damageRelations.get("immune")[i];

        for(let w = 0; w < damageRelations.get("weak").length; w++) {
            if(damageRelations.get("weak")[w]["name"] == immunity["name"]) {
                damageRelations.get("weak").splice(w, 1);
                w--;
            }
        }

        for(let r = 0; r < damageRelations.get("resist").length; r++) {
            if(damageRelations.get("resist")[r]["name"] == immunity["name"]) {
                damageRelations.get("resist").splice(r, 1);
                r--;
            }
        }
    }

    // If there are any types shared between the weakness section and resistance section, remove that type from both sections.
    //

    // If there are any repeats in the weakness section, remove all but one instance.
    //

    // If there are any repeats in the resistance section, remove all but one instance.
    //

    for(let [key, value] of damageRelations) {
        let list = document.getElementById(key + "-list-" + index.toString());

        // Clear out the previous damage relation lists
        clearElementChildren(list);

        // Populate the damage relation lists
        for(let z = 0; z < value.length; z++) {
            let element = document.createElement("img");

            url = "https://pokeapi.co/api/v2/type/" + value[z]["name"];
            res = await fetch(url);
            let typeImg = await res.json();

            element.src = typeImg["sprites"]["generation-viii"]["sword-shield"]["name_icon"];

            element.classList.add("type-img");
            element.alt = value[z]["name"];

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