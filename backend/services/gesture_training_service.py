import numpy as np
import torch
import torch.nn as nn
from typing import List, Dict, Any
from models.gesture_model import GestureRecognitionModel
from database.mongodb import MongoDB
from config.settings import settings

class GestureTrainingService:
    def __init__(self):
        self.db = MongoDB(settings.MONGODB_URL)
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = GestureRecognitionModel().to(self.device)
        
    async def train_user_gesture(
        self,
        user_id: str,
        gesture_name: str,
        training_data: List[Dict[str, Any]]
    ) -> Dict:
        """Train model on user's custom gesture."""
        try:
            # Save training data
            await self.db.save_training_data(user_id, gesture_name, training_data)
            
            # Prepare training data
            processed_data = self._preprocess_training_data(training_data)
            
            # Fine-tune model
            success = await self._fine_tune_model(processed_data, gesture_name)
            
            if success:
                # Save updated model for user
                torch.save(
                    self.model.state_dict(),
                    f"{settings.MODEL_PATH}_{user_id}.pth"
                )
                
                return {
                    "success": True,
                    "message": f"Successfully trained gesture: {gesture_name}"
                }
            else:
                raise Exception("Training failed")
                
        except Exception as e:
            return {
                "success": False,
                "message": f"Training failed: {str(e)}"
            }
    
    def _preprocess_training_data(
        self,
        training_data: List[Dict[str, Any]]
    ) -> Dict[str, torch.Tensor]:
        """Preprocess raw training data for model training."""
        landmarks = []
        timestamps = []
        
        for data in training_data:
            landmarks.append(data["landmarks"])
            timestamps.append(data["timestamp"])
            
        # Convert to tensors
        X = torch.FloatTensor(landmarks).to(self.device)
        timestamps = torch.FloatTensor(timestamps).to(self.device)
        
        return {
            "landmarks": X,
            "timestamps": timestamps
        }
    
    async def _fine_tune_model(
        self,
        processed_data: Dict[str, torch.Tensor],
        gesture_name: str
    ) -> bool:
        """Fine-tune model on new gesture data."""
        try:
            self.model.train()
            optimizer = torch.optim.Adam(
                self.model.parameters(),
                lr=settings.LEARNING_RATE
            )
            criterion = nn.CrossEntropyLoss()
            
            # Training loop
            for epoch in range(settings.NUM_EPOCHS):
                optimizer.zero_grad()
                
                # Forward pass
                outputs = self.model(processed_data["landmarks"])
                
                # Compute loss
                target_idx = settings.GESTURE_CLASSES.index(gesture_name)
                target = torch.LongTensor([target_idx] * len(outputs)).to(self.device)
                loss = criterion(outputs, target)
                
                # Backward pass
                loss.backward()
                optimizer.step()
                
                if (epoch + 1) % 10 == 0:
                    print(f"Epoch [{epoch+1}/{settings.NUM_EPOCHS}], Loss: {loss.item():.4f}")
            
            return True
            
        except Exception as e:
            print(f"Training error: {str(e)}")
            return False
    
    async def get_user_gestures(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all trained gestures for a user."""
        try:
            return await self.db.get_user_training_data(user_id)
        except Exception as e:
            print(f"Error getting user gestures: {str(e)}")
            return []

