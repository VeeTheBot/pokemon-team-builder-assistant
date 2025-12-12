% Knowledge Representation: Competitive Pokémon Rules
% Based on Smogon competitive strategies
% Fixed version with proper dynamic predicate declarations

% ===== DYNAMIC PREDICATE DECLARATIONS =====
% These predicates will be asserted at runtime from Python
:- dynamic current_pokemon/1.
:- dynamic has_type/2.
:- dynamic base_stat/3.
:- dynamic viable_pokemon/1.

% ===== ROLE DEFINITIONS =====

% Offensive Pokemon (Physical)
offensive_pokemon(P) :-
    base_stat(P, 'attack', A),
    base_stat(P, 'speed', S),
    A >= 110,
    S >= 95.

% Offensive Pokemon (Special)
offensive_pokemon(P) :-
    base_stat(P, 'special_attack', SpA),
    base_stat(P, 'speed', S),
    SpA >= 110,
    S >= 95.

% Wall/Tank
wall(P) :- 
    base_stat(P, 'hp', HP),
    base_stat(P, 'defense', D),
    base_stat(P, 'special_defense', SpD),
    HP >= 80,
    D >= 80,
    SpD >= 80.

% Determine roles based on stats
has_role(P, physical_sweeper) :-
    base_stat(P, 'attack', A),
    base_stat(P, 'speed', S),
    A >= 100,
    S >= 80.

has_role(P, special_sweeper) :-
    base_stat(P, 'special_attack', SpA),
    base_stat(P, 'speed', S),
    SpA >= 100,
    S >= 80.

has_role(P, wall) :-
    wall(P).

has_role(P, tank) :-
    base_stat(P, 'hp', HP),
    HP >= 90,
    (base_stat(P, 'defense', D), D >= 70;
     base_stat(P, 'special_defense', SpD), SpD >= 70).

% ===== TYPE COVERAGE =====

% Important offensive types to have on team
important_coverage_type(fighting).
important_coverage_type(ground).
important_coverage_type(steel).
important_coverage_type(fairy).
important_coverage_type(fire).
important_coverage_type(water).
important_coverage_type(ice).
important_coverage_type(dragon).

% Check if team covers a type offensively (a team member has that type)
team_covers_type(Type) :-
    current_pokemon(P),
    has_type(P, Type).

% Check if team needs a specific type
needs_offensive_coverage(Type) :-
    important_coverage_type(Type),
    \+ team_covers_type(Type).

% ===== TYPE EFFECTIVENESS (Complete Chart) =====

% super_effective(AttackType, DefenseType) - AttackType is super effective against DefenseType
super_effective(fire, grass).
super_effective(fire, ice).
super_effective(fire, bug).
super_effective(fire, steel).
super_effective(water, fire).
super_effective(water, ground).
super_effective(water, rock).
super_effective(grass, water).
super_effective(grass, ground).
super_effective(grass, rock).
super_effective(electric, water).
super_effective(electric, flying).
super_effective(ice, grass).
super_effective(ice, ground).
super_effective(ice, flying).
super_effective(ice, dragon).
super_effective(fighting, normal).
super_effective(fighting, ice).
super_effective(fighting, rock).
super_effective(fighting, dark).
super_effective(fighting, steel).
super_effective(ground, fire).
super_effective(ground, electric).
super_effective(ground, poison).
super_effective(ground, rock).
super_effective(ground, steel).
super_effective(fairy, fighting).
super_effective(fairy, dragon).
super_effective(fairy, dark).
super_effective(dragon, dragon).
super_effective(dark, psychic).
super_effective(dark, ghost).
super_effective(bug, grass).
super_effective(bug, psychic).
super_effective(bug, dark).
super_effective(rock, fire).
super_effective(rock, ice).
super_effective(rock, flying).
super_effective(rock, bug).
super_effective(poison, grass).
super_effective(poison, fairy).
super_effective(psychic, fighting).
super_effective(psychic, poison).
super_effective(ghost, psychic).
super_effective(ghost, ghost).
super_effective(flying, grass).
super_effective(flying, fighting).
super_effective(flying, bug).
super_effective(steel, ice).
super_effective(steel, rock).
super_effective(steel, fairy).

% Resistances
resists(fire, fire).
resists(fire, grass).
resists(fire, ice).
resists(fire, bug).
resists(fire, steel).
resists(fire, fairy).
resists(water, fire).
resists(water, water).
resists(water, ice).
resists(water, steel).
resists(grass, water).
resists(grass, electric).
resists(grass, grass).
resists(grass, ground).
resists(electric, electric).
resists(electric, flying).
resists(electric, steel).
resists(ice, ice).
resists(fighting, bug).
resists(fighting, rock).
resists(fighting, dark).
resists(ground, poison).
resists(ground, rock).
resists(flying, grass).
resists(flying, fighting).
resists(flying, bug).
resists(psychic, fighting).
resists(psychic, psychic).
resists(bug, grass).
resists(bug, fighting).
resists(bug, ground).
resists(rock, normal).
resists(rock, fire).
resists(rock, poison).
resists(rock, flying).
resists(ghost, poison).
resists(ghost, bug).
resists(dragon, fire).
resists(dragon, water).
resists(dragon, electric).
resists(dragon, grass).
resists(dark, ghost).
resists(dark, dark).
resists(steel, normal).
resists(steel, grass).
resists(steel, ice).
resists(steel, flying).
resists(steel, psychic).
resists(steel, bug).
resists(steel, rock).
resists(steel, dragon).
resists(steel, steel).
resists(steel, fairy).
resists(fairy, fighting).
resists(fairy, bug).
resists(fairy, dark).
resists(poison, grass).
resists(poison, fighting).
resists(poison, poison).
resists(poison, bug).
resists(poison, fairy).
resists(normal, ghost).  % Immunity counts as resistance

% Immunities
immune(normal, ghost).
immune(ghost, normal).
immune(ghost, fighting).
immune(ground, electric).
immune(flying, ground).
immune(dark, psychic).
immune(steel, poison).
immune(fairy, dragon).

% Check if Pokemon resists a type
pokemon_resists_type(P, AttackType) :-
    has_type(P, DefenseType),
    (resists(DefenseType, AttackType) ; immune(DefenseType, AttackType)).

% ===== DEFENSIVE ANALYSIS =====

% Check if a Pokemon is weak to an attack type
pokemon_weak_to(P, AttackType) :-
    has_type(P, DefenseType),
    super_effective(AttackType, DefenseType),
    \+ pokemon_resists_type(P, AttackType).

% Count team weaknesses to a type
count_team_weak_to(AttackType, Count) :-
    findall(P, (current_pokemon(P), pokemon_weak_to(P, AttackType)), WeakPokemon),
    length(WeakPokemon, Count).

% Calculate team weakness severity (0-4 scale based on how many are weak)
team_weak_against(AttackType, Severity) :-
    important_coverage_type(AttackType),
    count_team_weak_to(AttackType, WeakCount),
    WeakCount > 0,
    findall(P2, current_pokemon(P2), AllPokemon),
    length(AllPokemon, TotalCount),
    TotalCount > 0,
    Severity is (WeakCount / TotalCount) * 4.

% ===== ROLE REQUIREMENTS =====

required_role(physical_sweeper).
required_role(special_sweeper).
required_role(wall).

required_count(physical_sweeper, 1).
required_count(special_sweeper, 1).
required_count(wall, 1).

% Count how many Pokemon fill a role
count_role(Role, Count) :-
    findall(P, (current_pokemon(P), has_role(P, Role)), RolePokemon),
    length(RolePokemon, Count).

% Check if team needs a role
needs_role(Role) :-
    required_role(Role),
    count_role(Role, Count),
    required_count(Role, Min),
    Count < Min.

% ===== TEAM ARCHETYPES =====

team_archetype(balanced) :-
    count_role(physical_sweeper, PS),
    count_role(special_sweeper, SS),
    count_role(wall, W),
    PS >= 1,
    SS >= 1,
    W >= 1.

team_archetype(hyper_offense) :-
    forall(current_pokemon(P), offensive_pokemon(P)).

% ===== RECOMMENDATIONS =====

% Helper to check if pokemon provides type coverage
provides_coverage(Pokemon, Type) :-
    viable_pokemon(Pokemon),
    \+ current_pokemon(Pokemon),
    has_type(Pokemon, Type).

% Simplified recommendation predicate
% Priority 1: Missing type coverage
recommend_pokemon(Pokemon, Explanation) :-
    needs_offensive_coverage(Type),
    viable_pokemon(Pokemon),
    \+ current_pokemon(Pokemon),
    has_type(Pokemon, Type),
    format(atom(Explanation), 'Provides missing ~w-type coverage for offensive presence', [Type]),
    !.  % Cut to get one recommendation per missing type

% Priority 2: Major team weakness - recommends Pokemon that resist it  
recommend_pokemon(Pokemon, Explanation) :-
    team_weak_against(AttackType, Severity),
    Severity >= 1.5,
    viable_pokemon(Pokemon),
    \+ current_pokemon(Pokemon),
    pokemon_resists_type(Pokemon, AttackType),
    format(atom(Explanation), 'Helps resist team weakness to ~w-type attacks (severity: ~1f)', [AttackType, Severity]),
    !.

% Priority 3: Missing role
recommend_pokemon(Pokemon, Explanation) :-
    needs_role(Role),
    viable_pokemon(Pokemon),
    \+ current_pokemon(Pokemon),
    has_role(Pokemon, Role),
    format(atom(Explanation), 'Fills the missing ~w role in team composition', [Role]),
    !.

% Priority 4: General synergy - any viable pokemon with an important type
recommend_pokemon(Pokemon, Explanation) :-
    viable_pokemon(Pokemon),
    \+ current_pokemon(Pokemon),
    has_type(Pokemon, Type),
    important_coverage_type(Type),
    Explanation = 'Provides good type synergy and team balance'.

% Get all recommendations (used by Python)
all_recommendations(Recommendations) :-
    findall([Pokemon, Explanation], 
            recommend_pokemon(Pokemon, Explanation), 
            Recommendations).

% Debug predicates - useful for testing
debug_current_team(Team) :-
    findall(P, current_pokemon(P), Team).

debug_team_types(Types) :-
    findall([P, T], (current_pokemon(P), has_type(P, T)), Types).

debug_missing_coverage(Missing) :-
    findall(T, needs_offensive_coverage(T), Missing).

% ===== STATIC VIABLE POKEMON DATA =====
% Pre-defined type data for common Gen9 OU Pokemon
% This allows Prolog to make recommendations without API calls

% Format: pokemon_type(Pokemon, Type1, Type2) - Type2 is 'none' for mono-types
pokemon_type(garchomp, dragon, ground).
pokemon_type(dragapult, dragon, ghost).
pokemon_type(dragonite, dragon, flying).
pokemon_type(salamence, dragon, flying).
pokemon_type(hydreigon, dark, dragon).
pokemon_type(goodra, dragon, none).
pokemon_type(kommo_o, dragon, fighting).
pokemon_type(kyurem, dragon, ice).
pokemon_type(haxorus, dragon, none).
pokemon_type(latios, dragon, psychic).
pokemon_type(latias, dragon, psychic).
pokemon_type(roaring_moon, dragon, dark).
pokemon_type(iron_valiant, fairy, fighting).
pokemon_type(great_tusk, ground, fighting).
pokemon_type(iron_treads, ground, steel).
pokemon_type(iron_moth, fire, poison).
pokemon_type(iron_hands, fighting, electric).
pokemon_type(iron_thorns, rock, electric).
pokemon_type(flutter_mane, ghost, fairy).
pokemon_type(chi_yu, dark, fire).
pokemon_type(chien_pao, dark, ice).
pokemon_type(ting_lu, dark, ground).
pokemon_type(wo_chien, dark, grass).
pokemon_type(kingambit, dark, steel).
pokemon_type(gholdengo, steel, ghost).
pokemon_type(meowscarada, grass, dark).
pokemon_type(skeledirge, fire, ghost).
pokemon_type(quaquaval, water, fighting).
pokemon_type(palafin, water, none).
pokemon_type(dondozo, water, none).
pokemon_type(tatsugiri, dragon, water).
pokemon_type(baxcalibur, dragon, ice).
pokemon_type(ceruledge, fire, ghost).
pokemon_type(armarouge, fire, psychic).
pokemon_type(annihilape, fighting, ghost).
pokemon_type(espathra, psychic, none).
pokemon_type(flamigo, flying, fighting).
pokemon_type(kilowattrel, electric, flying).
pokemon_type(wugtrio, water, none).
pokemon_type(garganacl, rock, none).
pokemon_type(glimmora, rock, poison).
pokemon_type(orthworm, steel, none).
pokemon_type(clodsire, poison, ground).
pokemon_type(toxapex, poison, water).
pokemon_type(clefable, fairy, none).
pokemon_type(hatterene, psychic, fairy).
pokemon_type(grimmsnarl, dark, fairy).
pokemon_type(ferrothorn, grass, steel).
pokemon_type(corviknight, flying, steel).
pokemon_type(skarmory, steel, flying).
pokemon_type(tyranitar, rock, dark).
pokemon_type(hippowdon, ground, none).
pokemon_type(excadrill, ground, steel).
pokemon_type(landorus, ground, flying).
pokemon_type(landorus_therian, ground, flying).
pokemon_type(gliscor, ground, flying).
pokemon_type(volcarona, bug, fire).
pokemon_type(dragonite, dragon, flying).
pokemon_type(gyarados, water, flying).
pokemon_type(pelipper, water, flying).
pokemon_type(rotom_wash, electric, water).
pokemon_type(rotom_heat, electric, fire).
pokemon_type(azumarill, water, fairy).
pokemon_type(slowking, water, psychic).
pokemon_type(slowbro, water, psychic).
pokemon_type(swampert, water, ground).
pokemon_type(greninja, water, dark).
pokemon_type(urshifu, fighting, dark).
pokemon_type(urshifu_rapid, fighting, water).
pokemon_type(blaziken, fire, fighting).
pokemon_type(cinderace, fire, none).
pokemon_type(infernape, fire, fighting).
pokemon_type(charizard, fire, flying).
pokemon_type(heatran, fire, steel).
pokemon_type(magnezone, electric, steel).
pokemon_type(rillaboom, grass, none).
pokemon_type(venusaur, grass, poison).
pokemon_type(tangrowth, grass, none).
pokemon_type(amoonguss, grass, poison).
pokemon_type(kartana, grass, steel).
pokemon_type(serperior, grass, none).
pokemon_type(weavile, dark, ice).
pokemon_type(mamoswine, ice, ground).
pokemon_type(cloyster, water, ice).
pokemon_type(ninetales_alola, ice, fairy).
pokemon_type(articuno, ice, flying).
pokemon_type(gengar, ghost, poison).
pokemon_type(chandelure, ghost, fire).
pokemon_type(mimikyu, ghost, fairy).
pokemon_type(aegislash, steel, ghost).
pokemon_type(alakazam, psychic, none).
pokemon_type(gardevoir, psychic, fairy).
pokemon_type(medicham, fighting, psychic).
pokemon_type(lucario, fighting, steel).
pokemon_type(conkeldurr, fighting, none).
pokemon_type(machamp, fighting, none).
pokemon_type(hawlucha, fighting, flying).
pokemon_type(breloom, grass, fighting).
pokemon_type(scizor, bug, steel).
pokemon_type(heracross, bug, fighting).

% Helper to get types of a Pokemon (works with both static and dynamic data)
get_pokemon_types(Pokemon, Types) :-
    (pokemon_type(Pokemon, T1, T2) ->
        (T2 = none -> Types = [T1] ; Types = [T1, T2])
    ;
        findall(T, has_type(Pokemon, T), Types)
    ).

% Check if Pokemon has a specific type (static or dynamic)
pokemon_has_type(Pokemon, Type) :-
    (pokemon_type(Pokemon, Type, _) ; pokemon_type(Pokemon, _, Type), Type \= none).

pokemon_has_type(Pokemon, Type) :-
    has_type(Pokemon, Type).

% ===== STATIC STAT DATA FOR COMMON POKEMON =====
% Format: pokemon_stats(Name, HP, Attack, Defense, SpAtk, SpDef, Speed)
pokemon_stats(garchomp, 108, 130, 95, 80, 85, 102).
pokemon_stats(dragapult, 88, 120, 75, 100, 75, 142).
pokemon_stats(dragonite, 91, 134, 95, 100, 100, 80).
pokemon_stats(tyranitar, 100, 134, 110, 95, 100, 61).
pokemon_stats(kingambit, 100, 135, 120, 60, 85, 50).
pokemon_stats(gholdengo, 87, 60, 95, 133, 91, 84).
pokemon_stats(great_tusk, 115, 131, 131, 53, 53, 87).
pokemon_stats(iron_valiant, 74, 130, 90, 120, 60, 116).
pokemon_stats(iron_treads, 90, 112, 120, 72, 70, 106).
pokemon_stats(flutter_mane, 55, 55, 55, 135, 135, 135).
pokemon_stats(chi_yu, 55, 80, 80, 135, 120, 100).
pokemon_stats(chien_pao, 80, 120, 80, 90, 65, 135).
pokemon_stats(ting_lu, 155, 110, 125, 55, 80, 45).
pokemon_stats(roaring_moon, 105, 139, 71, 55, 101, 119).
pokemon_stats(clefable, 95, 70, 73, 95, 90, 60).
pokemon_stats(toxapex, 50, 63, 152, 53, 142, 35).
pokemon_stats(ferrothorn, 74, 94, 131, 54, 116, 20).
pokemon_stats(corviknight, 98, 87, 105, 53, 85, 67).
pokemon_stats(volcarona, 85, 60, 65, 135, 105, 100).
pokemon_stats(weavile, 70, 120, 65, 45, 85, 125).
pokemon_stats(excadrill, 110, 135, 60, 50, 65, 88).
pokemon_stats(heatran, 91, 90, 106, 130, 106, 77).
pokemon_stats(landorus, 89, 125, 90, 115, 80, 101).
pokemon_stats(scizor, 70, 130, 100, 55, 80, 65).
pokemon_stats(gengar, 60, 65, 60, 130, 75, 110).
pokemon_stats(lucario, 70, 110, 70, 115, 70, 90).
pokemon_stats(azumarill, 100, 50, 80, 60, 80, 50).
pokemon_stats(slowking, 95, 75, 80, 100, 110, 30).
pokemon_stats(machamp, 90, 130, 80, 65, 85, 55).
pokemon_stats(annihilape, 110, 115, 80, 50, 90, 90).
pokemon_stats(baxcalibur, 115, 145, 92, 75, 86, 87).
pokemon_stats(skeledirge, 104, 75, 100, 110, 75, 66).
pokemon_stats(meowscarada, 76, 110, 70, 81, 70, 123).
pokemon_stats(quaquaval, 85, 120, 80, 85, 75, 85).
pokemon_stats(garganacl, 100, 100, 130, 45, 90, 35).
pokemon_stats(ceruledge, 75, 125, 80, 60, 100, 85).
pokemon_stats(armarouge, 85, 60, 100, 125, 80, 75).
pokemon_stats(palafin, 100, 160, 97, 106, 87, 100).
pokemon_stats(dondozo, 150, 100, 115, 65, 65, 35).
pokemon_stats(clodsire, 130, 75, 60, 45, 100, 20).
pokemon_stats(glimmora, 83, 55, 90, 130, 81, 86).

% Check roles based on static stats
static_has_role(Pokemon, physical_sweeper) :-
    pokemon_stats(Pokemon, _, Atk, _, _, _, Spd),
    Atk >= 100,
    Spd >= 80.

static_has_role(Pokemon, special_sweeper) :-
    pokemon_stats(Pokemon, _, _, _, SpAtk, _, Spd),
    SpAtk >= 100,
    Spd >= 80.

static_has_role(Pokemon, wall) :-
    pokemon_stats(Pokemon, HP, _, Def, _, SpDef, _),
    HP >= 80,
    Def >= 80,
    SpDef >= 80.

static_has_role(Pokemon, tank) :-
    pokemon_stats(Pokemon, HP, _, Def, _, SpDef, _),
    HP >= 90,
    (Def >= 70 ; SpDef >= 70).

% ===== UPDATED RECOMMENDATION SYSTEM =====
% Now uses static Pokemon data for recommendations

% List of statically known viable Pokemon
static_viable(garchomp).
static_viable(dragapult).
static_viable(dragonite).
static_viable(tyranitar).
static_viable(kingambit).
static_viable(gholdengo).
static_viable(great_tusk).
static_viable(iron_valiant).
static_viable(iron_treads).
static_viable(flutter_mane).
static_viable(chi_yu).
static_viable(chien_pao).
static_viable(ting_lu).
static_viable(roaring_moon).
static_viable(clefable).
static_viable(toxapex).
static_viable(ferrothorn).
static_viable(corviknight).
static_viable(volcarona).
static_viable(weavile).
static_viable(excadrill).
static_viable(heatran).
static_viable(landorus).
static_viable(scizor).
static_viable(gengar).
static_viable(lucario).
static_viable(azumarill).
static_viable(slowking).
static_viable(machamp).
static_viable(annihilape).
static_viable(baxcalibur).
static_viable(skeledirge).
static_viable(meowscarada).
static_viable(quaquaval).
static_viable(garganacl).
static_viable(ceruledge).
static_viable(armarouge).
static_viable(palafin).
static_viable(dondozo).
static_viable(clodsire).
static_viable(glimmora).

% Check if already on team (handles different name formats)
already_on_team(Pokemon) :-
    current_pokemon(Pokemon).
already_on_team(Pokemon) :-
    current_pokemon(Current),
    atom_string(Pokemon, PStr),
    atom_string(Current, CStr),
    sub_string(CStr, _, _, _, PStr).
already_on_team(Pokemon) :-
    current_pokemon(Current),
    atom_string(Pokemon, PStr),
    atom_string(Current, CStr),
    sub_string(PStr, _, _, _, CStr).

% Static-based recommendation: Missing type coverage
static_recommend(Pokemon, Explanation) :-
    needs_offensive_coverage(Type),
    static_viable(Pokemon),
    \+ already_on_team(Pokemon),
    pokemon_has_type(Pokemon, Type),
    format(atom(Explanation), 'Provides missing ~w-type coverage', [Type]).

% Static-based recommendation: Missing role
static_recommend(Pokemon, Explanation) :-
    needs_role(Role),
    static_viable(Pokemon),
    \+ already_on_team(Pokemon),
    static_has_role(Pokemon, Role),
    format(atom(Explanation), 'Fills the missing ~w role', [Role]).

% Static-based recommendation: General good pick
static_recommend(Pokemon, Explanation) :-
    static_viable(Pokemon),
    \+ already_on_team(Pokemon),
    pokemon_has_type(Pokemon, Type),
    important_coverage_type(Type),
    Explanation = 'Strong competitive pick with good type coverage'.

% Main recommendation predicate (prefers static data)
recommend_pokemon(Pokemon, Explanation) :-
    static_recommend(Pokemon, Explanation).

% Fallback to dynamic viable_pokemon if no static recommendations work
recommend_pokemon(Pokemon, Explanation) :-
    viable_pokemon(Pokemon),
    \+ current_pokemon(Pokemon),
    has_type(Pokemon, Type),
    important_coverage_type(Type),
    format(atom(Explanation), 'Viable competitive pick with ~w typing', [Type]).