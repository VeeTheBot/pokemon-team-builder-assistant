from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import requests
import json
import os
import sys
import subprocess

app = Flask(__name__, static_folder='.')
CORS(app)

# Try to import Prolog, but have a fallback
PROLOG_AVAILABLE = False
prolog = None

print("=" * 60)
print("Attempting to load Prolog...")
print("=" * 60)

def test_swipl_installation():
    """Test if SWI-Prolog is properly installed and accessible"""
    try:
        result = subprocess.run(['swipl', '--version'], 
                              capture_output=True, text=True, timeout=5)
        if result.returncode == 0:
            print(f"✓ SWI-Prolog found: {result.stdout.strip()}")
            return True
        else:
            print("✗ SWI-Prolog not responding correctly")
            return False
    except FileNotFoundError:
        print("✗ SWI-Prolog not found in PATH")
        return False
    except Exception as e:
        print(f"✗ Error checking SWI-Prolog: {e}")
        return False

# First check if SWI-Prolog is installed
swipl_ok = test_swipl_installation()

if swipl_ok:
    try:
        from pyswip import Prolog
        print("✓ PySwip module imported")
        
        # Wrap Prolog initialization in try-catch
        try:
            prolog = Prolog()
            print("✓ Prolog engine initialized")
            
            # Try to consult the file
            if os.path.exists("team_rules.pl"):
                # Use a simpler consult approach
                prolog.consult("team_rules.pl")
                
                # Test with a simple query to make sure it's working
                test_result = list(prolog.query("important_coverage_type(X)"))
                if len(test_result) > 0:
                    PROLOG_AVAILABLE = True
                    print("✓ Prolog knowledge base loaded and tested successfully!")
                else:
                    print("✗ Prolog loaded but queries not working")
                    prolog = None
            else:
                print("✗ team_rules.pl not found")
                prolog = None
        except Exception as prolog_error:
            print(f"✗ Prolog engine error: {prolog_error}")
            print("  Falling back to non-Prolog mode")
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
else:
    print("  Skipping PySwip since SWI-Prolog is not available")
    PROLOG_AVAILABLE = False

print("=" * 60)

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


def normalize_pokemon_name(name):
    """Normalize Pokemon name for Prolog (lowercase, no special chars)"""
    return name.lower().replace("'", "").replace("-", "_").replace(" ", "_").replace(".", "")


def normalize_type_name(type_name):
    """Normalize type name for Prolog"""
    return type_name.lower().replace("-", "_")


def safe_prolog_query(query_str):
    """Safely execute a Prolog query with error handling"""
    global prolog, PROLOG_AVAILABLE
    
    if not PROLOG_AVAILABLE or prolog is None:
        return None
    
    try:
        result = list(prolog.query(query_str))
        return result
    except Exception as e:
        print(f"  Prolog query error: {e}")
        return None


def safe_prolog_assert(fact_str):
    """Safely assert a Prolog fact with error handling"""
    global prolog, PROLOG_AVAILABLE
    
    if not PROLOG_AVAILABLE or prolog is None:
        return False
    
    try:
        list(prolog.query(f"assertz({fact_str})"))
        return True
    except Exception as e:
        print(f"  Prolog assert error for '{fact_str}': {e}")
        return False


def safe_prolog_retractall(pattern):
    """Safely retract all matching Prolog facts"""
    global prolog, PROLOG_AVAILABLE
    
    if not PROLOG_AVAILABLE or prolog is None:
        return False
    
    try:
        list(prolog.query(f"retractall({pattern})"))
        return True
    except Exception as e:
        print(f"  Prolog retractall error for '{pattern}': {e}")
        return False


class PokemonTeamAdvisor:
    def __init__(self):
        self.pokeapi_base = "https://pokeapi.co/api/v2/"
    
    def get_pokemon_data(self, name):
        """Fetch Pokémon data from PokeAPI"""
        try:
            response = requests.get(f"{self.pokeapi_base}pokemon/{name.lower()}")
            if response.status_code == 200:
                data = response.json()
                return {
                    'name': data['name'],
                    'types': [t['type']['name'] for t in data['types']],
                    'stats': {s['stat']['name']: s['base_stat'] for s in data['stats']}
                }
        except Exception as e:
            print(f"  ✗ Error fetching {name}: {e}")
        return None
    
    def add_team_to_prolog(self, team_data):
        """Dynamically add team facts to Prolog"""
        if not PROLOG_AVAILABLE or prolog is None:
            print("  Prolog not available, skipping")
            return False
            
        try:
            # Safely retract all dynamic facts
            print("Clearing previous Prolog facts...")
            safe_prolog_retractall("current_pokemon(_)")
            safe_prolog_retractall("has_type(_, _)")
            safe_prolog_retractall("base_stat(_, _, _)")
            
            print("Adding Prolog facts:")
            
            # Add current team Pokemon
            for pokemon in team_data:
                name = normalize_pokemon_name(pokemon['name'])
                print(f"  Adding: {name}")
                
                # Assert Pokemon exists on current team
                if not safe_prolog_assert(f"current_pokemon({name})"):
                    continue
     
                # Add base stats
                for stat_name, val in pokemon['stats'].items():
                    safe_stat = normalize_type_name(stat_name)
                    safe_prolog_assert(f"base_stat({name}, '{safe_stat}', {val})")
                    
                # Add types
                for t in pokemon['types']:
                    safe_type = normalize_type_name(t)
                    if safe_prolog_assert(f"has_type({name}, {safe_type})"):
                        print(f"    has_type({name}, {safe_type})")
            
            print("✓ Facts added to Prolog")
            return True
            
        except Exception as e:
            print(f"Error adding facts to Prolog: {e}")
            return False
    
    def test_prolog_queries(self):
        """Test basic Prolog queries to verify facts are loaded"""
        if not PROLOG_AVAILABLE or prolog is None:
            return
            
        print("\n--- Prolog Debug Queries ---")
        
        # Test current_pokemon
        results = safe_prolog_query("current_pokemon(X)")
        if results:
            print(f"current_pokemon(X): {[r['X'] for r in results]}")
        
        # Test has_type
        results = safe_prolog_query("has_type(X, Y)")
        if results:
            print(f"has_type(X, Y): {[(r['X'], r['Y']) for r in results[:10]]}")
        
        # Test team_covers_type
        results = safe_prolog_query("team_covers_type(X)")
        if results:
            print(f"team_covers_type(X): {[r['X'] for r in results]}")
        
        # Test needs_offensive_coverage
        results = safe_prolog_query("needs_offensive_coverage(X)")
        if results:
            print(f"needs_offensive_coverage(X): {[r['X'] for r in results]}")
        
        print("--- End Debug ---\n")
                
    def prolog_recommendations(self, team_data):
        """Use Prolog for intelligent recommendations"""
        if not PROLOG_AVAILABLE or prolog is None:
            print("  Using fallback recommendations (Prolog unavailable)")
            return self.fallback_recommendations(team_data)
        
        try:
            print("Attempting Prolog query...")
            success = self.add_team_to_prolog(team_data)
            if not success:
                print("  Failed to add team to Prolog, using fallback")
                return self.fallback_recommendations(team_data)
            
            # Debug: test queries
            self.test_prolog_queries()
            
            recommendations = []
            
            # Query for recommendations
            query = "recommend_pokemon(Pokemon, Explanation)"
            print(f"Query: {query}")
            
            results = safe_prolog_query(query)
            
            if results is None:
                print("  Prolog query failed, using fallback")
                return self.fallback_recommendations(team_data)
            
            print(f"Got {len(results)} results from Prolog")
            
            # Process results (limit to top 5)
            seen_pokemon = set()
            for result in results:
                pokemon_name = str(result['Pokemon'])
                if pokemon_name not in seen_pokemon:
                    seen_pokemon.add(pokemon_name)
                    explanation = str(result['Explanation'])
                    recommendations.append({
                        'pokemon': pokemon_name,
                        'explanation': explanation
                    })
                    print(f"  Recommendation: {pokemon_name} - {explanation}")
                    if len(recommendations) >= 5:
                        break
                
        except Exception as e:
            print(f"  Prolog recommendation error: {e}")
            return self.fallback_recommendations(team_data)
            
        # If no recommendations from Prolog, use fallback
        if not recommendations:
            print("No Prolog results, using fallback")
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
        
        # Suggest Pokemon for missing types (using Gen9 OU viable Pokemon)
        type_suggestions = {
            'fighting': ('great_tusk', 'Provides missing Fighting-type coverage (Gen9 OU)'),
            'ground': ('garchomp', 'Provides missing Ground-type coverage (Gen9 OU)'),
            'steel': ('kingambit', 'Provides missing Steel-type coverage (Gen9 OU)'),
            'fairy': ('iron_valiant', 'Provides missing Fairy-type coverage (Gen9 OU)'),
            'fire': ('chi_yu', 'Provides missing Fire-type coverage (Gen9 OU)'),
            'water': ('palafin', 'Provides missing Water-type coverage (Gen9 OU)'),
            'ice': ('chien_pao', 'Provides missing Ice-type coverage (Gen9 OU)'),
            'dragon': ('dragapult', 'Provides missing Dragon-type coverage (Gen9 OU)')
        }
        
        for missing_type in missing_types[:5]:
            if missing_type in type_suggestions:
                name, reason = type_suggestions[missing_type]
                recommendations.append({
                    'pokemon': name,
                    'explanation': reason
                })
        
        return recommendations
    
    def propositional_analysis(self, team_data):
        """Propositional logic for type coverage analysis"""
        important_types = ['fighting', 'ground', 'steel', 'fairy', 'fire', 'water', 'ice', 'dragon']
        
        covered_types = set()
        for pokemon in team_data:
            covered_types.update(pokemon['types'])
        
        type_coverage = {}
        for imp_type in important_types:
            type_coverage[imp_type] = imp_type in covered_types
        
        coverage_score = sum(type_coverage.values()) / len(important_types)
        
        return {
            'type_coverage': type_coverage,
            'score': coverage_score
        }
    
    def role_planning(self, team_data):
        """Analyze team roles"""
        roles = self.calculate_roles(team_data)
        
        required_roles = {
            'physical_sweeper': 1,
            'special_sweeper': 1,
            'wall': 1
        }
        
        missing_roles = {}
        for role, required in required_roles.items():
            current = roles.get(role, 0)
            if current < required:
                missing_roles[role] = required - current
        
        return {
            'current_roles': roles,
            'missing_roles': missing_roles
        }
    
    def calculate_roles(self, team_data):
        """Calculate role distribution of team"""
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
        
        prolog_status = "✓ Active" if PROLOG_AVAILABLE else "✗ Fallback mode (Prolog unavailable)"
        
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
    print(f"\n{'='*60}")
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
        print("3. Install PySwip: pip install pyswip")
        print("4. Restart your computer")
        print("5. Run this script again")
    print("\nTo use:")
    print("1. Open http://127.0.0.1:5000 in browser")
    print("2. Add Pokémon to team")
    print("3. Click 'Get Prolog Analysis' button")
    print("=" * 60)
    
    # Run without debug mode to avoid reloader issues with Prolog
    app.run(debug=False, port=5000, host='127.0.0.1')