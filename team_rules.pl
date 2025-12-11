% Knowledge Representation: Competitive Pokémon Rules
% Based on Smogon competitive strategies

% ===== ROLE DEFINITIONS =====

% Offensive Pokemon (Physical)
offensive_pokemon(P) :-
    base_stat(P, attack, A),
    base_stat(P, speed, S),
    A >= 110,
    S >= 95.

% Offensive Pokemon (Special)
offensive_pokemon(P) :-
    base_stat(P, 'special-attack', SpA),
    base_stat(P, speed, S),
    SpA >= 110,
    S >= 95.

% Wall/Tank
wall(P) :- 
    base_stat(P, hp, HP),
    base_stat(P, defense, D),
    base_stat(P, 'special-defense', SpD),
    HP >= 80,
    D >= 80,
    SpD >= 80.

% Determine roles based on stats
has_role(P, physical_sweeper) :-
    base_stat(P, attack, A),
    base_stat(P, speed, S),
    A >= 100,
    S >= 80.

has_role(P, special_sweeper) :-
    base_stat(P, 'special-attack', SpA),
    base_stat(P, speed, S),
    SpA >= 100,
    S >= 80.

has_role(P, wall) :-
    wall(P).

has_role(P, tank) :-
    base_stat(P, hp, HP),
    HP >= 90,
    (base_stat(P, defense, D), D >= 70;
     base_stat(P, 'special-defense', SpD), SpD >= 70).

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

% Check if team covers a type offensively
team_covers_type(Type) :-
    current_pokemon(P),
    has_type(P, Type).

% Check if team needs a specific type
needs_offensive_coverage(Type) :-
    important_coverage_type(Type),
    \+ team_covers_type(Type).

% ===== DEFENSIVE ANALYSIS =====

% Type effectiveness rules (simplified)
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

% Check if Pokemon resists a type
resists_type(P, AttackType) :-
    has_type(P, DefenseType),
    \+ super_effective(AttackType, DefenseType).

% Calculate team weakness severity
team_weak_against(AttackType, Severity) :-
    findall(P, (current_pokemon(P), has_type(P, DefType), super_effective(AttackType, DefType)), WeakPokemon),
    length(WeakPokemon, WeakCount),
    findall(P2, current_pokemon(P2), AllPokemon),
    length(AllPokemon, TotalCount),
    TotalCount > 0,
    Severity is WeakCount / TotalCount * 4.

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

% Main recommendation predicate with explanations
recommend_pokemon(Pokemon, Explanation) :-
    \+ current_pokemon(Pokemon),
    viable_pokemon(Pokemon),  % Only recommend from Smogon Gen9 OU
    (
        % Priority 1: Missing type coverage
        (needs_offensive_coverage(Type),
         has_type(Pokemon, Type),
         format(atom(Explanation), 'Provides missing ~w-type coverage for offensive presence', [Type]))
    ;
        % Priority 2: Major team weakness
        (team_weak_against(AttackType, Severity),
         Severity >= 2.0,
         resists_type(Pokemon, AttackType),
         format(atom(Explanation), 'Helps resist team weakness to ~w-type attacks (severity: ~1f)', [AttackType, Severity]))
    ;
        % Priority 3: Missing role
        (needs_role(Role),
         has_role(Pokemon, Role),
         format(atom(Explanation), 'Fills the missing ~w role in team composition', [Role]))
    ;
        % Priority 4: General synergy
        (has_type(Pokemon, Type),
         important_coverage_type(Type),
         Explanation = 'Provides good type synergy and team balance')
    ).

% Get all recommendations
all_recommendations(Recommendations) :-
    findall([Pokemon, Explanation], 
            recommend_pokemon(Pokemon, Explanation), 
            Recommendations).