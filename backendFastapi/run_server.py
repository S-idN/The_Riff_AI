import sys
import os
import uvicorn

print(f"Using Python interpreter: {sys.executable}")
print(f"Current working directory: {os.getcwd()}")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True) 