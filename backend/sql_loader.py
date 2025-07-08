import os
from typing import Dict

class SQLLoader:
    def __init__(self, sql_dir: str = "sql"):
        self.sql_dir = sql_dir
        self.queries: Dict[str, str] = {}
        self._load_all_queries()
    
    def _load_all_queries(self):
        """Load all SQL files from the sql directory structure"""
        for root, dirs, files in os.walk(self.sql_dir):
            for file in files:
                if file.endswith('.sql'):
                    file_path = os.path.join(root, file)
                    # Create a key from the directory structure and filename
                    # e.g., sql/auth/check_username_exists.sql -> auth.check_username_exists
                    relative_path = os.path.relpath(file_path, self.sql_dir)
                    key = relative_path.replace(os.sep, '.').replace('.sql', '')
                    
                    with open(file_path, 'r') as f:
                        self.queries[key] = f.read().strip()
    
    def get_query(self, key: str) -> str:
        """Get a SQL query by its key"""
        if key not in self.queries:
            raise KeyError(f"SQL query '{key}' not found")
        return self.queries[key]
    
    def list_queries(self) -> list:
        """List all available query keys"""
        return list(self.queries.keys()) 