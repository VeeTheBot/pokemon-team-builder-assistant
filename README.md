# 🎮 Pokémon Team Builder Assistant

A competitive Pokémon team building assistant that uses **Prolog logic programming** to analyze team composition and provide intelligent recommendations based on Smogon Gen9 OU meta.

![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)
![Prolog](https://img.shields.io/badge/SWI--Prolog-9.2.x-orange.svg)
![Flask](https://img.shields.io/badge/Flask-3.0-green.svg)

Created for CPSC 583 F25.

### Authors:
* Manhattan Calabro
* Brian Phung
* Zhengyao Huang

---

## ✨ Features

- **Type Coverage Analysis** - Identifies missing offensive types on your team
- **Role Detection** - Analyzes team roles (sweepers, walls, tanks)
- **Prolog-Powered Recommendations** - Uses logic programming for intelligent suggestions
- **Smogon Gen9 OU Data** - Recommendations based on competitive viability
- **Real-time Team Analysis** - Instant feedback as you build your team

## 🧠 Knowledge Representation Methods

This project demonstrates multiple AI/KR techniques:

1. **Logic Programming (Prolog)** - Rule-based reasoning for recommendations
2. **Propositional Logic** - Type coverage analysis
3. **Planning** - Team role composition
4. **Explanation Generation** - Natural language reasoning output

---

## 🚀 Quick Start (For Teammates)

### Minimum Requirements (App will work in fallback mode)
- **Python 3.8+** - [Download here](https://www.python.org/downloads/)
  - ⚠️ During installation, CHECK **"Add Python to PATH"**

### For Full Prolog Features (Optional)
- **SWI-Prolog 9.2.x** (NOT version 10.x!)
  - [Download 9.2.4 here](https://www.swi-prolog.org/download/stable/bin/)
  - ⚠️ During installation, CHECK **"Add to PATH"**
  - ⚠️ **Restart your computer** after installation

### Run the App
1. Double-click `start.bat`
2. Browser opens automatically to http://127.0.0.1:5000
3. Build your team!

---

## 📥 Manual Installation

### Step 1: Install Python
1. Download from https://www.python.org/downloads/
2. ✅ CHECK **"Add Python to PATH"** during installation
3. Restart your computer

### Step 2: Install SWI-Prolog (Optional, for Prolog features)

#### Windows
1. Download **SWI-Prolog 9.2.4** (NOT 10.x!) from: https://www.swi-prolog.org/download/stable/bin/
2. Run the installer
   - ✅ Check **"Add to PATH"**
3. **Restart your computer**

#### macOS
```bash
brew install swi-prolog
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt-add-repository ppa:swi-prolog/stable
sudo apt-get update
sudo apt-get install swi-prolog
```

### Step 3: Install Python Dependencies
```bash
pip install -r requirements.txt
```

Or install manually:
```bash
pip install flask flask-cors requests pyswip==0.3.3
```

### Step 4: Run the Application
```bash
python inference_system.py
```

Then open http://127.0.0.1:5000 in your browser.

---

## 🎯 Usage

1. **Add Pokémon** - Type a Pokémon name and click "Search" (or press Enter)
2. **Build Your Team** - Add up to 6 Pokémon
3. **Get Analysis** - Click "Get Prolog Analysis" button
4. **View Recommendations** - See intelligent suggestions based on your team

### Keyboard Shortcuts
- **Enter** - Search for Pokémon / Select autocomplete suggestion
- **Arrow Up/Down** - Navigate autocomplete suggestions
- **Middle Click** - Select autocomplete suggestion
- **Escape** - Close autocomplete dropdown

---

## 📁 Project Structure

```
pokemon-team-builder-assistant/
├── inference_system.py    # Main Flask server + Prolog integration
├── team_rules.pl          # Prolog knowledge base
├── pokemon.html           # Frontend HTML
├── pokemon.js             # Frontend JavaScript
├── pokemon.css            # Styling
├── types.js               # Type effectiveness data
├── warning_popup.js       # Delete confirmation popup
├── warning_popup.css      # Popup styling
├── smogon_loader.py       # Smogon data loader
├── requirements.txt       # Python dependencies
├── start.bat              # Windows launcher
└── README.md              # This file
```

---

## ⚠️ Troubleshooting

### "Python was not found"
**Solution:**
1. Install Python from https://www.python.org/downloads/
2. ✅ CHECK **"Add Python to PATH"** during installation
3. Restart your computer
4. If still not working: 
   - Go to **Settings > Apps > Advanced app settings > App execution aliases**
   - Turn OFF the "python.exe" and "python3.exe" aliases

### "Assertion failed" crash with Prolog
**Cause:** You have SWI-Prolog version 10.x installed (incompatible with PySwip)

**Solution:**
1. Uninstall SWI-Prolog 10.x
2. Install SWI-Prolog **9.2.4** from: https://www.swi-prolog.org/download/stable/bin/
3. Restart your computer

### Check SWI-Prolog Version
```bash
swipl --version
```
- If it shows **10.x.x** → Need to downgrade to 9.2.4
- If it shows **9.x.x** → Compatible ✅

### App works but no Prolog recommendations
This is normal - the app works in **fallback mode** without Prolog. To enable Prolog:
1. Install SWI-Prolog 9.2.x (see above)
2. Install PySwip: `pip install pyswip==0.3.3`
3. Restart your computer

### Backend not responding during screen recording
Replace `inference_system.py` with the latest version that includes `threaded=True` for better performance.

### "Could not find system resources" error
Set the environment variable:
```bash
# Windows (in Command Prompt)
set SWI_HOME_DIR=C:\Program Files\swipl

# Then run the app
python inference_system.py
```

---

## 🧪 Testing Prolog Directly

You can test Prolog directly in the terminal:
```bash
swipl
?- consult('team_rules.pl').
?- important_coverage_type(X).
```

Expected output:
```
X = fighting ;
X = ground ;
X = steel ;
...
```

---

## 📊 How It Works

### Prolog Knowledge Base (`team_rules.pl`)

The Prolog file contains:
- **Type effectiveness rules** - Super effective, resistances, immunities
- **Role definitions** - What makes a sweeper, wall, tank
- **Recommendation logic** - Rules for suggesting Pokémon
- **Static Pokémon data** - Types and stats for Gen9 OU Pokemon

### Recommendation Priority
1. **Missing Type Coverage** - Suggests Pokémon that cover missing types
2. **Missing Roles** - Fills team composition gaps
3. **General Synergy** - Strong competitive picks

### Analysis Components
- **Team Strength Score** - 0-100 rating based on coverage, roles, stats
- **Type Coverage** - Which important types your team has/needs
- **Weaknesses/Resistances** - Defensive analysis
- **Role Composition** - Sweepers, walls, tanks distribution

---

## 📝 Version Compatibility

| Component | Tested Version | Notes |
|-----------|---------------|-------|
| Python | 3.10, 3.11, 3.12 | 3.8+ should work |
| SWI-Prolog | 9.2.4 | ⚠️ 10.x NOT compatible |
| PySwip | 0.3.3 | Use this version with Prolog 9.x |
| Flask | 3.0+ | |
| Windows | 10, 11 | |
| macOS | Monterey+ | |
| Linux | Ubuntu 22.04+ | |

---

## 🐛 Known Issues

1. **SWI-Prolog 10.x incompatibility** - PySwip crashes with Prolog 10.x, use 9.2.x
2. **First load delay** - Smogon data takes a few seconds to load
3. **Windows PATH** - May need computer restart after Prolog install
4. **Screen recording** - May slow down backend responses (use threaded mode)

---

## 📜 License

This project is for educational purposes - CPSC 583 F25.

---

## 🙏 Acknowledgments

- [PokeAPI](https://pokeapi.co/) - Pokémon data
- [Smogon](https://www.smogon.com/) - Competitive tier data
- [SWI-Prolog](https://www.swi-prolog.org/) - Prolog implementation
- [PySwip](https://github.com/yuce/pyswip) - Python-Prolog bridge