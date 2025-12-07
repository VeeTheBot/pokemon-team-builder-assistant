% Knowledge Representation: Competitive Pokémon Rules
% Based on Smogon competitive strategies

offensive_pokemon(P) :-
    base_stat(P, attack, A),
    base_stat(P, speed, S),
    A >= 110,
    S >= 95.

offensive_pokemon(P) :-
    base_stat(P, special_attack, SpA),
    base_stat(P, speed, S),
    SpA >= 110,
    S >= 95.

wall(P) :- 
    base_stat(P, health, HP),
    base_stat(P, defense, D),
    base_stat(P, special_defense, SpD),
    HP >= 80,
    D >= 80,
    SpD >= 80.

% Rule 1: Type Coverage (Propositional Logic)
% needs_offensive_coverage(Team, Type) :-
%     important_coverage_type(Type),
%     \+ team_covers_type(Team, Type).

important_coverage_type(fighting).
important_coverage_type(ground).
important_coverage_type(steel).
important_coverage_type(fairy).
important_coverage_type(fire).
important_coverage_type(water).

% Offensive Synergy
% team_covers_type(Team, Type)
% True if at least one Pokémon in Team has coverage against TargetType.
% team_covers_type(Team, TargetType) :-
%     member(Pokemon, Team),
%     has_move(Pokemon, Move),
%     move_hits_super_effectively(Move, TargetType).

% team_covers_type(Team, Type)
% True if at least one Pokémon in Team has coverage against TargetType.
team_covers_type(Team, Type) :-
    member(Pokemon, Team),
    has_type(Pokemon, Type).

% Rule 2: Defensive Synergy (Logic Programming)
% team_weak_against(Team, AttackType, Severity) :-
%     findall(Mult, (member(P, Team), pokemon_weakness(P, AttackType, Mult)), Multipliers),
%     sum_list(Multipliers, Total),
%     length(Team, Len),
%     Len > 0,
%     Severity is Total / Len.

% Rule 3: Role Balance (Planning Concepts)
has_role_match(Role, Pokemon) :-
    has_role(Pokemon, Role).

count_role(Team, Role, Count) :-
    include(has_role_match(Role), Team, Filtered),
    length(Filtered, Count).

needs_role(Team, Role) :-
    required_role(Role),
    count_role(Team, Role, Count),
    required_count(Role, Min),
    Count < Min.
    
required_role(physical_sweeper).
required_role(special_sweeper).
required_role(wall).

required_count(physical_sweeper, 1).
required_count(special_sweeper, 1).
required_count(wall, 1).

% Rule 4: Team Archetype (Ontology-like structure)
has_role_count(Team, Role, N) :-
    count_role(Team, Role, N).

team_archetype(Team, balanced) :-
    has_role_count(Team, physical_sweeper, 1),
    has_role_count(Team, special_sweeper, 1),
    has_role_count(Team, wall, 2).

team_archetype(Team, hyper_offense) :-
    forall(member(P, Team), offensive_pokemon(P)).

% Rule 5: Recommendation with Explanation
% recommend_pokemon(Team, Pokemon, Explanation) :-
%     % Multiple possible explanations
%     (needs_offensive_coverage(Team, Type), has_type(Pokemon, Type)) ->
%         format(atom(Explanation), 'Provides ~w coverage', [Type])
%     ; (team_weak_against(Team, AttackType, Severity), Severity > 2,
%        resists_type(Pokemon, AttackType)) ->
%         format(atom(Explanation), 'Resists team weakness to ~w (severity: ~1f)', [AttackType, Severity])
%     ; (needs_role(Team, Role), has_role(Pokemon, Role)) ->
%         format(atom(Explanation), 'Fills ~w role', [Role])
%     ; Explanation = 'Good team synergy'.

    recommend_pokemon(Team, Pokemon, Explanation) :-

    % 1. Missing type coverage
    (needs_offensive_coverage(Team, Type),
     has_type(Pokemon, Type))
    ->
    format(atom(Explanation), 'Provides ~w coverage', [Type])

    % 2. Patch weaknesses
    ; (team_weak_against(Team, AttackType, Severity),
       Severity > 2,
       resists_type(Pokemon, AttackType))
    ->
    format(atom(Explanation), 
           'Resists team weakness to ~w (severity: ~1f)', 
           [AttackType, Severity])

    % 3. Missing roles
    ; (needs_role(Team, Role),
       has_role(Pokemon, Role))
    ->
    format(atom(Explanation), 'Fills ~w role', [Role])

    % 4. Default
    ; Explanation = 'Good team synergy'.