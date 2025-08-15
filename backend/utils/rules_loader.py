import os

def load_rules():
    # Get the path to the rules file relative to the backend directory
    rules_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "..", "tu_format_rules.txt")
    try:
        with open(rules_path, "r", encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        return "TU Format Rules not found. Please ensure tu_format_rules.txt exists in the project root."
    except Exception as e:
        return f"Error loading rules: {str(e)}"
