from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from .api.transcript import router as transcript_router
from .core.config import settings

# --- Define upload directory relative to main.py ---
# Assuming main.py is in backend/app/, uploads is in backend/uploads/
UPLOAD_DIR_SERVE = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "uploads")
)
# -------------------------------------------------

app = FastAPI(
    title="Transcript Editor API",
    description="API for the Transcript Editor application",
    version="0.1.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Mount static files directory ---
# Serve files from the /uploads URL path
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR_SERVE), name="uploads")
# ------------------------------------

# Include routers
app.include_router(
    transcript_router, prefix=settings.API_V1_STR + "/transcripts", tags=["transcripts"]
)


@app.get("/")
async def root():
    return {"message": "Welcome to the Transcript Editor API"}
