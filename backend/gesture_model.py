import cv2
import mediapipe as mp
import numpy as np
import torch
from torchvision import transforms
from PIL import Image

# Initialize Mediapipe Hands
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(max_num_hands=1, min_detection_confidence=0.7)

# Load the trained CNN model
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = torch.load("backend/best_cnn_model.pth", map_location=device)
model.eval()

# Image transformations for model input
transform = transforms.Compose([
    transforms.Resize((64, 64)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

# Gesture mappings from model predictions to actions
GESTURE_ACTIONS = {
    0: "next_slide",
    1: "prev_slide",
    2: "draw",
    3: "erase",
    4: "stop",
    5: "pointer"
}

def process_hand_region(frame, hand_landmarks):
    """Extract and process hand region for model input."""
    h, w, _ = frame.shape
    
    # Get hand bounding box
    x_coords = [landmark.x for landmark in hand_landmarks.landmark]
    y_coords = [landmark.y for landmark in hand_landmarks.landmark]
    x_min, x_max = min(x_coords), max(x_coords)
    y_min, y_max = min(y_coords), max(y_coords)
    
    # Add padding
    padding = 0.1
    x_min = max(0, x_min - padding)
    x_max = min(1, x_max + padding)
    y_min = max(0, y_min - padding)
    y_max = min(1, y_max + padding)
    
    # Convert to pixel coordinates
    x_min, x_max = int(x_min * w), int(x_max * w)
    y_min, y_max = int(y_min * h), int(y_max * h)
    
    # Extract hand region
    hand_region = frame[y_min:y_max, x_min:x_max]
    if hand_region.size == 0:
        return None
    
    # Convert to PIL Image and apply transformations
    hand_region = cv2.cvtColor(hand_region, cv2.COLOR_BGR2RGB)
    pil_image = Image.fromarray(hand_region)
    input_tensor = transform(pil_image).unsqueeze(0).to(device)
    
    return input_tensor

def detect_gesture(frame):
    """Process a frame and return detected gesture and coordinates (if applicable)."""
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = hands.process(rgb_frame)
    
    if results.multi_hand_landmarks:
        for hand_landmarks in results.multi_hand_landmarks:
            # Process hand region for model prediction
            input_tensor = process_hand_region(frame, hand_landmarks)
            if input_tensor is None:
                continue
            
            # Get model prediction
            with torch.no_grad():
                output = model(input_tensor)
                predicted_class = torch.argmax(output, dim=1).item()
            
            # Map prediction to action
            action = GESTURE_ACTIONS.get(predicted_class, "none")
            
            # If drawing, return coordinates of index finger tip
            if action == "draw":
                x = int(hand_landmarks.landmark[8].x * frame.shape[1])
                y = int(hand_landmarks.landmark[8].y * frame.shape[0])
                return action, (x, y)
            
            # For pointer action, return coordinates
            if action == "pointer":
                x = int(hand_landmarks.landmark[8].x * frame.shape[1])
                y = int(hand_landmarks.landmark[8].y * frame.shape[0])
                return action, (x, y)
                
            return action, None
            
    return "none", None
