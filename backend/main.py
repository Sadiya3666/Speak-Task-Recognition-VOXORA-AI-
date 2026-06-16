from translator import router as translator_router
from datetime import timedelta
from typing import List, Optional
from fastapi import Depends, FastAPI, HTTPException, Response, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from fastapi.responses import StreamingResponse
import requests

# Import local modules
import models, schemas
from auth import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    create_access_token,
    get_current_user,
    get_db,
    get_password_hash,
    verify_password,
)
from database import Base, engine

# Initialize database
Base.metadata.create_all(bind=engine)

# Create FastAPI app
app = FastAPI()
app.include_router(translator_router)  # Add this line right after creating the app

@app.get("/api/tts")
def proxy_tts(text: str, lang: str):
    url = "https://translate.google.com/translate_tts"
    params = {
        "ie": "UTF-8",
        "tl": lang,
        "client": "gtx",
        "q": text
    }
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)"
    }
    try:
        response = requests.get(url, params=params, headers=headers, stream=True)
        response.raise_for_status()
        return StreamingResponse(response.iter_content(chunk_size=1024), media_type="audio/mpeg")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# CORS middleware
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://localhost:8081",
    "http://127.0.0.1:8081",
]

import os
env_origins = os.getenv("CORS_ORIGINS")
if env_origins:
    origins.extend([origin.strip() for origin in env_origins.split(",") if origin.strip()])

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Your existing routes and other code...


@app.post("/auth/register", response_model=schemas.TokenResponse)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == user_in.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    user = models.User(
        name=user_in.name,
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )

    return schemas.TokenResponse(
        access_token=access_token,
        user=schemas.UserRead.from_orm(user),
    )


@app.post("/auth/login", response_model=schemas.TokenResponse)
def login(login_in: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == login_in.email).first()
    if not user or not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )

    return schemas.TokenResponse(
        access_token=access_token,
        user=schemas.UserRead.from_orm(user),
    )


@app.get("/auth/me", response_model=schemas.UserRead)
def read_current_user(current_user: models.User = Depends(get_current_user)):
    return schemas.UserRead.from_orm(current_user)




# Notes endpoints
@app.get("/notes", response_model=List[schemas.NoteRead])
def list_notes(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(models.Note)
        .filter(models.Note.user_id == current_user.id)
        .order_by(models.Note.created_at.desc())
        .all()
    )


@app.post("/notes", response_model=schemas.NoteRead, status_code=status.HTTP_201_CREATED)
def create_note(
    note_in: schemas.NoteCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    note = models.Note(user_id=current_user.id, text=note_in.text)
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


@app.delete("/notes/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(
    note_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    note = (
        db.query(models.Note)
        .filter(models.Note.id == note_id, models.Note.user_id == current_user.id)
        .first()
    )
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found",
        )

    db.delete(note)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.delete("/notes", status_code=status.HTTP_204_NO_CONTENT)
def delete_all_notes(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db.query(models.Note).filter(models.Note.user_id == current_user.id).delete()
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
