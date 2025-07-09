import time
import threading
from collections import defaultdict
from typing import Dict, List, Tuple, Any
import statistics

class QueryTimer:    
    def __init__(self):
        self._lock = threading.Lock()
        self._query_times: Dict[str, List[float]] = defaultdict(list)
        self._total_queries = 0
        self._total_time = 0.0
    
    def time_query(self, cursor, query_key: str, sql_query: str, params: Tuple = None) -> Any:
        """
        Execute a query with timing and store the execution time.
        
        Args:
            cursor: Database cursor object
            query_key: Unique identifier for the query (e.g., 'auth.get_user_by_username')
            sql_query: The actual SQL query string
            params: Query parameters (optional)
            
        Returns:
            Result of cursor.execute()
        """
        start_time = time.perf_counter()
        
        try:
            if params:
                result = cursor.execute(sql_query, params)
            else:
                result = cursor.execute(sql_query)
            
            end_time = time.perf_counter()
            execution_time = end_time - start_time
            
            # Store timing data thread-safely
            with self._lock:
                self._query_times[query_key].append(execution_time)
                self._total_queries += 1
                self._total_time += execution_time
            
            return result
            
        except Exception as e:
            end_time = time.perf_counter()
            execution_time = end_time - start_time
            
            # Still record timing even for failed queries
            with self._lock:
                self._query_times[f"{query_key}_ERROR"].append(execution_time)
                self._total_queries += 1
                self._total_time += execution_time
            
            raise e
    
    def get_query_stats(self, query_key: str) -> Dict[str, Any]:
        """
        Get statistics for a specific query.
        
        Args:
            query_key: The query identifier
            
        Returns:
            Dictionary containing timing statistics
        """
        with self._lock:
            times = self._query_times.get(query_key, [])
            
            if not times:
                return {
                    'query_key': query_key,
                    'count': 0,
                    'average_time': 0.0,
                    'min_time': 0.0,
                    'max_time': 0.0,
                    'median_time': 0.0,
                    'total_time': 0.0
                }
            
            return {
                'query_key': query_key,
                'count': len(times),
                'average_time': statistics.mean(times),
                'min_time': min(times),
                'max_time': max(times),
                'median_time': statistics.median(times),
                'total_time': sum(times)
            }
    
    def get_all_stats(self) -> Dict[str, Any]:
        """
        Get statistics for all queries.
        
        Returns:
            Dictionary containing all query statistics
        """
        with self._lock:
            stats = {
                'total_queries': self._total_queries,
                'total_time': self._total_time,
                'average_time_per_query': self._total_time / self._total_queries if self._total_queries > 0 else 0.0,
                'queries': {}
            }
            
            for query_key in self._query_times:
                stats['queries'][query_key] = self.get_query_stats(query_key)
            
            return stats
    
    def reset_stats(self):
        """Reset all timing statistics."""
        with self._lock:
            self._query_times.clear()
            self._total_queries = 0
            self._total_time = 0.0
    