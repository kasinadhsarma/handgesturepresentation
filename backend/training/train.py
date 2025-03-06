import os
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
import cv2
import numpy as np
from tqdm import tqdm
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.gesture_model import GestureRecognitionModel, GestureDataset
from utils.preprocessing import augment_data

def prepare_data(data_dir, img_size=(224, 224)):
    """Prepare training data from directory structure"""
    landmarks = []
    labels = []
    
    for label_idx, class_name in enumerate(sorted(os.listdir(data_dir))):
        class_dir = os.path.join(data_dir, class_name)
        if not os.path.isdir(class_dir):
            continue
            
        print(f"Processing class {class_name}...")
        for img_name in tqdm(os.listdir(class_dir)):
            img_path = os.path.join(class_dir, img_name)
            try:
                img = cv2.imread(img_path)
                if img is None:
                    continue
                img = cv2.resize(img, img_size)
                img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
                img = img.transpose((2, 0, 1)) / 255.0  # Convert to CHW format
                
                landmarks.append(img)
                labels.append(label_idx)
            except Exception as e:
                print(f"Error processing {img_path}: {e}")
                
    return np.array(landmarks), np.array(labels)

def train_model(model, train_loader, val_loader, num_epochs=50, device='cuda'):
    """Train the gesture recognition model"""
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=0.001)
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='min', patience=5)
    
    best_val_loss = float('inf')
    best_model_path = 'pretrained_gesture_model.pth'
    
    model = model.to(device)
    
    for epoch in range(num_epochs):
        # Training phase
        model.train()
        train_loss = 0
        train_correct = 0
        train_total = 0
        
        for inputs, labels in tqdm(train_loader, desc=f'Epoch {epoch+1}/{num_epochs}'):
            inputs, labels = inputs.to(device), labels.to(device)
            
            optimizer.zero_grad()
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            
            train_loss += loss.item()
            _, predicted = outputs.max(1)
            train_total += labels.size(0)
            train_correct += predicted.eq(labels).sum().item()
        
        # Validation phase
        model.eval()
        val_loss = 0
        val_correct = 0
        val_total = 0
        
        with torch.no_grad():
            for inputs, labels in val_loader:
                inputs, labels = inputs.to(device), labels.to(device)
                outputs = model(inputs)
                loss = criterion(outputs, labels)
                
                val_loss += loss.item()
                _, predicted = outputs.max(1)
                val_total += labels.size(0)
                val_correct += predicted.eq(labels).sum().item()
        
        train_loss = train_loss / len(train_loader)
        train_acc = 100. * train_correct / train_total
        val_loss = val_loss / len(val_loader)
        val_acc = 100. * val_correct / val_total
        
        print(f'Epoch {epoch+1}/{num_epochs}:')
        print(f'Train Loss: {train_loss:.4f}, Train Acc: {train_acc:.2f}%')
        print(f'Val Loss: {val_loss:.4f}, Val Acc: {val_acc:.2f}%')
        
        scheduler.step(val_loss)
        
        # Save best model
        if val_loss < best_val_loss:
            best_val_loss = val_loss
            torch.save(model.state_dict(), best_model_path)
            print(f'Saved best model with validation loss: {val_loss:.4f}')

if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description='Train gesture recognition model')
    parser.add_argument('--data_dir', type=str, required=True, help='Path to training data directory')
    parser.add_argument('--batch_size', type=int, default=32, help='Batch size')
    parser.add_argument('--num_epochs', type=int, default=50, help='Number of epochs')
    parser.add_argument('--device', type=str, default='cuda' if torch.cuda.is_available() else 'cpu',
                        help='Device to train on (cuda/cpu)')
    
    args = parser.parse_args()
    
    # Prepare data
    print("Preparing training data...")
    landmarks, labels = prepare_data(args.data_dir)
    
    # Data augmentation
    print("Applying data augmentation...")
    landmarks, labels = augment_data(landmarks, labels)
    
    # Split data
    from sklearn.model_selection import train_test_split
    train_landmarks, val_landmarks, train_labels, val_labels = train_test_split(
        landmarks, labels, test_size=0.2, random_state=42)
    
    # Create datasets
    train_dataset = Gesture dataset(train_landmarks, train_labels)
    val_dataset = GestureDataset(val_landmarks, val_labels)
    
    # Create data loaders
    train_loader = DataLoader(train_dataset, batch_size=args.batch_size, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=args.batch_size)
    
    # Initialize and train model
    model = GestureRecognitionModel(num_classes=10)
    train_model(model, train_loader, val_loader, num_epochs=args.num_epochs, device=args.device)
