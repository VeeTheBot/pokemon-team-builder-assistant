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
        # self.smogon_data = self.load_smogon_data()
    
    # API data: Consider loading immediately or JSON on hand
    def get_pokemon_data(self, name):
        """Fetch Pokémon data from PokeAPI"""
        try:
            response = requests.get(f"{self.pokeapi_base}pokemon/{name.lower()}")
            if response.status_code == 200:
                print("Success!")
                data = response.json()
                return {
                    'name': data['name'],
                    'types': [t['type']['name'] for t in data['types']],
                    'stats': {s['stat']['name']: s['base_stat'] for s in data['stats']}
                }
        except:
            pass
        return None
    
    
    # def load_smogon_data(self):
    #     """Load competitive Pokémon data from Smogon CSV/JSON"""
    #     try:
    #         # Example: Load Smogon usage stats
    #         df = pd.read_csv('smogon_usage_stats.csv')
    #         return df.to_dict('records')
    #     except:
    #         # Fallback: Use curated competitive knowledge
    #         return {
    #             'metagame_roles': {
    #                 'toxapex': ['wall', 'hazard_setter'],
    #                 'dragapult': ['special_sweeper', 'physical_sweeper'],
    #                 'ferrothorn': ['wall', 'hazard_setter'],
    #                 # ... more competitive knowledge
    #             },
    #             'viable_pokemon': ['clefable', 'heatran', 'landorus-therian', 'rillaboom']
    #         }
    
    
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
                prolog.assertz(f"has_type('{name}', {t})")

                print(f"has_type({name}, {t})")
                
                
    def prolog_recommendations(self, team_data):
        """Use Prolog for intelligent recommendations"""
        # Convert team to Prolog facts
        self.add_team_to_prolog(team_data)
        
        # Query for recommendations
        recommendations = []
        query = "recommend_pokemon(CurrentTeam, Pokemon, Explanation)"
        for result in prolog.query(query):
            recommendations.append({
                'pokemon': result['Pokemon'],
                'explanation': result['Explanation']
                # 'confidence': 0.8  # Could be calculated
            })
        return recommendations
    
    
    def propositional_analysis(self, team_data):
        """Apply propositional logic rules to team"""
        # Rule: Team should have at least half the important type coverage
        important_types = ['fighting', 'ground', 'steel', 'fairy', 'fire', 'water']
        coverage = {}
        
        # look at team members, look at their types, see if they are covered.
        # so T/F values
        for p_type in important_types:
            coverage[p_type] = any(
                p_type in pokemon['types']
                for pokemon in team_data
            )
        # Ex: coverage["ice"] = True    
        # print(coverage)
        return {
            'type_coverage': coverage,
            # 1/6 +1/6 etc
            'score': sum(1 for covered in coverage.values() if covered) / len(important_types)
        }
      
    # def role_planning(self, team_data):
    #     """PDDL-like planning for team roles"""
    #     required_roles = {
    #         'sweeper': 2,
    #         'wall': 2,
    #         'support': 1,
    #         'revenge_killer': 1
    #     }
        
    #    # Simple planning: count current roles, suggest missing ones
    #     current_roles = self.identify_roles(team_data)
    #     missing_roles = {}
        
    #     for role, count in required_roles.items():
    #         current = current_roles.get(role, 0)
    #         if current < count:
    #             missing_roles[role] = count - current
        
    #     return {
    #         'current_roles': current_roles,
    #         'missing_roles': missing_roles,
    #         'plan': f"Add {missing_roles} to complete team composition"
    #     }
    
    # def generate_explanation(self, team_data):
    #     """Generate natural language explanation of reasoning"""
    #     weaknesses = self.calculate_weaknesses(team_data)
    #     strengths = self.calculate_strengths(team_data)
        
    #     explanation = f"""
    #     Based on competitive Pokémon knowledge:
        
    #     Your team has {len(weaknesses)} major weaknesses: {', '.join(weaknesses[:3])}
    #     Your team's strengths include: {', '.join(strengths[:3])}
        
    #     Recommendation logic applied:
    #     1. Type coverage analysis (Propositional Logic)
    #     2. Defensive synergy checking (Logic Programming)
    #     3. Role composition planning (Planning Concepts)
    #     4. Competitive viability (Ontology-based reasoning)
    #     """
        
    #     return explanation
    
    def analyze_team(self, team_data):
        """Comprehensive team analysis using multiple KR techniques"""
        analysis = {
            'propositional_logic': self.propositional_analysis(team_data),
            'logic_programming': self.prolog_recommendations(team_data),
            # 'planning': self.role_planning(team_data),
            # 'explanation': self.generate_explanation(team_data)
        }
        return analysis
    

@app.route('/api/analyze', methods=['POST'])
def analyze_team():
    """Main endpoint for team analysis"""
    data = request.json
    team_data = data.get('team', [])
    print(f"Payload: {team_data}")
    advisor = PokemonTeamAdvisor()
    
    
    """API: Fetch detailed data for each Pokémon"""
    # team_data = []
    # for name in team_names:
    #     print(name)
    #     pokemon_data = advisor.get_pokemon_data(name)
    #     if pokemon_data:
    #         team_data.append(pokemon_data)
    
    # Perform comprehensive analysis (combined 4 functions)
    # other file uses .py rules and puts in recommendations, team_data
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