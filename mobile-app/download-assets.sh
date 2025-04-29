#!/bin/bash

# Create assets directory if it doesn't exist
mkdir -p src/assets

# Download simple colored placeholders
echo "Downloading logo placeholder..."
curl -L "https://via.placeholder.com/300x300/4CAF50/FFFFFF.png?text=Logo" -o src/assets/logo-placeholder.png

echo "Downloading app icon..."
curl -L "https://via.placeholder.com/1024x1024/4CAF50/FFFFFF.png?text=Icon" -o src/assets/icon.png

echo "Downloading splash screen image..."
curl -L "https://via.placeholder.com/2000x2000/4CAF50/FFFFFF.png?text=Splash" -o src/assets/splash.png

echo "Downloading adaptive icon..."
curl -L "https://via.placeholder.com/1024x1024/4CAF50/FFFFFF.png?text=Adaptive+Icon" -o src/assets/adaptive-icon.png

echo "Downloading favicon..."
curl -L "https://via.placeholder.com/64x64/4CAF50/FFFFFF.png?text=Favicon" -o src/assets/favicon.png

# echo "Downloading camera placeholder..."
# curl -L "https://via.placeholder.com/512x512/333333/FFFFFF.png?text=Camera" -o src/assets/camera-placeholder.png

echo "Downloading map placeholder..."
curl -L "https://via.placeholder.com/512x512/3F51B5/FFFFFF.png?text=Map" -o src/assets/map-placeholder.png

echo "Downloading tractor icon..."
curl -L "https://via.placeholder.com/512x512/FF9800/FFFFFF.png?text=Tractor" -o src/assets/tractor-icon.png

echo "Downloading battery icons..."
curl -L "https://via.placeholder.com/512x512/4CAF50/FFFFFF.png?text=Battery+Full" -o src/assets/battery-full.png
curl -L "https://via.placeholder.com/512x512/FFC107/FFFFFF.png?text=Battery+Medium" -o src/assets/battery-medium.png
curl -L "https://via.placeholder.com/512x512/F44336/FFFFFF.png?text=Battery+Low" -o src/assets/battery-low.png

echo "Downloading control icons..."
curl -L "https://via.placeholder.com/512x512/2196F3/FFFFFF.png?text=Joystick" -o src/assets/joystick-icon.png
curl -L "https://via.placeholder.com/512x512/9C27B0/FFFFFF.png?text=Speed" -o src/assets/speed-icon.png

echo "All assets downloaded successfully!"