from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any
import json
import cv2
import numpy as np
import mediapipe as mp
from datetime import datetime
import torch
import torch.nn as nn
from models.gesture_model import GestureRecognitionModel
from database.mongodb import MongoDB
from config.settings import settings
from utils.preprocessing import preprocess_landmarks, normalize_landmarks
from utils.authentication import get_current_user

app = FastAPI()

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Add your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize MediaPipe
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(
    static_image_mode=False,
    max_num_hands=1,
    min_detection_confidence=0.7,
    min_tracking_confidence=0.7
)

# Initialize the gesture recognition model
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = GestureRecognitionModel().to(device)
# Try to load pre-trained model if it exists
try:
    model.load_state_dict(torch.load("models/gesture_model.pth"))
    model.eval()
    print("Loaded pre-trained gesture model")
except FileNotFoundError:
    print("No pre-trained model found. Starting with untrained model.")
    model.train()

# Initialize MongoDB connection
db = MongoDB(settings.MONGODB_URL)

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        self.active_connections[client_id] = websocket

    def disconnect(self, client_id: str):
        if client_id in self.active_connections:
            del self.active_connections[client_id]

    async def send_gesture(self, client_id: str, gesture: str, confidence: float):
        if client_id in self.active_connections:
            await self.active_connections[client_id].send_json({
                "gesture": gesture,
                "confidence": confidence
            })

manager = ConnectionManager()

@app.websocket("/ws/gestures/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await manager.connect(websocket, client_id)
    try:
        while True:
            # Receive frame data from client
            data = await websocket.receive_bytes()
            
            # Convert bytes to numpy array
            frame = cv2.imdecode(
                np.frombuffer(data, np.uint8),
                cv2.IMREAD_COLOR
            )
            
            # Process frame with MediaPipe
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = hands.process(frame_rgb)
            
            if not results.multi_hand_landmarks:
                # No hands detected
                await manager.send_gesture(client_id, "no_gesture", 0.0)
                continue
                
            # Get landmarks for the first detected hand
            hand_landmarks = results.multi_hand_landmarks[0]
            
            try:
                # Preprocess and normalize landmarks
                landmarks = preprocess_landmarks(hand_landmarks)
                landmarks = normalize_landmarks(landmarks)
                
                # Convert to tensor and get prediction
                with torch.no_grad():
                    input_tensor = torch.FloatTensor(landmarks).unsqueeze(0).to(device)
                    outputs = model(input_tensor)
                    confidence, prediction = torch.max(outputs, 1)
                    
                    gesture = settings.GESTURE_CLASSES[prediction.item()]
                    confidence = confidence.item()
                    
                    # Send prediction back to client
                    await manager.send_gesture(client_id, gesture, confidence)
                    
                    # Log gesture for analytics
                    await db.log_gesture(client_id, gesture, confidence)
            except Exception as e:
                print(f"Error processing hand landmarks: {str(e)}")
                await manager.send_gesture(client_id, "error", 0.0)
            
    except WebSocketDisconnect:
        manager.disconnect(client_id)

@app.post("/api/gestures/train")
async def train_gesture(
    user = Depends(get_current_user),
    gesture_name: str = None,
    training_data: List[Dict[str, Any]] = None
):
    try:
        # Save training data to database
        await db.save_training_data(user["id"], gesture_name, training_data)
        
        # Retrain model for user (background task)
        background_tasks.add_task(retrain_model_for_user, user["id"])
        
        return {"success": True, "message": "Training data saved successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/gestures/stats")
async def get_gesture_stats(
    user = Depends(get_current_user),
    period: str = "week"
):
    try:
        stats = await db.get_gesture_stats(user["id"], period)
        return {"success": True, "stats": stats}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
