#!/usr/bin/env python3
"""
Startup script for the Project Idea Generator Python Backend
"""

import os
import sys
import subprocess
from pathlib import Path

def check_python_version():
    """Check if Python version is compatible."""
    if sys.version_info < (3, 8):
        print("❌ Python 3.8 or higher is required")
        sys.exit(1)
    print(f"✅ Python {sys.version_info.major}.{sys.version_info.minor} detected")

def check_environment_file():
    """Check if .env file exists."""
    env_file = Path(".env")
    if not env_file.exists():
        print("❌ .env file not found")
        print("📝 Please copy .env.example to .env and configure your settings:")
        print("   cp .env.example .env")
        print("\n🔧 Required environment variables:")
        print("   - GEMINI_API_KEY: Your Google Gemini API key")
        print("   - FIREBASE_PROJECT_ID: Your Firebase project ID")
        print("   - FIREBASE_SERVICE_ACCOUNT_KEY: Path to your service account JSON file")
        return False
    print("✅ .env file found")
    return True

def install_dependencies():
    """Install Python dependencies."""
    print("📦 Installing dependencies...")
    try:
        subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"], 
                      check=True, capture_output=True)
        print("✅ Dependencies installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install dependencies: {e}")
        return False

def start_server():
    """Start the FastAPI server."""
    print("🚀 Starting Project Idea Generator API server...")
    print("📍 Server will be available at: http://localhost:8000")
    print("📖 API documentation: http://localhost:8000/docs")
    print("🔄 Health check: http://localhost:8000/health")
    print("\n⏹️  Press Ctrl+C to stop the server\n")
    
    try:
        subprocess.run([
            sys.executable, "-m", "uvicorn", 
            "app.main:app", 
            "--host", "0.0.0.0", 
            "--port", "8000", 
            "--reload"
        ])
    except KeyboardInterrupt:
        print("\n👋 Server stopped")

def main():
    """Main startup function."""
    print("🎯 Project Idea Generator - Python Backend")
    print("=" * 50)
    
    # Check Python version
    check_python_version()
    
    # Check environment file
    if not check_environment_file():
        sys.exit(1)
    
    # Install dependencies
    if not install_dependencies():
        sys.exit(1)
    
    # Start server
    start_server()

if __name__ == "__main__":
    main()
