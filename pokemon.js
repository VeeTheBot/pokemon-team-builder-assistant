/*
    Authors: Zhengyao Huang, Manhattan Calabro
*/

/*
const typeChart = {
    normal: { rock: 0.5, ghost: 0, steel: 0.5 },
    fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
    water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
    electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
    grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
    ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
    fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
    poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
    ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
    flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
    psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
    bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
    rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
    ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
    dragon: { dragon: 2, steel: 0.5, fairy: 0 },
    dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
    steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
    fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 }
};
*/

let slots = [{ id: 1, pokemon: null }];
let nextId = 2;
// Note, this restricts how many Pokemon the user may add; not how many Pokemon are in their final team after calculations
const maxTeamSize = 5;

// Calculate defensive matchup
function calculateDefensiveMatchup(types) {
    const matchup = {};
    
    Object.keys(typeDictionary).forEach(attackType => {
        let multiplier = 1;
        
        types.forEach(defenseType => {
            const effectiveness = typeDictionary[attackType][defenseType.type.name];
            if (effectiveness !== undefined) {
                multiplier *= effectiveness;
            }
        });
        
        if (multiplier !== 1) {
            matchup[attackType] = multiplier;
        }
    });
    
    return matchup;
}

// Get matchups by multiplier
function getMatchupsByMultiplier(matchup, targetMult) {
    return Object.entries(matchup)
        .filter(([_, mult]) => {
            if (targetMult === 0) return mult === 0;
            if (targetMult === 4) return mult >= 4;
            if (targetMult === 2) return mult >= 2 && mult < 4;
            if (targetMult === 0.5) return mult <= 0.5 && mult > 0.25;
            if (targetMult === 0.25) return mult <= 0.25 && mult > 0;
            return false;
        })
        .map(([type]) => type);
}

// Fetch Pokemon
async function fetchPokemon(slotId) {
    const input = document.getElementById(`input-${slotId}`);
    const name = input.value.trim().toLowerCase();
    
    if (!name) return;

    const container = document.getElementById(`slot-${slotId}`);
    const imgContainer = container.querySelector('.pokemon-img-container');
    const infoBox = container.querySelector('.pokemon-info');
    
    // Show loading
    imgContainer.innerHTML = '<div class="loading-spinner"></div>';
    infoBox.innerHTML = '';

    try {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`);
        
        if (!res.ok) {
            throw new Error('Pokémon not found');
        }

        const data = await res.json();
        
        const pokemon = {
            name: data.name,
            sprite: data.sprites.front_default,
            types: data.types,
            stats: data.stats,
            baseStatTotal: data.stats.reduce((sum, stat) => sum + stat.base_stat, 0),
            matchup: calculateDefensiveMatchup(data.types)
        };

        // Update slot
        const slot = slots.find(s => s.id === slotId);
        if (slot) slot.pokemon = pokemon;

        displayPokemon(slotId, pokemon);
        updateTeamAnalysis();
        
    } catch (err) {
        imgContainer.innerHTML = '<div style="color: #ef4444; font-size: 3em;">❌</div>';
        infoBox.innerHTML = `<div class="error-message">${err.message}</div>`;
        
        const slot = slots.find(s => s.id === slotId);
        if (slot) slot.pokemon = null;
        updateTeamAnalysis();
    }
}

// Display Pokemon
function displayPokemon(slotId, pokemon) {
    const container = document.getElementById(`slot-${slotId}`);
    const imgContainer = container.querySelector('.pokemon-img-container');
    const infoBox = container.querySelector('.pokemon-info');

    imgContainer.innerHTML = `<img class="pokemon-img" src="${pokemon.sprite}" alt="${pokemon.name}">`;

    const statNames = ['HP', 'Attack', 'Defense', 'Sp. Atk', 'Sp. Def', 'Speed'];
    
    let statsHTML = '<div class="stats-section"><h3>Stats</h3>';
    pokemon.stats.forEach((stat, i) => {
        const percentage = (stat.base_stat / 255) * 100;
        statsHTML += `
            <div class="stat-item">
                <div class="stat-label">
                    <span>${statNames[i]}</span>
                    <span class="stat-value">${stat.base_stat}</span>
                </div>
                <div class="stat-bar-container">
                    <div class="stat-bar" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
    });
    statsHTML += `<div class="bst">BST: ${pokemon.baseStatTotal}</div></div>`;

    let typesHTML = '<div class="types-section"><h3>Types & Matchups</h3><div class="types-container">';
    pokemon.types.forEach(t => {
        typesHTML += `<span class="type-icon type-${t.type.name}">${t.type.name}</span>`;
    });
    typesHTML += '</div><div class="matchups">';

    // Add matchups
    const weak4x = getMatchupsByMultiplier(pokemon.matchup, 4);
    const weak2x = getMatchupsByMultiplier(pokemon.matchup, 2);
    const resist2x = getMatchupsByMultiplier(pokemon.matchup, 0.5);
    const resist4x = getMatchupsByMultiplier(pokemon.matchup, 0.25);
    const immune = getMatchupsByMultiplier(pokemon.matchup, 0);

    if (weak4x.length > 0) {
        typesHTML += '<div class="matchup-group"><div class="matchup-label weak">4× Weak:</div><div class="matchup-types">';
        weak4x.forEach(type => typesHTML += `<span class="matchup-type type-${type}">${type}</span>`);
        typesHTML += '</div></div>';
    }

    if (weak2x.length > 0) {
        typesHTML += '<div class="matchup-group"><div class="matchup-label weak">2× Weak:</div><div class="matchup-types">';
        weak2x.forEach(type => typesHTML += `<span class="matchup-type type-${type}">${type}</span>`);
        typesHTML += '</div></div>';
    }

    if (resist2x.length > 0) {
        typesHTML += '<div class="matchup-group"><div class="matchup-label resist">½× Resist:</div><div class="matchup-types">';
        resist2x.forEach(type => typesHTML += `<span class="matchup-type type-${type}">${type}</span>`);
        typesHTML += '</div></div>';
    }

    if (resist4x.length > 0) {
        typesHTML += '<div class="matchup-group"><div class="matchup-label resist">¼× Resist:</div><div class="matchup-types">';
        resist4x.forEach(type => typesHTML += `<span class="matchup-type type-${type}">${type}</span>`);
        typesHTML += '</div></div>';
    }

    if (immune.length > 0) {
        typesHTML += '<div class="matchup-group"><div class="matchup-label immune">Immune:</div><div class="matchup-types">';
        immune.forEach(type => typesHTML += `<span class="matchup-type type-${type}">${type}</span>`);
        typesHTML += '</div></div>';
    }

    typesHTML += '</div></div>';

    infoBox.innerHTML = `
        <div class="pokemon-name">${pokemon.name}</div>
        <div class="pokemon-details">
            ${statsHTML}
            ${typesHTML}
        </div>
    `;
}

// Update team analysis
function updateTeamAnalysis() {
    const validPokemon = slots.filter(s => s.pokemon).map(s => s.pokemon);
    
    if (validPokemon.length === 0) {
        document.getElementById('team-analysis').classList.remove('active');
        return;
    }

    const teamWeaknesses = {};
    const teamResistances = {};
    const teamImmunities = {};

    validPokemon.forEach(pokemon => {
        Object.entries(pokemon.matchup).forEach(([type, mult]) => {
            if (mult >= 2) {
                teamWeaknesses[type] = (teamWeaknesses[type] || 0) + 1;
            } else if (mult === 0) {
                teamImmunities[type] = (teamImmunities[type] || 0) + 1;
            } else if (mult <= 0.5) {
                teamResistances[type] = (teamResistances[type] || 0) + 1;
            }
        });
    });

    displayTeamAnalysis('team-weaknesses', teamWeaknesses);
    displayTeamAnalysis('team-resistances', teamResistances);
    displayTeamAnalysis('team-immunities', teamImmunities);

    document.getElementById('team-analysis').classList.add('active');
}

// Display team analysis section
function displayTeamAnalysis(elementId, data) {
    const element = document.getElementById(elementId);
    const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]);
    
    if (sorted.length === 0) {
        element.innerHTML = '<p style="color: #9ca3af; font-style: italic;">None</p>';
        return;
    }

    element.innerHTML = sorted.map(([type, count]) => `
        <div class="type-count-item">
            <span class="type-badge type-${type}">${type}</span>
            <span class="count-badge">×${count}</span>
        </div>
    `).join('');
}

// Add slot
function addSlot() {
    if (slots.length >= maxTeamSize) return;
    
    const newSlot = { id: nextId++, pokemon: null };
    slots.push(newSlot);
    renderSlots();
    updateSlotCount();
}

// Remove slot
function removeSlot(slotId) {
    if (slots.length <= 1) return;
    
    slots = slots.filter(s => s.id !== slotId);
    renderSlots();
    updateSlotCount();
    updateTeamAnalysis();
}

// Render all slots
function renderSlots() {
    // Create empty slots
    const container = document.getElementById('slots-container');
    container.innerHTML = slots.map(slot => `
        <div class="slot-box" id="slot-${slot.id}">
            <div class="slot-content">
                <div class="pokemon-img-container">
                    <div style="color: #9ca3af; font-size: 3em;">?</div>
                </div>
                <div class="info-box">
                    <div class="input-box">
                        <input type="text" id="input-${slot.id}" placeholder="Enter Pokémon name..." onkeydown="if(event.key === 'Enter') fetchPokemon(${slot.id})">
                        <button class="btn btn-search" onclick="fetchPokemon(${slot.id})">Search</button>
                        ${slots.length > 1 ? `<button class="btn btn-remove" onclick="warningPopup(${slot.id})">✕</button>` : ''}
                    </div>
                    <div class="pokemon-info"></div>
                </div>
            </div>
        </div>
    `).join('');

    // Display currently-saved Pokemon in slots
    slots.forEach(slot => {
        if(slot.pokemon != null) {
            displayPokemon(slot.id, slot.pokemon);
        }
    });
}

// Update slot count
function updateSlotCount() {
    document.getElementById('slot-count').textContent = slots.length;
    document.getElementById('add-slot-btn').style.display = slots.length >= maxTeamSize ? 'none' : 'block';
    document.getElementById('slot-count-max').textContent = maxTeamSize;
}

// Initialize
renderSlots();
updateSlotCount();