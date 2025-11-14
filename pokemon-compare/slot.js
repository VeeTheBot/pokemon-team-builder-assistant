/*
    Author: Manhattan Calabro

    This file contains a custom element to automatically create one slot that contains a Pokémon's information.

    Note: The document is indented the way that it is to emulate its HTML hierarchy. That way, you don't have to carefully read every line to see what element goes where.
*/

// Custom element of one Pokémon and its stats
class Slot extends HTMLDivElement {
    constructor() { self = super(); }

    connectedCallback() {
        // The slot index
        let index;
        if(this.hasAttribute("index")) {
            index = this.getAttribute("index");
        }

        self.classList.add("slot-box");

            // The Pokémon image
            let sprite = document.createElement("img");
            sprite.classList.add("pokemon-img");
            sprite.id = "img" + index.toString();
            sprite.src = "./no_pokemon.png";
            self.append(sprite);

            // All the information
            let infoBox = document.createElement("div");
            infoBox.classList.add("info-box");
            self.append(infoBox);

                // The input area
                let inputBox = document.createElement("div");
                inputBox.classList.add("input-box");
                infoBox.append(inputBox);

                    // The input box
                    let input = document.createElement("input");
                    input.id = "input" + index.toString();
                    input.type = "text";
                    input.placeholder = "Insert Pokémon here...";
                    inputBox.append(input);

                    // The input button
                    let submitButton = document.createElement("button");
                    submitButton.onclick = function() {populateSlot(index.toString())};
                    submitButton.innerText = "Submit";
                    inputBox.append(submitButton);

                    // Status message
                    let statusMessage = document.createElement("span");
                    statusMessage.id = "status-message";
                    statusMessage.innerText = "";
                    inputBox.append(statusMessage);

                // All the types and stats information
                let typeStatBox = document.createElement("div");
                typeStatBox.classList.add("type-stat-box");
                infoBox.append(typeStatBox);

                    // The stat box
                    let statBox = document.createElement("div");
                    statBox.classList.add("stat-box");
                    typeStatBox.append(statBox);

                        let statTable = document.createElement("table");
                        statBox.append(statTable);

                            for(let z = 1; z <= 6; z++) {
                                let statRow = document.createElement("tr");
                                statTable.append(statRow);

                                let statText = document.createElement("td");
                                // Yes, this is a messy solution, but I don't want to fetch and wait for the API to tell us the 6 stats we know Game Freak's been using for the past couple decades.
                                let str = "";
                                if(z == 1) { str = "HP"; }
                                else if(z == 2) { str = "Atk"; }
                                else if(z == 3) { str = "Def"; }
                                else if(z == 4) { str = "Sp. Atk"; }
                                else if(z == 5) { str = "Sp. Def"; }
                                else { str = "Spd"; }
                                statText.innerText = str;
                                statRow.append(statText);

                                let statValue = document.createElement("td");
                                statValue.id = "stat" + index.toString() + "_" + z;
                                statRow.append(statValue);
                            }

                    // The type box
                    let typeBox = document.createElement("div");
                    typeBox.classList.add("type-box");
                    typeStatBox.append(typeBox);

                        let typeSpan = document.createElement("span");
                        typeSpan.innerText = "Types:";
                        typeBox.append(typeSpan);

                        let typePrimary = document.createElement("img");
                        typePrimary.classList.add("type-img");
                        typePrimary.id = "typePrimary" + index.toString();
                        typeBox.append(typePrimary);

                        let typeSecondary = document.createElement("img");
                        typeSecondary.classList.add("type-img");
                        typeSecondary.id = "typeSecondary" + index.toString();
                        typeBox.append(typeSecondary);

                    // The damage relations
                    let effectiveBox = document.createElement("div");
                    effectiveBox.classList.add("effective-box");
                    typeStatBox.append(effectiveBox);

                        // The weak box
                        let weakBox = document.createElement("div");
                        weakBox.classList.add("weak-box");
                        effectiveBox.append(weakBox);

                            let weakSpan = document.createElement("span");
                            weakSpan.innerText = "Weak to:";
                            weakBox.append(weakSpan);

                            let weakList = document.createElement("div");
                            weakList.id = "weak-list-" + index.toString();
                            weakBox.append(weakList);

                        // The immune box
                        let immuneBox = document.createElement("div");
                        immuneBox.classList.add("immune-box");
                        effectiveBox.append(immuneBox);

                            let immuneSpan = document.createElement("span");
                            immuneSpan.innerText = "Immune to:";
                            immuneBox.append(immuneSpan);

                            let immuneList = document.createElement("div");
                            immuneList.id = "immune-list-" + index.toString();
                            immuneBox.append(immuneList);

                        // The resist box
                        let resistBox = document.createElement("div");
                        resistBox.classList.add("resist-box");
                        effectiveBox.append(resistBox);

                            let resistSpan = document.createElement("span");
                            resistSpan.innerText = "Resistant to:";
                            resistBox.append(resistSpan);

                            let resistList = document.createElement("div");
                            resistList.id = "resist-list-" + index.toString();
                            resistBox.append(resistList);
    }

    // Called each time the element is removed from the document.
    disconnectedCallback() { console.log("Custom element removed from page."); }

    // Called each time the element is moved to a new document.
    adoptedCallback() { console.log("Custom element moved to new page."); }

    // Called when attributes are changed, added, removed, or replaced.
    attributeChangedCallback(name, oldValue, newValue) { console.log(`Attribute ${name} has changed from ${oldValue} to ${newValue}.`); }
}

customElements.define("pokemon-slot", Slot, {extends: "div"});