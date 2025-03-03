from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta
from typing import Dict, List, Any
import logging

logger = logging.getLogger(__name__)

class MongoDB:
    def __init__(self, url: str):
        self.client = AsyncIOMotorClient(url)
        self.db = self.client.gesture_recognition
        
    async def save_training_data(
        self,
        user_id: str,
        gesture_name: str,
        training_data: List[Dict[str, Any]]
    ):
        """Save gesture training data to database."""
        try:
            await self.db.training_data.insert_one({
                "user_id": user_id,
                "gesture_name": gesture_name,
                "data": training_data,
                "created_at": datetime.utcnow()
            })
        except Exception as e:
            logger.error(f"Error saving training data: {e}")
            raise
            
    async def log_gesture(
        self,
        user_id: str,
        gesture: str,
        confidence: float
    ):
        """Log detected gesture for analytics."""
        try:
            await self.db.gesture_logs.insert_one({
                "user_id": user_id,
                "gesture": gesture,
                "confidence": confidence,
                "timestamp": datetime.utcnow()
            })
        except Exception as e:
            logger.error(f"Error logging gesture: {e}")
            raise
            
    async def get_gesture_stats(
        self,
        user_id: str,
        period: str
    ) -> Dict[str, Any]:
        """Get gesture usage statistics for the specified period."""
        try:
            # Calculate start date based on period
            now = datetime.utcnow()
            if period == "day":
                start_date = now - timedelta(days=1)
            elif period == "week":
                start_date = now - timedelta(days=7)
            elif period == "month":
                start_date = now - timedelta(days=30)
            else:
                raise ValueError("Invalid period")
                
            # Get gesture counts
            pipeline = [
                {
                    "$match": {
                        "user_id": user_id,
                        "timestamp": {"$gte": start_date}
                    }
                },
                {
                    "$group": {
                        "_id": "$gesture",
                        "count": {"$sum": 1},
                        "avg_confidence": {"$avg": "$confidence"}
                    }
                }
            ]
            
            cursor = self.db.gesture_logs.aggregate(pipeline)
            results = await cursor.to_list(length=None)
            
            # Format results
            gesture_stats = {
                "period": period,
                "total_gestures": sum(r["count"] for r in results),
                "gesture_counts": {r["_id"]: r["count"] for r in results},
                "recognition_rates": {r["_id"]: r["avg_confidence"] for r in results},
                "start_date": start_date.isoformat(),
                "end_date": now.isoformat()
            }
            
            return gesture_stats
            
        except Exception as e:
            logger.error(f"Error getting gesture stats: {e}")
            raise
            
    async def get_user_training_data(
        self,
        user_id: str
    ) -> List[Dict[str, Any]]:
        """Get all training data for a user."""
        try:
            cursor = self.db.training_data.find({"user_id": user_id})
            return await cursor.to_list(length=None)
        except Exception as e:
            logger.error(f"Error getting training data: {e}")
            raise

