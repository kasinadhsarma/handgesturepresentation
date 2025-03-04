import torch
import torch.nn as nn
import torch.nn.functional as F

class GestureRecognitionModel(nn.Module):
    def __init__(self, num_classes=14):
        super(GestureRecognitionModel, self).__init__()
        # CNN architecture matching the saved weights
        self.conv1 = nn.Conv2d(3, 32, kernel_size=3, padding=1)
        self.bn1 = nn.BatchNorm2d(32)
        self.conv2 = nn.Conv2d(32, 64, kernel_size=3, padding=1)
        self.bn2 = nn.BatchNorm2d(64)
        self.conv3 = nn.Conv2d(64, 128, kernel_size=3, padding=1)
        self.bn3 = nn.BatchNorm2d(128)
        self.pool = nn.MaxPool2d(2, 2)
        self.fc1 = nn.Linear(128 * 8 * 8, 512)
        self.bn4 = nn.BatchNorm1d(512)
        self.fc2 = nn.Linear(512, num_classes)
        self.dropout = nn.Dropout(0.5)
        
    def forward(self, x):
        # Handle both landmark and image input formats
        if len(x.shape) == 2:  # Landmark input (batch_size, flattened_landmarks)
            # Reshape landmarks to image-like format
            x = x.view(-1, 3, 8, 8)  # Assuming 21 landmarks with x,y,z coords
            
        x = self.pool(F.relu(self.bn1(self.conv1(x))))
        x = self.pool(F.relu(self.bn2(self.conv2(x))))
        x = self.pool(F.relu(self.bn3(self.conv3(x))))
        x = x.view(-1, 128 * 8 * 8)
        x = self.dropout(F.relu(self.bn4(self.fc1(x))))
        x = self.fc2(x)
        return F.softmax(x, dim=1)

class GestureDataset(torch.utils.data.Dataset):
    def __init__(self, landmarks, labels):
        self.landmarks = torch.FloatTensor(landmarks)
        self.labels = torch.LongTensor(labels)
        
    def __len__(self):
        return len(self.landmarks)
        
    def __getitem__(self, idx):
        return self.landmarks[idx], self.labels[idx]

