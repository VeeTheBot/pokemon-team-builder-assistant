%% TEAM BUILDER — ROLE CLASSIFICATION + TEAM CHECKS


%% Facts dynamically loaded from Python:
%%   current_pokemon(Name)
%%   base_stat(Name, Stat, Value)
%%   has_type(Name, Type)


%% ROLE RULES (BASED ONLY ON BASE STATS)
role(P, sweeper) :-
    base_stat(P, speed, S), S >= 100,
    base_stat(P, attack, A), A >= 110.

role(P, special_sweeper) :-
    base_stat(P, speed, S), S >= 100,
    base_stat(P, 'special-attack', SA), SA >= 110.

role(P, tank) :-
    base_stat(P, defense, D), D >= 100,
    base_stat(P, hp, HP), HP >= 90.

role(P, special_tank) :-
    base_stat(P, 'special-defense', SD), SD >= 100,
    base_stat(P, hp, HP), HP >= 90.

role(P, bulky_attacker) :-
    base_stat(P, attack, A), A >= 100,
    base_stat(P, hp, HP), HP >= 80.

role(P, support) :-
    base_stat(P, speed, S), S < 90,
    base_stat(P, hp, HP), HP >= 70.

%% Fallback: if no role matches → generalist
role(P, generalist) :-
    \+ role(P, sweeper),
    \+ role(P, special_sweeper),
    \+ role(P, tank),
    \+ role(P, special_tank),
    \+ role(P, bulky_attacker),
    \+ role(P, support).


%% TEAM ANALYSIS
%% Required roles
required_roles([sweeper, tank, support]).

current_role_list(Roles) :-
    findall(R, (current_pokemon(P), role(P, R)), Roles).

missing_role(R) :-
    required_roles(Req),
    member(R, Req),
    \+ (current_pokemon(P), role(P,R)).


%% TYPE COVERAGE CHECKS
required_types([fire, water, grass, ground, fairy, steel]).

missing_type(T) :-
    required_types(Req),
    member(T, Req),
    \+ (current_pokemon(P), has_type(P, T)).

%% RECOMMENDATION ENGINE
recommend_pokemon(CurrentTeam, Poke, Explanation) :-
    smogon_pool(Poke, Types, Roles),
    missing_role(R),
    member(R, Roles),
    Explanation = ['Fills missing role ', R].

recommend_pokemon(CurrentTeam, Poke, Explanation) :-
    smogon_pool(Poke, Types, _),
    missing_type(T),
    member(T, Types),
    Explanation = ['Provides missing type ', T].
