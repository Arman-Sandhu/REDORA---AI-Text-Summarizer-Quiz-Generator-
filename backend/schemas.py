from pydantic import BaseModel, EmailStr
from typing import List, Optional, Any
from datetime import datetime

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = "User"

class UserCreate(UserBase):
    password: str

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: Optional[str] = "User"

    class Config:
        from_attributes = True

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# Summary Schemas
class SummaryCreate(BaseModel):
    title: str = "Untitled Summary"
    content: Any # JSON array of sections

class SummaryResponse(BaseModel):
    id: int
    user_id: int
    title: str
    content: Any
    created_at: datetime

    class Config:
        from_attributes = True

# MCQ History Schemas
class MCQHistoryCreate(BaseModel):
    question: str
    wrong_answer: str
    correct_answer: str
    explanation: str

class MCQHistoryResponse(MCQHistoryCreate):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# API Request Schemas
class SummarizeRequest(BaseModel):
    text: str
    num_sections: int = 3
    lines_per_section: int = 5

class MCQRequest(BaseModel):
    text: str
    num_mcqs: int = 5

# Pipeline Schemas
class DocumentInput(BaseModel):
    doc_id: str
    filename: str
    text: str

class PipelineProcessRequest(BaseModel):
    documents: List[DocumentInput]

class PipelineSummarizeRequest(BaseModel):
    doc_ids: List[str]
    num_sections: int = 3
    lines_per_section: int = 5

class PipelineTeachRequest(BaseModel):
    topic: str
    doc_ids: List[str] = []

# Chat Summary Schema
class ChatSummaryRequest(BaseModel):
    summary_context: str
    question: str

# Google OAuth Schema
class GoogleAuthRequest(BaseModel):
    code: str
    redirect_uri: str

# --- REDESIGNED REDORA MULTI-PDF PIPELINE SCHEMAS ---
class SimilarPairsRequest(BaseModel):
    file_ids: List[str]

class GenerateSummaryRequest(BaseModel):
    file_ids: List[str]
    sections: int = 3
    lines_per_section: int = 5

class GenerateMCQRequest(BaseModel):
    file_ids: Optional[List[str]] = []
    summary_text: Optional[str] = ""
    num_mcqs: int = 5
    source_type: str = "From Content" # "From Content" | "From Summary"

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    file_ids: List[str]
    query: str
    chat_history: List[ChatMessage] = []
