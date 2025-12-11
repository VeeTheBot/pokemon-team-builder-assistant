from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import requests
from pyswip import Prolog
import pandas as pd
import json

app = Flask(__name__)
CORS(app)
prolog = Prolog()

# Load Prolog knowledge base
prolog.consult("team_rules.pl")

class PokemonTeamAdvisor:
    def __init__(self):
        self.pokeapi_base = "https://pokeapi.co/api/v2/"
        self.smogon_data = self.load_smogon_data()
    
    # API data: Consider loading immediately or JSON on hand
    def get_pokemon_data(self, name):
        """Fetch Pokémon data from PokeAPI"""
        # print("get_pokemon_data: Success!")
        try:
            response = requests.get(f"{self.pokeapi_base}pokemon/{name.lower()}")
            if response.status_code == 200:
                data = response.json()
                parsed = {
                    'name': data['name'],
                    'types': [t['type']['name'] for t in data['types']],
                    'stats': {s['stat']['name']: s['base_stat'] for s in data['stats']}
                }
                return parsed
        except:
            pass
        return None
    
    def load_smogon_data(self):
        """Load competitive Pokémon data from Smogon CSV/JSON"""
        try:
            with open("gen9ou.json", "r", encoding="utf8") as f:
                smogon_data = json.load(f)
                return smogon_data  
        except:
            print("No sets found.")
           
    def normalize(self, s):
        return s.lower().replace(" ", "").replace("-", "").replace(".", "")

    def get_full_pokemon_entry(self, name):
        """
        Returns a complete dataset:
        - Types
        - Base Stats
        - Smogon Competitive Sets
        """
        name_key = self.normalize(name)

        # Fetch pokédex info
        species = self.get_pokemon_data(name_key)
        if species is None:
            return None

        # Load Smogon data
        smogon = self.smogon_data

        # Smogon might have names with caps, spaces, etc.
        matched_smogon = None
        
        # Look for matches between PokeAPI and the Smogon set and merge data
        for sm_name in smogon:
            if self.normalize(sm_name) == name_key:
                matched_smogon = smogon[sm_name]
                break

        # Extract only the set names (roles)
        roles = list(matched_smogon.keys()) if matched_smogon else []
    
        # Build combined dictionary
        return {
            "name": species["name"],
            "types": species["types"],
            "stats": species["stats"],
            "smogon_roles": roles
        }
    
    # Gets smogon pool of Gen9 OU only    
    def get_many_entries(self):
        smogon = self.smogon_data
        results = []

        # Call only Pokemon in the Gen9OU set
        for sm_name in smogon:
            entry = self.get_full_pokemon_entry(sm_name)
            if entry is not None:
                results.append(entry)
        print("ALL SMOGON sets: ", results)
        return results
    
     # Helper to Prolog recommendations.
     # Convert data to Prolog
    def add_team_to_prolog(self, team_data):
        """Dynamically add team facts to Prolog"""
        prolog.retractall("current_pokemon(_)")
        print("From here on are the Prolog facts:")
        
        for pokemon in team_data:
            # Pokemon name
            name = pokemon['name']
            print(name)
            prolog.assertz(f"current_pokemon('{name}')")
 
            # Base stats
            for stat_name, val in pokemon['stats'].items():
                prolog.assertz(f"base_stat('{name}', {stat_name}, {val})")

                print(f"base_stat({name}, {stat_name}, {val})")
                
            # Types
            for t in pokemon['types']:
                prolog.assertz(f"has_type('{name}', '{t}')")

                print(f"has_type({name}, '{t}')")
    
    def load_smogon_pool_into_prolog(self):
        prolog.retractall("smogon_pool(_,_,_)")

        entries = self.get_many_entries()
        for entry in entries:
            name = entry["name"]
            types = entry["types"]
            roles = entry["smogon_roles"]

            # Convert Python lists → Prolog lists
            types_list = "[" + ",".join([f"'{t}'" for t in types]) + "]"
            roles_list = "[" + ",".join([f"'{r}'" for r in roles]) + "]"

            prolog.assertz(f"smogon_pool('{name}', {types_list}, {roles_list})")
           
                
    # def prolog_analysis(self, team_data):
    #     """Use Prolog for intelligent recommendations"""
    #     # Convert team to Prolog facts
    #     self.add_team_to_prolog(team_data)
        
    #     # Query for recommendations
    #     recommendations = []
    #     query = "recommend_pokemon(CurrentTeam, Pokemon, Explanation)"
    #     for result in prolog.query(query):
    #         recommendations.append({
    #             'pokemon': result['Pokemon'],
    #             'explanation': result['Explanation']
    #             # 'confidence': 0.8  # Could be calculated
    #         })
    #     return recommendations

    def prolog_analysis(self, team_data):
        self.add_team_to_prolog(team_data)

        missing_types = [r["T"] for r in prolog.query("missing_type(T)")]
        missing_roles = [r["R"] for r in prolog.query("missing_role(R)")]

        recommendations = [
            {
                "pokemon": row["Poke"],
                "explanation": row["Explanation"]
            }
            for row in prolog.query("recommend_pokemon(CurrentTeam, Poke, Explanation)")
        ]

        return {
            "missing_types": missing_types,
            "missing_roles": missing_roles,
            "recommendations": recommendations
        }

    
    # def propositional_analysis(self, team_data):
    #     """Apply propositional logic rules to team"""
    #     # Rule: Team should have at least half the important type coverage
    #     important_types = ['fighting', 'ground', 'steel', 'fairy', 'fire', 'water']
    #     coverage = {}
        
    #     # look at team members, look at their types, see if they are covered.
    #     # so T/F values
    #     for p_type in important_types:
    #         coverage[p_type] = any(
    #             p_type in pokemon['types']
    #             for pokemon in team_data
    #         )
    #     # Ex: coverage["ice"] = True    
    #     # print(coverage)
    #     return {
    #         'type_coverage': coverage,
    #         # 1/6 +1/6 etc
    #         'score': sum(1 for covered in coverage.values() if covered) / len(important_types)
    #     }
      
    def analyze_team(self, team_data):
        """Comprehensive team analysis using multiple KR techniques"""
        analysis = {
            'Prolog analysis': self.prolog_analysis(team_data)
        }
        return analysis
    

@app.route('/api/analyze', methods=['POST'])
def analyze_team():
    """Main endpoint for team analysis"""
    data = request.json
    team_data = data.get('team', [])
    print(f"Payload: {team_data}")
    advisor = PokemonTeamAdvisor()
    
    advisor.get_many_entries()
    advisor.load_smogon_pool_into_prolog()
    
    # Perform comprehensive analysis 
    analysis = advisor.analyze_team(team_data)
    
    # Uses a pipeline that gens suggestion, calc coverage, calc roles, then jsonify
    # this uses analysis and no lambdas 
    return jsonify({
        'status': 'success',
        'analysis': analysis,
        'knowledge_representation_used': [
            'Propositional Logic (Type coverage)',
            'Logic Programming (Prolog rules)',
            'Planning (Role composition)',
            'Explanation Generation'
        ]
    })

# This suggest route uses Prolog. where does it get suggestions?
@app.route('/api/suggest', methods=['POST'])
def suggest_pokemon():
    """Get specific Pokémon suggestions"""
    data = request.json
    current_team = data.get('team', [])
    criteria = data.get('criteria', {})
    
    advisor = PokemonTeamAdvisor()
    
    # Use Prolog for intelligent suggestions
    suggestions = advisor.get_suggestions(current_team, criteria)
    
    return jsonify({
        'suggestions': suggestions,
        'reasoning_method': 'Prolog-based inference',
        'rules_applied': len(suggestions)
    })

@app.route('/api/test-pokemon/<name>', methods=['GET'])
def test_pokemon(name):
    """Test endpoint to check Pokémon data fetching"""
    advisor = PokemonTeamAdvisor()
    data = advisor.get_pokemon_data(name)
    if data:
        return jsonify({'status': 'success', 'pokemon': data})
    else:
        return jsonify({'status': 'error', 'message': f'Pokémon {name} not found'}), 404
   
@app.route('/test', methods=['GET'])
def test():
    return jsonify({
        'message': 'Pokémon Logic Engine is working!',
        'endpoints': {
            'test': 'GET /test',
            'analyze': 'POST /api/analyze',
            'suggest': 'POST /api/suggest',
            'test-pokemon': 'GET /api/test-pokemon/<name>'
        }
    })   
    
# Serve frontend
@app.route('/')
def serve_frontend():
    return send_from_directory('.', 'pokemon.html')


if __name__ == '__main__':
    print("\nTo use:")
    print("1. Open pokemon.html in browser")
    print("2. Add Pokémon to team")
    print("3. Click 'Get Intelligent Analysis' button")
    print("=" * 60)
    app.run(debug=True, port=5000)