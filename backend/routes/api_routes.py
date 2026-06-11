import os
import httpx
import json
import uuid
import math
from collections import Counter
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from groq import Groq
import fitz # PyMuPDF
import database, models, schemas, auth

router = APIRouter(prefix="/api", tags=["api"])

# Make sure GROQ_API_KEY is set in your environment variables
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

# --- IN-MEMORY PDF STORAGE DATABASE ---
# Keyed by file_id
uploaded_files_db = {}

# --- TF-IDF MATH UTILITIES (Vanilla Python, No Binary Dependencies) ---

def compute_tf_idf_similarity(text1: str, text2: str) -> float:
    # Tokenize texts into lowercase words
    words1 = [w.lower() for w in text1.split() if w.isalnum()]
    words2 = [w.lower() for w in text2.split() if w.isalnum()]
    
    if not words1 or not words2:
        return 0.0
        
    c1 = Counter(words1)
    c2 = Counter(words2)
    
    # Compute vocabulary
    vocab = set(c1.keys()).union(set(c2.keys()))
    
    # Compute cosine similarity of term frequencies
    dot_product = 0.0
    norm1 = 0.0
    norm2 = 0.0
    
    for word in vocab:
        val1 = c1.get(word, 0)
        val2 = c2.get(word, 0)
        dot_product += val1 * val2
        norm1 += val1 * val1
        norm2 += val2 * val2
        
    if norm1 == 0 or norm2 == 0:
        return 0.0
        
    return dot_product / (math.sqrt(norm1) * math.sqrt(norm2))


def tf_idf_search(query: str, chunks: list, top_k: int = 6) -> list:
    if not chunks:
        return []
    
    def tokenize(text):
        return [w.lower() for w in text.split() if w.isalnum()]
        
    query_tokens = tokenize(query)
    if not query_tokens:
        return chunks[:top_k]
        
    # Count term frequencies in each chunk (TF)
    chunk_tfs = []
    doc_counts = Counter()
    for chunk in chunks:
        tokens = tokenize(chunk["text"])
        tf = Counter(tokens)
        chunk_tfs.append((chunk, tf, len(tokens)))
        for token in set(tokens):
            doc_counts[token] += 1
            
    # Compute Inverse Document Frequency (IDF)
    num_docs = len(chunks)
    idfs = {}
    for token, count in doc_counts.items():
        idfs[token] = math.log((1 + num_docs) / (1 + count)) + 1
        
    # Vectorize query
    query_tf = Counter(query_tokens)
    query_vector = {}
    for token, count in query_tf.items():
        if token in idfs:
            query_vector[token] = count * idfs[token]
            
    query_norm = math.sqrt(sum(v*v for v in query_vector.values()))
    if query_norm == 0:
        return chunks[:top_k]
        
    # Compute similarity for each chunk
    scored_chunks = []
    for chunk, tf, doc_len in chunk_tfs:
        if doc_len == 0:
            scored_chunks.append((chunk, 0.0))
            continue
            
        chunk_vector = {}
        for token, count in tf.items():
            if token in idfs:
                chunk_vector[token] = (count / doc_len) * idfs[token]
                
        # Dot product
        dot_product = 0.0
        for token, q_val in query_vector.items():
            dot_product += q_val * chunk_vector.get(token, 0.0)
            
        chunk_norm = math.sqrt(sum(v*v for v in chunk_vector.values()))
        
        similarity = 0.0
        if chunk_norm > 0:
            similarity = dot_product / (query_norm * chunk_norm)
            
        scored_chunks.append((chunk, similarity))
        
    # Sort and return top_k
    scored_chunks.sort(key=lambda x: x[1], reverse=True)
    return [item[0] for item in scored_chunks[:top_k]]


# --- REDESIGNED REDORA MULTI-PDF ENDPOINTS ---

@router.post("/upload")
async def upload_pdfs(files: List[UploadFile] = File(...)):
    """
    Accept PDF files, extract text using PyMuPDF (fitz), chunk into ~400-token segments,
    store in-memory, and return file_id + metadata (filename, page_count).
    """
    uploaded_results = []
    
    for file in files:
        if not file.filename.endswith(".pdf"):
            raise HTTPException(status_code=400, detail=f"File {file.filename} is not a PDF.")
            
        try:
            # Read file bytes
            file_bytes = await file.read()
            
            # Open PDF with PyMuPDF (fitz)
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            page_count = len(doc)
            
            # Extract text
            full_text = ""
            for page in doc:
                full_text += page.get_text()
                
            if not full_text.strip():
                full_text = f"Empty document content for {file.filename}."
                
            # Generate a unique file_id
            file_id = str(uuid.uuid4())
            
            # Chunk each PDF into ~400-token segments (words split)
            words = full_text.split()
            chunks = []
            chunk_word_size = 300  # ~400 tokens
            for i in range(0, len(words), chunk_word_size):
                chunk_words = words[i : i + chunk_word_size]
                chunk_text = " ".join(chunk_words)
                chunks.append({
                    "file_id": file_id,
                    "filename": file.filename,
                    "chunk_index": len(chunks) + 1,
                    "text": chunk_text
                })
                
            # Store in-memory db
            uploaded_files_db[file_id] = {
                "filename": file.filename,
                "page_count": page_count,
                "text": full_text,
                "chunks": chunks
            }
            
            uploaded_results.append({
                "file_id": file_id,
                "filename": file.filename,
                "page_count": page_count
            })
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to parse {file.filename}: {str(e)}")
            
    return uploaded_results


@router.post("/similar-pairs")
async def get_similar_pairs(req: schemas.SimilarPairsRequest):
    """
    Accept list of file_ids, return similarity-scored pairs.
    """
    file_ids = req.file_ids
    results = []
    
    for i in range(len(file_ids)):
        for j in range(i + 1, len(file_ids)):
            id1 = file_ids[i]
            id2 = file_ids[j]
            
            if id1 not in uploaded_files_db or id2 not in uploaded_files_db:
                continue
                
            f1 = uploaded_files_db[id1]
            f2 = uploaded_files_db[id2]
            
            # Compute TF-IDF similarity
            similarity = compute_tf_idf_similarity(f1["text"], f2["text"])
            
            results.append({
                "file1_id": id1,
                "file1_name": f1["filename"],
                "file2_id": id2,
                "file2_name": f2["filename"],
                "similarity": similarity
            })
            
    # Sort by similarity
    results.sort(key=lambda x: x["similarity"], reverse=True)
    return results


@router.post("/generate-summary")
async def generate_unified_summary(req: schemas.GenerateSummaryRequest):
    """
    Accept file_ids, sections, lines_per_section → return structured summary
    """
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is not configured.")
        
    combined_texts = []
    for file_id in req.file_ids:
        if file_id in uploaded_files_db:
            combined_texts.append(uploaded_files_db[file_id]["text"])
            
    if not combined_texts:
        raise HTTPException(status_code=404, detail="No content found for the selected files.")
        
    combined_text = "\n\n".join(combined_texts)
    if len(combined_text) > 8500:
        combined_text = combined_text[:8500] + "\n\n[Content truncated for Free Tier compatibility...]"
        
    prompt = f"""You are a technical summarization expert. Summarize the following content into exactly {req.sections} sections. Each section must have a clear heading and exactly {req.lines_per_section} lines of summary. Be precise, technical, and informative. Format your response strictly as a JSON array of sections:
[
  {{
    "heading": "Section Heading",
    "lines": [
      "Line 1 of summary.",
      "Line 2 of summary.",
      ...
    ]
  }}
]
Return ONLY a valid JSON array, no extra text, no markdown fences."""

    try:
        groq_client = Groq(api_key=api_key)
        response = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": "You are a professional summarizer. You always output pure JSON as requested."},
                {"role": "user", "content": f"{prompt}\n\nContent:\n{combined_text}"}
            ],
            temperature=0.3,
            max_tokens=4096
        )
        
        result_text = response.choices[0].message.content.strip()
        if result_text.startswith("```"):
            result_text = result_text.replace("```json", "").replace("```", "").strip()
            
        try:
            parsed_summary = json.loads(result_text)
            return parsed_summary
        except Exception:
            # Fallback parsing
            fallback_sections = []
            lines = result_text.split("\n")
            current_section = None
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                if line.upper().startswith("SECTION") or line.startswith("###") or ":" in line[:30]:
                    if current_section:
                        fallback_sections.append(current_section)
                    heading = line.split(":", 1)[1].strip() if ":" in line else line
                    current_section = {"heading": heading, "lines": []}
                else:
                    if current_section:
                        current_section["lines"].append(line)
            if current_section:
                fallback_sections.append(current_section)
            if not fallback_sections:
                fallback_sections = [{"heading": "Summary Overview", "lines": [result_text[:500]]}]
            return fallback_sections
            
    except Exception as e:
        error_msg = str(e)
        if "rate_limit" in error_msg.lower() or "limit" in error_msg.lower() or "tpm" in error_msg.lower() or "413" in error_msg or "429" in error_msg:
            raise HTTPException(
                status_code=429,
                detail="Groq Rate Limit Reached (6,000 TPM limit on Free Tier). To instantly increase your limit to 30,000+ TPM for free, please add a credit card to your Groq Console at console.groq.com/settings/billing"
            )
        raise HTTPException(status_code=500, detail=f"Groq API Error: {error_msg}")


@router.post("/generate-mcq")
async def generate_pipeline_mcq(req: schemas.GenerateMCQRequest):
    """
    Accept content or summary text, num_mcqs, source_type → return MCQ list
    """
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is not configured.")
        
    content_to_use = ""
    
    if req.source_type == "From Summary":
        content_to_use = req.summary_text
    else:
        combined_texts = []
        for file_id in req.file_ids:
            if file_id in uploaded_files_db:
                combined_texts.append(uploaded_files_db[file_id]["text"])
        content_to_use = "\n\n".join(combined_texts)
        
    if not content_to_use.strip():
        content_to_use = "No text provided. Generate mock questions about technical studying."
        
    if len(content_to_use) > 8500:
        content_to_use = content_to_use[:8500] + "\n\n[Content truncated for Free Tier compatibility...]"
        
    prompt = f"""You are an expert multiple-choice question creator. Based on the following content, generate exactly {req.num_mcqs} multiple-choice questions.

Rules:
- Each question must have exactly 4 options labeled A, B, C, D
- Only one option is correct
- Return ONLY valid JSON, no extra text, no markdown fences

Format:
[
  {{
    "id": 1,
    "question": "Question text here?",
    "options": {{
      "A": "Option A text",
      "B": "Option B text",
      "C": "Option C text",
      "D": "Option D text"
    }},
    "correct": "B",
    "explanation": "Brief explanation of why B is correct"
  }}
]

Content:
{content_to_use}"""

    try:
        groq_client = Groq(api_key=api_key)
        response = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": "You are a professional MCQ generator. You always output pure JSON arrays as requested."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=4096
        )
        
        result_text = response.choices[0].message.content.strip()
        if result_text.startswith("```"):
            result_text = result_text.replace("```json", "").replace("```", "").strip()
            
        try:
            parsed_mcqs = json.loads(result_text)
            return parsed_mcqs
        except Exception:
            raise HTTPException(status_code=500, detail="Failed to parse MCQs as JSON from Groq response.")
            
    except Exception as e:
        error_msg = str(e)
        if "rate_limit" in error_msg.lower() or "limit" in error_msg.lower() or "tpm" in error_msg.lower() or "413" in error_msg or "429" in error_msg:
            raise HTTPException(
                status_code=429,
                detail="Groq Rate Limit Reached (6,000 TPM limit on Free Tier). To instantly increase your limit to 30,000+ TPM for free, please add a credit card to your Groq Console at console.groq.com/settings/billing"
            )
        raise HTTPException(status_code=500, detail=f"Groq API Error: {error_msg}")


@router.post("/chat")
async def chat_rag_streaming(req: schemas.ChatRequest):
    """
    Accept file_ids, query, chat_history → RAG retrieval + Groq response (streaming)
    """
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is not configured.")
        
    # 1. Retrieve all chunks for selected files
    selected_chunks = []
    file_id_to_name = {}
    for file_id in req.file_ids:
        if file_id in uploaded_files_db:
            selected_chunks.extend(uploaded_files_db[file_id]["chunks"])
            file_id_to_name[file_id] = uploaded_files_db[file_id]["filename"]
            
    # 2. Search top chunks using our self-contained TF-IDF vectorizer
    top_chunks = tf_idf_search(req.query, selected_chunks, top_k=6)
    
    # 3. Construct context and citations
    context_str = ""
    for idx, chunk in enumerate(top_chunks):
        filename = chunk["filename"]
        chunk_idx = chunk["chunk_index"]
        context_str += f"\n\n[PDF: {filename}, Chunk #{chunk_idx}]\n{chunk['text']}"
        
    # Return only unique, deduplicated filenames from retrieved chunks
    citations = list(set(chunk["filename"] for chunk in top_chunks))
        
    # 4. Construct messages prompt
    system_prompt = """You are a document assistant. Answer ONLY using the provided document chunks.
Do not mention chunk numbers or internal references in your response.
If the answer is not found in the provided chunks, say "I couldn't find that in the selected documents." """

    messages = [
        {"role": "system", "content": f"{system_prompt}\n\nRetrieved Chunks:\n{context_str}"}
    ]
    
    for msg in req.chat_history:
        messages.append({"role": msg.role, "content": msg.content})
        
    messages.append({"role": "user", "content": req.query})
    
    # 5. Generator function for StreamingResponse
    def response_generator():
        try:
            groq_client = Groq(api_key=api_key)
            completion = groq_client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=messages,
                temperature=0.3,
                stream=True,
            )
            for chunk in completion:
                content = chunk.choices[0].delta.content
                if content:
                    yield content
        except Exception as e:
            error_msg = str(e)
            if "rate_limit" in error_msg.lower() or "limit" in error_msg.lower() or "tpm" in error_msg.lower() or "413" in error_msg or "429" in error_msg:
                yield "Rate Limit Reached (6,000 TPM limit on Free Tier). To instantly increase your limit to 30,000+ TPM for free, please add a credit card to your Groq Console at console.groq.com/settings/billing"
            else:
                yield f"Error in stream generation: {error_msg}"
            
    headers = {
        "X-Sources": json.dumps(citations),
        "Access-Control-Expose-Headers": "X-Sources"
    }
    return StreamingResponse(response_generator(), headers=headers, media_type="text/plain")


# --- ORIGINAL LEGACY DATABASE HISTORY & AUTH ENDPOINTS ---

@router.post("/summarize")
async def generate_legacy_summary(req: schemas.SummarizeRequest):
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is not configured on the server")
    
    prompt_text = f"""You are a technical summarization expert. Summarize the following content into exactly {req.num_sections} sections. Each section must have a clear heading and exactly {req.lines_per_section} lines of summary. Be precise, technical, and informative. Format your response as:

SECTION 1: [Heading]
[line 1]
[line 2]
...

SECTION 2: [Heading]
...

Content to summarize:
{req.text}"""

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                GROQ_API_URL,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {api_key}"
                },
                json={
                    "model": "llama-3.3-70b-versatile",
                    "messages": [{"role": "user", "content": prompt_text}],
                    "temperature": 0.7,
                    "max_tokens": 4096
                },
                timeout=30.0
            )
            response.raise_for_status()
            data = response.json()
            result_text = data["choices"][0]["message"]["content"]
            
            return {"summary_text": result_text}
            
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=500, detail=f"Groq API Error: {e.response.text}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Groq API Error: {str(e)}")


@router.post("/summaries", response_model=schemas.SummaryResponse)
def save_summary(summary: schemas.SummaryCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_summary = models.Summary(
        user_id=current_user.id,
        title=summary.title,
        content=summary.content
    )
    db.add(db_summary)
    db.commit()
    db.refresh(db_summary)
    return db_summary

@router.get("/summaries", response_model=List[schemas.SummaryResponse])
def get_summaries(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.Summary).filter(models.Summary.user_id == current_user.id).order_by(models.Summary.created_at.desc()).all()

@router.delete("/summaries/{summary_id}")
def delete_summary(summary_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_summary = db.query(models.Summary).filter(models.Summary.id == summary_id, models.Summary.user_id == current_user.id).first()
    if not db_summary:
        raise HTTPException(status_code=404, detail="Summary not found")
    db.delete(db_summary)
    db.commit()
    return {"message": "Summary deleted"}

@router.post("/mcq-history", response_model=schemas.MCQHistoryResponse)
def save_mcq_history(history: schemas.MCQHistoryCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_history = models.MCQHistory(
        user_id=current_user.id,
        question=history.question,
        wrong_answer=history.wrong_answer,
        correct_answer=history.correct_answer,
        explanation=history.explanation
      )
    db.add(db_history)
    db.commit()
    db.refresh(db_history)
    return db_history

@router.get("/mcq-history", response_model=List[schemas.MCQHistoryResponse])
def get_mcq_history(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.MCQHistory).filter(models.MCQHistory.user_id == current_user.id).order_by(models.MCQHistory.created_at.desc()).all()

@router.delete("/mcq-history")
def clear_mcq_history(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    db.query(models.MCQHistory).filter(models.MCQHistory.user_id == current_user.id).delete()
    db.commit()
    return {"message": "History cleared"}

@router.delete("/mcq-history/{item_id}")
def delete_mcq_history_item(item_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_item = db.query(models.MCQHistory).filter(models.MCQHistory.id == item_id, models.MCQHistory.user_id == current_user.id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="MCQ history item not found")
    db.delete(db_item)
    db.commit()
    return {"message": "Item deleted"}


@router.post("/chat-summary")
async def chat_summary(req: schemas.ChatSummaryRequest):
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is not configured.")

    prompt = f"""You are a helpful AI tutor. The student is reading the following summary and has a question about it. Answer their question clearly and concisely using the summary context provided. If the answer is not in the summary, say so honestly.

Summary Context:
{req.summary_context[:16000]}

Student's Question:
{req.question}

Provide a clear, helpful answer:"""

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                GROQ_API_URL,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {api_key}",
                },
                json={
                    "model": "llama-3.3-70b-versatile",
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.7,
                    "max_tokens": 2048,
                },
                timeout=30.0,
            )
            response.raise_for_status()
            data = response.json()
            answer = data["choices"][0]["message"]["content"]
            return {"answer": answer}

    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=500, detail=f"Groq API Error: {e.response.text}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
