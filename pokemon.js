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
const maxTeamSize = 6;
let allPokemonNames = []; // For autocomplete

// Load all Pokemon names for autocomplete
async function loadPokemonNames() {
    try {
        const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1000');
        const data = await response.json();
        allPokemonNames = data.results.map(p => p.name);
        console.log('✓ Loaded', allPokemonNames.length, 'Pokémon names for autocomplete');
    } catch (error) {
        console.error('Failed to load Pokémon names:', error);
    }
}

// Show autocomplete suggestions
function showAutocompleteSuggestions(input, suggestions) {
    // Remove existing suggestions
    const existingSuggestions = input.parentElement.querySelector('.autocomplete-suggestions');
    if (existingSuggestions) {
        existingSuggestions.remove();
    }

    if (suggestions.length === 0) return;

    const suggestionsDiv = document.createElement('div');
    suggestionsDiv.className = 'autocomplete-suggestions';
    
    suggestions.slice(0, 8).forEach(name => {
        const suggestionItem = document.createElement('div');
        suggestionItem.className = 'autocomplete-item';
        suggestionItem.textContent = name;
        suggestionItem.addEventListener('click', () => {
            input.value = name;
            suggestionsDiv.remove();
            const slotId = parseInt(input.id.split('-')[1]);
            fetchPokemon(slotId);
        });
        suggestionsDiv.appendChild(suggestionItem);
    });

    input.parentElement.appendChild(suggestionsDiv);
}

// Calculate team strength score
function calculateTeamStrength(teamData) {
    if (teamData.length === 0) return 0;

    let score = 0;
    
    // 1. Team size (max 20 points)
    score += (teamData.length / 6) * 20;
    
    // 2. Type coverage (max 25 points)
    const importantTypes = ['fighting', 'ground', 'steel', 'fairy', 'fire', 'water', 'ice', 'dragon'];
    const coveredTypes = new Set();
    teamData.forEach(p => p.types.forEach(t => coveredTypes.add(t)));
    const coverageScore = (coveredTypes.size / importantTypes.length) * 25;
    score += coverageScore;
    
    // 3. Stat distribution (max 25 points)
    let totalBST = 0;
    teamData.forEach(p => totalBST += p.baseStatTotal);
    const avgBST = totalBST / teamData.length;
    const statScore = Math.min((avgBST / 600) * 25, 25);
    score += statScore;
    
    // 4. Role balance (max 15 points)
    const roles = identifyRoles(teamData);
    const hasPhysicalSweeper = roles.physical_sweeper > 0;
    const hasSpecialSweeper = roles.special_sweeper > 0;
    const hasWall = roles.wall > 0;
    let roleScore = 0;
    if (hasPhysicalSweeper) roleScore += 5;
    if (hasSpecialSweeper) roleScore += 5;
    if (hasWall) roleScore += 5;
    score += roleScore;
    
    // 5. Type diversity (max 15 points)
    const uniqueTypes = new Set();
    teamData.forEach(p => p.types.forEach(t => uniqueTypes.add(t)));
    const diversityScore = Math.min((uniqueTypes.size / 10) * 15, 15);
    score += diversityScore;
    
    return Math.round(score);
}

function identifyRoles(teamData) {
    const roles = {
        physical_sweeper: 0,
        special_sweeper: 0,
        wall: 0,
        tank: 0
    };
    
    teamData.forEach(pokemon => {
        const stats = pokemon.stats.reduce((acc, stat) => {
            acc[stat.stat.name] = stat.base_stat;
            return acc;
        }, {});
        
        if (stats['attack'] >= 100 && stats['speed'] >= 80) {
            roles.physical_sweeper++;
        }
        if (stats['special-attack'] >= 100 && stats['speed'] >= 80) {
            roles.special_sweeper++;
        }
        if (stats['hp'] >= 80 && stats['defense'] >= 80 && stats['special-defense'] >= 80) {
            roles.wall++;
        }
        if (stats['hp'] >= 90) {
            roles.tank++;
        }
    });
    
    return roles;
}

function getStrengthRating(score) {
    if (score >= 90) return { text: 'Excellent', color: '#10b981', emoji: '🌟' };
    if (score >= 75) return { text: 'Great', color: '#3b82f6', emoji: '⭐' };
    if (score >= 60) return { text: 'Good', color: '#8b5cf6', emoji: '👍' };
    if (score >= 40) return { text: 'Average', color: '#f59e0b', emoji: '👌' };
    return { text: 'Needs Work', color: '#ef4444', emoji: '💪' };
}

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

    // Add pokeball opening effect
    imgContainer.style.animation = 'pokeballOpen 0.6s ease-out';
    
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
    const container = document.getElementById('slots-container');
    container.innerHTML = slots.map(slot => `
        <div class="slot-box" id="slot-${slot.id}">
            <div class="slot-content">
                <div class="pokemon-img-container">
                    <div style="color: #9ca3af; font-size: 3em;">?</div>
                </div>
                <div class="info-box">
                    <div class="input-box">
                        <input type="text" id="input-${slot.id}" placeholder="Enter Pokémon name..." autocomplete="off">
                        <button class="btn btn-search" data-slot-id="${slot.id}" data-action="search">Search</button>
                        ${slots.length > 1 ? `<button class="btn btn-remove" data-slot-id="${slot.id}" data-action="remove">✕</button>` : ''}
                    </div>
                    <div class="pokemon-info"></div>
                </div>
            </div>
        </div>
    `).join('');

    attachSlotEventListeners();

    slots.forEach(slot => {
        if(slot.pokemon != null) {
            displayPokemon(slot.id, slot.pokemon);
        }
    });
}

// Attach event listeners to slot buttons
function attachSlotEventListeners() {
    // Search buttons
    document.querySelectorAll('[data-action="search"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const slotId = parseInt(e.target.dataset.slotId);
            fetchPokemon(slotId);
        });
    });

    // Remove buttons
    document.querySelectorAll('[data-action="remove"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const slotId = parseInt(e.target.dataset.slotId);
            warningPopup(slotId);
        });
    });

    // Input with autocomplete
    document.querySelectorAll('input[type="text"]').forEach(input => {
        input.addEventListener('input', (e) => {
            const value = e.target.value.toLowerCase().trim();
            if (value.length < 2) {
                const existingSuggestions = input.parentElement.querySelector('.autocomplete-suggestions');
                if (existingSuggestions) existingSuggestions.remove();
                return;
            }
            
            const matches = allPokemonNames.filter(name => name.startsWith(value));
            showAutocompleteSuggestions(input, matches);
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const slotId = parseInt(e.target.id.split('-')[1]);
                const existingSuggestions = input.parentElement.querySelector('.autocomplete-suggestions');
                if (existingSuggestions) existingSuggestions.remove();
                fetchPokemon(slotId);
            }
        });

        // Close suggestions when clicking outside
        input.addEventListener('blur', (e) => {
            setTimeout(() => {
                const existingSuggestions = input.parentElement.querySelector('.autocomplete-suggestions');
                if (existingSuggestions) existingSuggestions.remove();
            }, 200);
        });
    });
}

// Update slot count
function updateSlotCount() {
    document.getElementById('slot-count').textContent = slots.length;
    document.getElementById('add-slot-btn').style.display = slots.length >= maxTeamSize ? 'none' : 'block';
    document.getElementById('slot-count-max').textContent = maxTeamSize;
}

// PROLOG BACKEND INTEGRATION
async function getIntelligentRecommendations() {
    const currentTeam = slots
        .filter(slot => slot.pokemon)
        .map(slot => {
            const p = slot.pokemon;
            return {
                name: p.name,
                types: p.types.map(t => t.type.name),
                stats: p.stats.reduce((acc, stat) => {
                    acc[stat.stat.name] = stat.base_stat;
                    return acc;
                }, {}),
                baseStatTotal: p.baseStatTotal,
                matchup: p.matchup
            };
        });

    if (currentTeam.length === 0) {
        alert('Please add some Pokémon to your team first!');
        return;
    }

    try {
        const response = await fetch('http://127.0.0.1:5000/api/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ team: currentTeam })
        });

        const data = await response.json();
        displayKnowledgeBasedAnalysis(data);
        
    } catch (error) {
        console.error('Error getting analysis:', error);
        alert('Error connecting to backend. Make sure the server is running.');
    }
}

function displayKnowledgeBasedAnalysis(data) {
    const existingAnalysis = document.getElementById('knowledge-analysis');
    if (existingAnalysis) {
        existingAnalysis.remove();
    }
    
    // Calculate team strength
    const validPokemon = slots.filter(s => s.pokemon).map(s => s.pokemon);
    const strengthScore = calculateTeamStrength(validPokemon);
    const rating = getStrengthRating(strengthScore);
    
    const analysisDiv = document.createElement('div');
    analysisDiv.id = 'knowledge-analysis';
    analysisDiv.className = 'knowledge-analysis active';
    
    let recommendationsHTML = '';
    if (data.analysis.logic_programming && data.analysis.logic_programming.length > 0) {
        recommendationsHTML = data.analysis.logic_programming.map(rec => `
            <div class="recommendation-card">
                <div class="recommendation-header">
                    <h4 class="recommendation-pokemon">${rec.pokemon}</h4>
                    <button class="btn-add-recommended" data-pokemon="${rec.pokemon}" data-action="add-recommended">
                        + Add
                    </button>
                </div>
                <p class="recommendation-explanation">${rec.explanation}</p>
            </div>
        `).join('');
    } else {
        recommendationsHTML = '<div class="no-recommendations"><p>✓ No specific recommendations needed. Your team composition looks balanced!</p></div>';
    }
    
    let currentRolesHTML = '';
    let missingRolesHTML = '';
    
    if (data.analysis.planning) {
        const currentRoles = data.analysis.planning.current_roles || {};
        if (Object.keys(currentRoles).filter(k => currentRoles[k] > 0).length > 0) {
            currentRolesHTML = Object.entries(currentRoles)
                .filter(([role, count]) => count > 0)
                .map(([role, count]) => `
                    <div class="role-badge role-filled">
                        <span class="role-name">${role.replace(/_/g, ' ')}</span>
                        <span class="role-count">×${count}</span>
                    </div>
                `).join('');
        } else {
            currentRolesHTML = '<p class="role-empty">No roles identified yet</p>';
        }
        
        const missingRoles = data.analysis.planning.missing_roles || {};
        if (Object.keys(missingRoles).length > 0) {
            missingRolesHTML = Object.entries(missingRoles).map(([role, count]) => `
                <div class="role-badge role-missing">
                    <span class="role-name">${role.replace(/_/g, ' ')}</span>
                    <span class="role-count">Need ${count}</span>
                </div>
            `).join('');
        } else {
            missingRolesHTML = '<p class="role-complete">✓ All required roles filled!</p>';
        }
    }
    
    analysisDiv.innerHTML = `
        <div class="analysis-header">
            <h2>🧠 Knowledge-Based Team Analysis</h2>
            <div class="strength-score-container">
                <div class="strength-label">Team Strength</div>
                <div class="strength-score" style="color: ${rating.color}">
                    ${rating.emoji} ${strengthScore}/100
                </div>
                <div class="strength-rating" style="color: ${rating.color}">${rating.text}</div>
            </div>
        </div>
        
        <div class="analysis-content">
            <div class="analysis-card">
                <div class="card-header">
                    <h3>🧩 Knowledge Representation Methods</h3>
                </div>
                <div class="card-body">
                    <div class="methods-grid">
                        ${data.knowledge_representation_used.map(method => 
                            `<div class="method-badge">${method}</div>`
                        ).join('')}
                    </div>
                </div>
            </div>
            
            <div class="analysis-card">
                <div class="card-header">
                    <h3>🔍 Type Coverage Analysis</h3>
                    <div class="coverage-score">${(data.analysis.propositional_logic.score * 100).toFixed(0)}%</div>
                </div>
                <div class="card-body">
                    <div class="coverage-grid">
                        ${Object.entries(data.analysis.propositional_logic.type_coverage).map(([type, covered]) => `
                            <div class="coverage-badge ${covered ? 'covered' : 'missing'}">
                                <span class="type-icon-small type-${type}">${type}</span>
                                <span class="coverage-status">${covered ? '✓' : '✗'}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
            
            <div class="analysis-card">
                <div class="card-header">
                    <h3>🤖 Recommended Pokémon</h3>
                </div>
                <div class="card-body">
                    ${recommendationsHTML}
                </div>
            </div>
            
            <div class="analysis-card">
                <div class="card-header">
                    <h3>📋 Team Role Distribution</h3>
                </div>
                <div class="card-body">
                    <div class="roles-section">
                        <div class="roles-column">
                            <h4 class="roles-subtitle">Current Roles</h4>
                            <div class="roles-list">
                                ${currentRolesHTML}
                            </div>
                        </div>
                        <div class="roles-column">
                            <h4 class="roles-subtitle">Missing Roles</h4>
                            <div class="roles-list">
                                ${missingRolesHTML}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="analysis-card">
                <div class="card-header">
                    <h3>💡 Detailed Reasoning</h3>
                </div>
                <div class="card-body">
                    <div class="explanation-box">
                        ${data.analysis.explanation.split('\n').map(line => 
                            line.trim() ? `<p>${line}</p>` : ''
                        ).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const teamAnalysis = document.getElementById('team-analysis');
    teamAnalysis.parentNode.insertBefore(analysisDiv, teamAnalysis.nextSibling);

    // Attach event listeners to recommendation buttons
    document.querySelectorAll('[data-action="add-recommended"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const pokemonName = e.target.dataset.pokemon;
            addRecommendedPokemon(pokemonName);
        });
    });
}

function addRecommendedPokemon(pokemonName) {
    let emptySlot = slots.find(slot => !slot.pokemon);
    
    if (!emptySlot && slots.length < maxTeamSize) {
        addSlot();
        emptySlot = slots[slots.length - 1];
    }
    
    if (emptySlot) {
        const input = document.getElementById(`input-${emptySlot.id}`);
        input.value = pokemonName;
        fetchPokemon(emptySlot.id);
    } else {
        alert('Team is full! Remove a Pokémon first.');
    }
}

// Initialize on load
window.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing Pokemon Team Builder...');
    
    // Load Pokemon names for autocomplete
    loadPokemonNames();
    
    // Initial render
    renderSlots();
    updateSlotCount();

    // Attach main button listeners
    document.getElementById('add-slot-btn').addEventListener('click', addSlot);
    document.getElementById('analysis-btn').addEventListener('click', getIntelligentRecommendations);

    console.log('✓ Team Builder initialized');
});