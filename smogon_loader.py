import requests
import json

class SmogonDataLoader:
    def __init__(self):
        self.smogon_url = "https://pkmn.github.io/smogon/data/sets/gen9ou.json"
        self.smogon_sets = {}
        self.viable_pokemon = set()
        
    def load_smogon_data(self):
        """Load Smogon Gen9 OU competitive sets"""
        try:
            print("Loading Smogon Gen9 OU data...")
            response = requests.get(self.smogon_url)
            if response.status_code == 200:
                self.smogon_sets = response.json()
                self.viable_pokemon = set(self.smogon_sets.keys())
                print(f"✓ Loaded {len(self.viable_pokemon)} viable Pokemon from Smogon Gen9 OU")
                return True
            else:
                print(f"✗ Failed to load Smogon data: {response.status_code}")
                return False
        except Exception as e:
            print(f"✗ Error loading Smogon data: {e}")
            return False
    
    def is_viable(self, pokemon_name):
        """Check if a Pokemon is in Gen9 OU"""
        # Normalize name (Smogon uses different formatting)
        normalized = pokemon_name.lower().replace('-', '').replace(' ', '')
        
        for smogon_name in self.viable_pokemon:
            if normalized in smogon_name.lower().replace('-', ''):
                return True
        return False
    
    def get_pokemon_roles(self, pokemon_name):
        """Get roles for a specific Pokemon from Smogon sets"""
        roles = set()
        
        if pokemon_name in self.smogon_sets:
            sets = self.smogon_sets[pokemon_name]
            
            for set_name, set_data in sets.items():
                set_lower = set_name.lower()
                
                # Identify roles from set names
                if any(x in set_lower for x in ['offensive', 'sweeper', 'attacker', 'wallbreaker']):
                    roles.add('sweeper')
                if any(x in set_lower for x in ['defensive', 'wall', 'tank', 'support']):
                    roles.add('wall')
                if any(x in set_lower for x in ['pivot', 'utility', 'cleric']):
                    roles.add('support')
                if any(x in set_lower for x in ['setup', 'dd', 'swords dance', 'nasty plot']):
                    roles.add('setup_sweeper')
                if any(x in set_lower for x in ['choice', 'scarf', 'band', 'specs']):
                    roles.add('revenge_killer')
        
        return list(roles) if roles else ['balanced']
    
    def get_viable_recommendations(self, missing_types=None, missing_roles=None):
        """Get Pokemon recommendations from Smogon OU that fit criteria"""
        recommendations = []
        
        for pokemon_name in self.viable_pokemon:
            # This would need Pokemon type data - integrate with your PokeAPI calls
            # For now, just return viable Pokemon names
            recommendations.append(pokemon_name)
        
        return recommendations[:10]  # Return top 10
    
    def get_pokemon_set_info(self, pokemon_name):
        """Get detailed set information for a Pokemon"""
        if pokemon_name not in self.smogon_sets:
            return None
        
        sets = self.smogon_sets[pokemon_name]
        set_info = {
            'name': pokemon_name,
            'num_sets': len(sets),
            'roles': self.get_pokemon_roles(pokemon_name),
            'sets': {}
        }
        
        for set_name, set_data in sets.items():
            set_info['sets'][set_name] = {
                'item': set_data.get('item'),
                'ability': set_data.get('ability'),
                'nature': set_data.get('nature'),
                'evs': set_data.get('evs'),
                'moves': set_data.get('moves', [])
            }
        
        return set_info