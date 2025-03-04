from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Tuple
import cv2
import numpy as np
import mediapipe as mp
import math

# Initialize FastAPI app
app = FastAPI()

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize MediaPipe hands
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(
    static_image_mode=False,
    max_num_hands=1,
    min_detection_confidence=0.7,
    min_tracking_confidence=0.7
)

# Constants for gesture recognition
FINGER_INDICES = {
    'THUMB': [1, 2, 3, 4],
    'INDEX': [5, 6, 7, 8],
    'MIDDLE': [9, 10, 11, 12],
    'RING': [13, 14, 15, 16],
    'PINKY': [17, 18, 19, 20]
}

CONFIDENCE_THRESHOLD = 0.7
DISTANCE_THRESHOLD = 0.1

class GestureProcessor:
    def __init__(self):
        self.prev_landmarks = None
        
    def is_finger_extended(self, landmarks: list, finger_indices: list) -> bool:
        finger_tip = landmarks[finger_indices[-1]]
        finger_base = landmarks[finger_indices[0]]
        return finger_tip.y < finger_base.y - DISTANCE_THRESHOLD

    def get_palm_direction(self, landmarks: list) -> Tuple[float, float]:
        wrist = landmarks[0]
        middle_base = landmarks[9]
        return (middle_base.x - wrist.x, middle_base.y - wrist.y)

    def calculate_finger_angle(self, landmarks: list, finger_indices: list) -> float:
        base = landmarks[finger_indices[0]]
        tip = landmarks[finger_indices[-1]]
        return math.atan2(tip.y - base.y, tip.x - base.x)

    def normalize_landmarks(self, landmarks: list) -> list:
        # Convert to numpy array for easier processing
        points = np.array([[lm.x, lm.y, lm.z] for lm in landmarks])
        
        # Normalize by the wrist position
        wrist = points[0]
        points = points - wrist
        
        # Scale to a consistent range
        max_dist = np.max(np.linalg.norm(points, axis=1))
        if max_dist > 0:
            points = points / max_dist
            
        return [type('Landmark', (), {'x': p[0], 'y': p[1], 'z': p[2]}) for p in points]

    def recognize_gesture(self, landmarks: list) -> Tuple[str, float, dict]:
        if not landmarks:
            return "no_gesture", 0.0, {}

        # Normalize landmarks to make detection more robust
        normalized_landmarks = self.normalize_landmarks(landmarks)

        # Check finger extensions
        thumb_extended = self.is_finger_extended(normalized_landmarks, FINGER_INDICES['THUMB'])
        index_extended = self.is_finger_extended(normalized_landmarks, FINGER_INDICES['INDEX'])
        middle_extended = self.is_finger_extended(normalized_landmarks, FINGER_INDICES['MIDDLE'])
        ring_extended = self.is_finger_extended(normalized_landmarks, FINGER_INDICES['RING'])
        pinky_extended = self.is_finger_extended(normalized_landmarks, FINGER_INDICES['PINKY'])

        # Get palm direction
        dx, dy = self.get_palm_direction(landmarks)
        palm_facing_up = dy < -DISTANCE_THRESHOLD
        palm_facing_left = dx < -DISTANCE_THRESHOLD
        palm_facing_right = dx > DISTANCE_THRESHOLD

        # Navigation gestures
        if index_extended and not (thumb_extended or middle_extended or ring_extended or pinky_extended):
            return "nextSlide", 0.95, {}
        
        if pinky_extended and not (thumb_extended or index_extended or middle_extended or ring_extended):
            return "previousSlide", 0.95, {}

        # Drawing gestures
        if index_extended and middle_extended and not (thumb_extended or ring_extended or pinky_extended):
            fingers_close = self.calculate_finger_distance(landmarks, FINGER_INDICES['INDEX'], FINGER_INDICES['MIDDLE']) < DISTANCE_THRESHOLD
            if fingers_close:
                return "shape", 0.9, {}
            return "draw", 0.9, {}

        if thumb_extended and not (index_extended or middle_extended or ring_extended or pinky_extended):
            return "erase", 0.9, {}

        # Control gestures
        if all([thumb_extended, index_extended, middle_extended, ring_extended, pinky_extended]):
            return "pointer", 0.95, {}

        if not any([thumb_extended, index_extended, middle_extended, ring_extended, pinky_extended]):
            return "stop", 0.95, {}

        # Check for sequence-based gestures if we have previous landmarks
        if self.prev_landmarks is not None:
            # Zoom gestures
            if index_extended and thumb_extended:
                prev_distance = self.calculate_finger_distance(self.prev_landmarks, FINGER_INDICES['THUMB'], FINGER_INDICES['INDEX'])
                curr_distance = self.calculate_finger_distance(landmarks, FINGER_INDICES['THUMB'], FINGER_INDICES['INDEX'])
                if abs(curr_distance - prev_distance) > DISTANCE_THRESHOLD:
                    scale = curr_distance / prev_distance
                    return ("zoomIn" if curr_distance > prev_distance else "zoomOut", 
                           0.85, 
                           {"scale": scale})

            # Rotation gestures (for undo/redo)
            if palm_facing_up:
                rotation = self.calculate_rotation(self.prev_landmarks, landmarks)
                if abs(rotation) > math.pi/4:  # 45 degrees
                    return ("undo" if rotation > 0 else "redo", 0.85, {})

            # First/Last slide gestures
            if palm_facing_left and index_extended and middle_extended:
                return "firstSlide", 0.88, {}
            if palm_facing_right and index_extended and middle_extended:
                return "lastSlide", 0.88, {}

        self.prev_landmarks = landmarks
        return "no_gesture", 0.0, {}

    def calculate_finger_distance(self, landmarks: list, finger1: list, finger2: list) -> float:
        tip1 = landmarks[finger1[-1]]
        tip2 = landmarks[finger2[-1]]
        return math.sqrt((tip1.x - tip2.x)**2 + (tip1.y - tip2.y)**2)

    def calculate_rotation(self, prev_landmarks: list, curr_landmarks: list) -> float:
        prev_angle = math.atan2(prev_landmarks[12].y - prev_landmarks[0].y, 
                               prev_landmarks[12].x - prev_landmarks[0].x)
        curr_angle = math.atan2(curr_landmarks[12].y - curr_landmarks[0].y,
                               curr_landmarks[12].x - curr_landmarks[0].x)
        return curr_angle - prev_angle

# Initialize gesture processor
gesture_processor = GestureProcessor()

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

    async def send_gesture(self, client_id: str, gesture: str, confidence: float, metadata: dict = None):
        if client_id in self.active_connections:
            await self.active_connections[client_id].send_json({
                "gesture": gesture,
                "confidence": confidence,
                "metadata": metadata
            })

manager = ConnectionManager()

@app.websocket("/ws/gestures/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await manager.connect(websocket, client_id)
    try:
        while True:
            data = await websocket.receive_bytes()
            frame = cv2.imdecode(np.frombuffer(data, np.uint8), cv2.IMREAD_COLOR)
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = hands.process(frame_rgb)

            if not results.multi_hand_landmarks:
                await manager.send_gesture(client_id, "no_gesture", 0.0)
                continue

            # Extract landmarks
            hand_landmarks = [
                type('Landmark', (), {'x': lm.x, 'y': lm.y, 'z': lm.z})
                for lm in results.multi_hand_landmarks[0].landmark
            ]
            gesture, confidence, metadata = gesture_processor.recognize_gesture(hand_landmarks)
            
            # Only send gestures with confidence above threshold
            if confidence >= CONFIDENCE_THRESHOLD:
                await manager.send_gesture(client_id, gesture, confidence, metadata)

    except WebSocketDisconnect:
        manager.disconnect(client_id)
    except Exception as e:
        print(f"Error processing frame: {str(e)}")
        manager.disconnect(client_id)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
