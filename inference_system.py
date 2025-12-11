# Authors: Zhengyao Huang, Brian Phung

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import requests
import pandas as pd
import json
import os
import sys

app = Flask(__name__, static_folder='.')
CORS(app)

# Try to import Prolog, but have a fallback
PROLOG_AVAILABLE = False
prolog = None

try:
    from pyswip import Prolog
    # Wrap Prolog initialization in try-catch
    try:
        prolog = Prolog()
        # Try to consult the file
        if os.path.exists("team_rules.pl"):
            prolog.consult("team_rules.pl")
            PROLOG_AVAILABLE = True
            print("✓ Prolog loaded successfully")
        else:
            print("✗ team_rules.pl not found")
            prolog = None
    except Exception as prolog_error:
        print(f"✗ Prolog engine initialization failed: {prolog_error}")
        print("  This is usually a SWI-Prolog installation issue")
        prolog = None
        PROLOG_AVAILABLE = False
except ImportError:
    print("✗ PySwip not installed")
    print("  Running in fallback mode (without Prolog recommendations)")
    PROLOG_AVAILABLE = False
except Exception as e:
    print(f"✗ Prolog initialization failed: {e}")
    print("  Running in fallback mode (without Prolog recommendations)")
    PROLOG_AVAILABLE = False

# Load Smogon data
SMOGON_DATA = {}
VIABLE_POKEMON = set()

def load_smogon_data():
    """Load Smogon Gen9 OU data on startup"""
    global SMOGON_DATA, VIABLE_POKEMON
    try:
        print("Loading Smogon Gen9 OU data...")
        response = requests.get("https://pkmn.github.io/smogon/data/sets/gen9ou.json", timeout=10)
        if response.status_code == 200:
            SMOGON_DATA = response.json()
            VIABLE_POKEMON = set(SMOGON_DATA.keys())
            print(f"✓ Loaded {len(VIABLE_POKEMON)} viable Pokemon from Smogon Gen9 OU")
        else:
            print(f"✗ Failed to load Smogon data: {response.status_code}")
    except Exception as e:
        print(f"✗ Error loading Smogon data: {e}")
        print("  Continuing without Smogon filtering")

# Load on startup
load_smogon_data()


class PokemonTeamAdvisor:
    def __init__(self):
        self.pokeapi_base = "https://pokeapi.co/api/v2/"
    
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
    
    def add_team_to_prolog(self, team_data):
        """Dynamically add team facts to Prolog"""
        if not PROLOG_AVAILABLE or prolog is None:
            print("  Prolog not available, skipping")
            return False
            
        try:
            # Safely retract all facts
            try:
                prolog.retractall("current_pokemon(_)")
                prolog.retractall("has_type(_, _)")
                prolog.retractall("base_stat(_, _, _)")
                prolog.retractall("viable_pokemon(_)")
            except Exception as e:
                print(f"  Warning during retract: {e}")
                # Continue anyway, might still work
            
            print("Adding Prolog facts:")
            
            # Add viable Pokemon from Smogon
            for viable_name in list(VIABLE_POKEMON)[:100]:  # Limit to prevent overload
                try:
                    # Normalize the name for Prolog
                    safe_name = viable_name.lower().replace("'", "").replace("-", "")
                    prolog.assertz(f"viable_pokemon('{safe_name}')")
                except Exception as e:
                    print(f"  Warning: Could not add viable pokemon {viable_name}: {e}")
                    continue
            
            for pokemon in team_data:
                name = pokemon['name']
                print(f"  Pokemon: {name}")
                
                try:
                    # Assert Pokemon exists
                    prolog.assertz(f"current_pokemon('{name}')")
         
                    # Add base stats
                    for stat_name, val in pokemon['stats'].items():
                        prolog.assertz(f"base_stat('{name}', '{stat_name}', {val})")
                        print(f"    base_stat({name}, {stat_name}, {val})")
                        
                    # Add types
                    for t in pokemon['types']:
                        prolog.assertz(f"has_type('{name}', {t})")
                        print(f"    has_type({name}, {t})")
                except Exception as e:
                    print(f"  Warning: Could not add pokemon {name}: {e}")
                    continue
            
            return True
        except Exception as e:
            print(f"Error adding facts to Prolog: {e}")
            return False
                
    def prolog_recommendations(self, team_data):
        """Use Prolog for intelligent recommendations"""
        if not PROLOG_AVAILABLE or prolog is None:
            print("  Using fallback recommendations (Prolog unavailable)")
            return self.fallback_recommendations(team_data)
        
        try:
            success = self.add_team_to_prolog(team_data)
            if not success:
                print("  Failed to add team to Prolog, using fallback")
                return self.fallback_recommendations(team_data)
            
            recommendations = []
            
            # Query for recommendations with timeout protection
            try:
                query = "recommend_pokemon(Pokemon, Explanation)"
                print(f"  Querying Prolog: {query}")
                
                # Try to get results
                results = list(prolog.query(query))
                print(f"  Got {len(results)} results from Prolog")
                
                # Limit to top 5 recommendations
                for result in results[:5]:
                    recommendations.append({
                        'pokemon': result['Pokemon'],
                        'explanation': result['Explanation']
                    })
                    
            except Exception as query_error:
                print(f"  Prolog query failed: {query_error}")
                print("  Falling back to heuristic recommendations")
                return self.fallback_recommendations(team_data)
                
        except Exception as e:
            print(f"  Prolog recommendation error: {e}")
            return self.fallback_recommendations(team_data)
            
        # If no recommendations from Prolog, use fallback
        if not recommendations:
            print("  No Prolog recommendations, using fallback")
            return self.fallback_recommendations(team_data)
            
        return recommendations
    
    def fallback_recommendations(self, team_data):
        """Fallback recommendations when Prolog is not available"""
        recommendations = []
        
        # Get current types
        current_types = set()
        for pokemon in team_data:
            current_types.update(pokemon['types'])
        
        # Important types to have
        important_types = ['fighting', 'ground', 'steel', 'fairy', 'fire', 'water', 'ice', 'dragon']
        missing_types = [t for t in important_types if t not in current_types]
        
        # Suggest Pokemon for missing types
        type_suggestions = {
            'fighting': ('machamp', 'Provides strong Fighting-type coverage'),
            'ground': ('garchomp', 'Excellent Ground-type attacker with great stats'),
            'steel': ('ferrothorn', 'Provides Steel-type coverage and defensive utility'),
            'fairy': ('clefable', 'Fairy-type with excellent defensive capabilities'),
            'fire': ('volcarona', 'Powerful Fire/Bug special attacker'),
            'water': ('toxapex', 'Water/Poison wall with excellent defense'),
            'ice': ('weavile', 'Fast Ice/Dark physical attacker'),
            'dragon': ('dragapult', 'Fast Dragon/Ghost special attacker')
        }
        
        for missing_type in missing_types[:3]:  # Top 3 missing
            if missing_type in type_suggestions:
                pokemon, explanation = type_suggestions[missing_type]
                recommendations.append({
                    'pokemon': pokemon,
                    'explanation': f'{explanation} (Missing {missing_type}-type coverage)'
                })
        
        # Check for role balance
        roles = self.identify_roles(team_data)
        if roles.get('wall', 0) == 0:
            recommendations.append({
                'pokemon': 'toxapex',
                'explanation': 'Team needs a defensive wall for balance'
            })
        
        if roles.get('physical_sweeper', 0) == 0:
            recommendations.append({
                'pokemon': 'garchomp',
                'explanation': 'Team needs a physical sweeper for offensive pressure'
            })
        
        return recommendations[:5]  # Return top 5
    
    def propositional_analysis(self, team_data):
        """Apply propositional logic rules to team"""
        important_types = ['fighting', 'ground', 'steel', 'fairy', 'fire', 'water', 'ice', 'dragon']
        coverage = {}
        
        for p_type in important_types:
            coverage[p_type] = any(
                p_type in pokemon['types']
                for pokemon in team_data
            )
        
        return {
            'type_coverage': coverage,
            'score': sum(1 for covered in coverage.values() if covered) / len(important_types)
        }
      
    def role_planning(self, team_data):
        """PDDL-like planning for team roles"""
        required_roles = {
            'physical_sweeper': 1,
            'special_sweeper': 1,
            'wall': 1,
            'tank': 1
        }
        
        current_roles = self.identify_roles(team_data)
        missing_roles = {}
        
        for role, count in required_roles.items():
            current = current_roles.get(role, 0)
            if current < count:
                missing_roles[role] = count - current
        
        return {
            'current_roles': current_roles,
            'missing_roles': missing_roles,
            'plan': f"Consider adding: {', '.join(missing_roles.keys())}" if missing_roles else "Team composition is balanced!"
        }
    
    def identify_roles(self, team_data):
        """Identify roles of current team members"""
        roles = {
            'physical_sweeper': 0,
            'special_sweeper': 0,
            'wall': 0,
            'tank': 0
        }
        
        for pokemon in team_data:
            stats = pokemon['stats']
            
            # Physical sweeper: High Attack + Speed
            if stats.get('attack', 0) >= 100 and stats.get('speed', 0) >= 80:
                roles['physical_sweeper'] += 1
            
            # Special sweeper: High Sp. Atk + Speed
            if stats.get('special-attack', 0) >= 100 and stats.get('speed', 0) >= 80:
                roles['special_sweeper'] += 1
            
            # Wall: High defensive stats
            if (stats.get('hp', 0) >= 80 and 
                stats.get('defense', 0) >= 80 and 
                stats.get('special-defense', 0) >= 80):
                roles['wall'] += 1
            
            # Tank: High HP
            if stats.get('hp', 0) >= 90:
                roles['tank'] += 1
        
        return roles
    
    def calculate_weaknesses(self, team_data):
        """Calculate major type weaknesses"""
        weakness_count = {}
        
        # Simplified type weaknesses
        type_weaknesses = {
            'grass': ['fire', 'ice', 'flying', 'bug', 'poison'],
            'water': ['electric', 'grass'],
            'fire': ['water', 'ground', 'rock'],
            'electric': ['ground'],
            'ground': ['water', 'grass', 'ice'],
            'rock': ['water', 'grass', 'fighting', 'ground', 'steel'],
            'flying': ['electric', 'ice', 'rock'],
            'psychic': ['bug', 'ghost', 'dark'],
            'bug': ['fire', 'flying', 'rock'],
            'dragon': ['ice', 'dragon', 'fairy'],
            'dark': ['fighting', 'bug', 'fairy'],
            'steel': ['fire', 'fighting', 'ground'],
            'fairy': ['poison', 'steel'],
            'fighting': ['flying', 'psychic', 'fairy'],
            'poison': ['ground', 'psychic'],
            'ghost': ['ghost', 'dark'],
            'ice': ['fire', 'fighting', 'rock', 'steel'],
            'normal': ['fighting']
        }
        
        for pokemon in team_data:
            for ptype in pokemon['types']:
                if ptype in type_weaknesses:
                    for weak in type_weaknesses[ptype]:
                        weakness_count[weak] = weakness_count.get(weak, 0) + 1
        
        sorted_weaknesses = sorted(weakness_count.items(), key=lambda x: x[1], reverse=True)
        return [w[0] for w in sorted_weaknesses[:3]]
    
    def calculate_strengths(self, team_data):
        """Calculate team's offensive strengths"""
        type_count = {}
        for pokemon in team_data:
            for ptype in pokemon['types']:
                type_count[ptype] = type_count.get(ptype, 0) + 1
        
        sorted_types = sorted(type_count.items(), key=lambda x: x[1], reverse=True)
        return [t[0] for t in sorted_types[:3]]
    
    def generate_explanation(self, team_data, analysis):
        """Generate natural language explanation of reasoning"""
        weaknesses = self.calculate_weaknesses(team_data)
        strengths = self.calculate_strengths(team_data)
        
        coverage_score = analysis['propositional_logic']['score'] * 100
        missing_roles = analysis['planning']['missing_roles']
        
        prolog_status = "✓ Active" if PROLOG_AVAILABLE else "✗ Fallback mode (install SWI-Prolog for full functionality)"
        
        explanation = f"""Team Analysis Summary:

Type Coverage: {coverage_score:.0f}% of important types covered
- Team Strengths: {', '.join(strengths) if strengths else 'Balanced coverage'}
- Major Weaknesses: {', '.join(weaknesses) if weaknesses else 'No major weaknesses'}

Role Composition:
- Current roles: {', '.join(f"{k.replace('_', ' ')}({v})" for k,v in analysis['planning']['current_roles'].items() if v > 0)}
- Missing roles: {', '.join(k.replace('_', ' ') for k in missing_roles.keys()) if missing_roles else 'Complete'}

Reasoning Methods Applied:
1. Propositional Logic: Analyzed type coverage against important offensive types
2. Logic Programming {prolog_status}
3. Planning: Evaluated role distribution (sweepers, walls, tanks)
4. Explanation Generation: Synthesized multi-layered analysis

Recommendations prioritized by:
- Type coverage gaps (highest priority)
- Defensive synergy
- Role composition balance
"""
        
        return explanation
    
    def analyze_team(self, team_data):
        """Comprehensive team analysis using multiple KR techniques"""
        prop_analysis = self.propositional_analysis(team_data)
        prolog_recs = self.prolog_recommendations(team_data)
        planning = self.role_planning(team_data)
        
        analysis = {
            'propositional_logic': prop_analysis,
            'logic_programming': prolog_recs,
            'planning': planning,
        }
        
        analysis['explanation'] = self.generate_explanation(team_data, analysis)
        
        return analysis
    

@app.route('/api/analyze', methods=['POST'])
def analyze_team():
    """Main endpoint for team analysis"""
    data = request.json
    team_data = data.get('team', [])
    print(f"Received team with {len(team_data)} Pokemon")
    
    if len(team_data) == 0:
        return jsonify({
            'status': 'error',
            'message': 'No Pokemon provided'
        }), 400
    
    advisor = PokemonTeamAdvisor()
    
    try:
        analysis = advisor.analyze_team(team_data)
        
        kr_methods = [
            'Propositional Logic (Type coverage)',
            'Planning (Role composition)',
            'Explanation Generation'
        ]
        
        if PROLOG_AVAILABLE:
            kr_methods.insert(1, 'Logic Programming (Prolog rules)')
        else:
            kr_methods.insert(1, 'Heuristic Recommendations (Prolog unavailable)')
        
        return jsonify({
            'status': 'success',
            'analysis': analysis,
            'knowledge_representation_used': kr_methods,
            'prolog_available': PROLOG_AVAILABLE
        })
    except Exception as e:
        print(f"Analysis error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

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
        'prolog_available': PROLOG_AVAILABLE,
        'endpoints': {
            'test': 'GET /test',
            'analyze': 'POST /api/analyze',
            'test-pokemon': 'GET /api/test-pokemon/<name>'
        }
    })   
    
@app.route('/')
def serve_frontend():
    return send_from_directory('.', 'pokemon.html')

@app.route('/<path:path>')
def serve_static(path):
    """Serve static files (CSS, JS)"""
    return send_from_directory('.', path)


if __name__ == '__main__':
    print("=" * 60)
    print("Pokémon Team Builder - Knowledge Representation System")
    print("=" * 60)
    print(f"\nProlog Status: {'✓ Available' if PROLOG_AVAILABLE else '✗ Unavailable (using fallback)'}")
    if not PROLOG_AVAILABLE:
        print("\nTo enable Prolog features:")
        print("1. Install SWI-Prolog from: https://www.swi-prolog.org/download/stable")
        print("2. Make sure it's added to your PATH")
        print("3. Restart this script")
    print("\nTo use:")
    print("1. Open http://127.0.0.1:5000 in browser")
    print("2. Add Pokémon to team")
    print("3. Click 'Get Prolog Analysis' button")
    print("=" * 60)
    app.run(debug=True, port=5000, host='127.0.0.1')