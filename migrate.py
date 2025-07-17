import requests
import time
import pymongo
from pymongo import MongoClient
from typing import List, Dict, Optional
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class ExerciseFetcher:
    def __init__(self, mongodb_uri: str = "MONGODB_URI", db_name: str = "exercises"):
        """
        Initialize the ExerciseFetcher with MongoDB connection
        
        Args:
            mongodb_uri: MongoDB connection string
            db_name: Database name to use
        """
        self.base_url = "https://www.exercisedb.dev/api/v1"
        self.exercises_per_request = 25
        self.rate_limit_delay = 5.0  # 5 seconds between requests
        
        # MongoDB setup
        try:
            self.client = MongoClient(mongodb_uri)
            self.db = self.client[db_name]
            self.collection = self.db.exercises
            logger.info(f"Connected to MongoDB: {db_name}")
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            raise
    
    def fetch_exercises_page(self, offset: int = 0, limit: int = 25) -> Optional[Dict]:
        """
        Fetch a page of exercises from the API
        
        Args:
            offset: Starting index for pagination
            limit: Number of exercises to fetch
            
        Returns:
            API response as dictionary or None if failed
        """
        url = f"{self.base_url}/exercises"
        params = {
            "offset": offset,
            "limit": limit
        }
        
        try:
            logger.info(f"Fetching exercises: offset={offset}, limit={limit}")
            response = requests.get(url, params=params, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            logger.info(f"Successfully fetched {len(data.get('data', []))} exercises")
            return data
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching exercises: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            return None
    
    def save_exercises_to_db(self, exercises: List[Dict]) -> int:
        """
        Save exercises to MongoDB with upsert to avoid duplicates
        
        Args:
            exercises: List of exercise dictionaries
            
        Returns:
            Number of exercises saved/updated
        """
        if not exercises:
            return 0
        
        try:
            # Add timestamp for tracking
            current_time = datetime.utcnow()
            for exercise in exercises:
                exercise['last_updated'] = current_time
            
            # Use upsert to avoid duplicates based on exercise id
            saved_count = 0
            for exercise in exercises:
                result = self.collection.update_one(
                    {"id": exercise.get("id")},
                    {"$set": exercise},
                    upsert=True
                )
                if result.upserted_id or result.modified_count > 0:
                    saved_count += 1
            
            logger.info(f"Saved/updated {saved_count} exercises to database")
            return saved_count
            
        except Exception as e:
            logger.error(f"Error saving exercises to database: {e}")
            return 0
    
    def get_total_exercises_count(self) -> Optional[int]:
        """
        Get the total number of exercises available in the API
        
        Returns:
            Total count or None if failed
        """
        try:
            response = requests.get(f"{self.base_url}/exercises", params={"limit": 1}, timeout=30)
            response.raise_for_status()
            data = response.json()
            total = data.get('total', 0)
            logger.info(f"Total exercises available: {total}")
            return total
        except Exception as e:
            logger.error(f"Error getting total exercises count: {e}")
            return None
    
    def fetch_all_exercises(self) -> Dict[str, int]:
        """
        Fetch all exercises from the API with rate limiting and save to MongoDB
        
        Returns:
            Dictionary with statistics about the operation
        """
        logger.info("Starting to fetch all exercises from ExerciseDB API")
        
        # Get total count for progress tracking
        total_count = self.get_total_exercises_count()
        if total_count is None:
            logger.warning("Could not determine total exercise count, proceeding anyway")
            total_count = "unknown"
        
        offset = 0
        total_fetched = 0
        total_saved = 0
        consecutive_failures = 0
        max_consecutive_failures = 3
        
        while True:
            # Fetch exercises page
            data = self.fetch_exercises_page(offset, self.exercises_per_request)
            
            if data is None:
                consecutive_failures += 1
                if consecutive_failures >= max_consecutive_failures:
                    logger.error(f"Too many consecutive failures ({consecutive_failures}), stopping")
                    break
                logger.warning(f"Retrying after failure... ({consecutive_failures}/{max_consecutive_failures})")
                time.sleep(self.rate_limit_delay)
                continue
            
            # Reset failure counter on success
            consecutive_failures = 0
            
            exercises = data.get('data', [])
            if not exercises:
                logger.info("No more exercises to fetch")
                break
            
            # Save to database
            saved_count = self.save_exercises_to_db(exercises)
            total_fetched += len(exercises)
            total_saved += saved_count
            
            # Progress update
            progress = f"{total_fetched}/{total_count}" if isinstance(total_count, int) else str(total_fetched)
            logger.info(f"Progress: {progress} exercises fetched")
            
            # Check if we've reached the end
            if len(exercises) < self.exercises_per_request:
                logger.info("Reached end of exercises")
                break
            
            # Update offset for next request
            offset += self.exercises_per_request
            
            # Rate limiting - wait before next request
            logger.info(f"Waiting {self.rate_limit_delay} seconds before next request...")
            time.sleep(self.rate_limit_delay)
        
        # Final statistics
        stats = {
            'total_fetched': total_fetched,
            'total_saved': total_saved,
            'database_count': self.collection.count_documents({})
        }
        
        logger.info(f"Fetch complete! Stats: {stats}")
        return stats
    
    def create_indexes(self):
        """
        Create useful indexes for the exercises collection
        """
        try:
            # Create index on exercise id for faster lookups
            self.collection.create_index("id", unique=True)
            
            # Create indexes on commonly queried fields
            self.collection.create_index("name")
            self.collection.create_index("target")
            self.collection.create_index("bodyPart")
            self.collection.create_index("equipment")
            
            logger.info("Created database indexes")
        except Exception as e:
            logger.error(f"Error creating indexes: {e}")
    
    def get_collection_stats(self) -> Dict:
        """
        Get statistics about the exercises collection
        
        Returns:
            Dictionary with collection statistics
        """
        try:
            total_exercises = self.collection.count_documents({})
            
            # Get some sample statistics
            pipeline = [
                {"$group": {"_id": "$bodyPart", "count": {"$sum": 1}}},
                {"$sort": {"count": -1}}
            ]
            body_parts = list(self.collection.aggregate(pipeline))
            
            pipeline = [
                {"$group": {"_id": "$equipment", "count": {"$sum": 1}}},
                {"$sort": {"count": -1}}
            ]
            equipment = list(self.collection.aggregate(pipeline))
            
            return {
                'total_exercises': total_exercises,
                'body_parts': body_parts[:10],  # Top 10
                'equipment': equipment[:10]     # Top 10
            }
        except Exception as e:
            logger.error(f"Error getting collection stats: {e}")
            return {}
    
    def close(self):
        """
        Close the MongoDB connection
        """
        if hasattr(self, 'client'):
            self.client.close()
            logger.info("MongoDB connection closed")

def main():
    """
    Main function to run the exercise fetcher
    """
    # Configuration - modify these as needed
    MONGODB_URI = "mongodb://localhost:27017/"  # Change to your MongoDB URI
    DATABASE_NAME = "fitness_db"                # Change to your preferred database name
    
    fetcher = None
    try:
        # Initialize fetcher
        fetcher = ExerciseFetcher(MONGODB_URI, DATABASE_NAME)
        
        # Create indexes for better performance
        fetcher.create_indexes()
        
        # Fetch all exercises
        stats = fetcher.fetch_all_exercises()
        
        # Print final statistics
        print("\n" + "="*50)
        print("EXERCISE FETCH COMPLETE")
        print("="*50)
        print(f"Total exercises fetched: {stats['total_fetched']}")
        print(f"Total exercises saved/updated: {stats['total_saved']}")
        print(f"Total exercises in database: {stats['database_count']}")
        
        # Show collection statistics
        collection_stats = fetcher.get_collection_stats()
        if collection_stats:
            print(f"\nCollection Statistics:")
            print(f"Total exercises: {collection_stats['total_exercises']}")
            
            if collection_stats.get('body_parts'):
                print(f"\nTop body parts:")
                for bp in collection_stats['body_parts'][:5]:
                    print(f"  {bp['_id']}: {bp['count']} exercises")
            
            if collection_stats.get('equipment'):
                print(f"\nTop equipment:")
                for eq in collection_stats['equipment'][:5]:
                    print(f"  {eq['_id']}: {eq['count']} exercises")
        
    except KeyboardInterrupt:
        logger.info("Operation interrupted by user")
    except Exception as e:
        logger.error(f"Unexpected error in main: {e}")
    finally:
        if fetcher:
            fetcher.close()

if __name__ == "__main__":
    main()