from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import database, models
from routes import auth_routes, api_routes, pdf_pipeline_routes

# Create database tables
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="REDORA API")

# Configure CORS for the frontend
import os
allowed_origins = ["http://localhost:5173", "http://localhost:3000"]
env_origins = os.getenv("ALLOWED_ORIGINS")
if env_origins:
    allowed_origins.extend([origin.strip() for origin in env_origins.split(",") if origin.strip()])

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth_routes.router)
app.include_router(api_routes.router)
app.include_router(pdf_pipeline_routes.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to REDORA API"}

# Trigger reload for dotenv settings - Loaded new Google Client ID & Secret!
