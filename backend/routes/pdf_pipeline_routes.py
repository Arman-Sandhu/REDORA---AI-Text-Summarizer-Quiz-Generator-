import os
import httpx
import json
from fastapi import APIRouter, HTTPException
import schemas
import vector_db

router = APIRouter(prefix="/api/pipeline", tags=["pipeline"])

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"


@router.post("/process")
async def process_documents(req: schemas.PipelineProcessRequest):
    """
    Accept multiple PDF documents (text already extracted by frontend).
    Generate embeddings, store in Qdrant, return similarity matrix.
    Embeddings are only generated if the doc_id doesn't already exist.
    """
    if not req.documents:
        raise HTTPException(status_code=400, detail="No documents provided.")

    doc_embeddings = {}

    for doc in req.documents:
        # Check if embeddings already exist for this document
        if vector_db.check_doc_exists(doc.doc_id):
            # Re-compute doc-level embedding from stored chunks for similarity calc
            chunks = vector_db.get_chunks_for_docs([doc.doc_id], limit=200)
            if chunks:
                chunk_embs = vector_db.embed_texts(chunks)
                import numpy as np
                doc_embeddings[doc.doc_id] = np.mean(chunk_embs, axis=0).tolist()
        else:
            # Generate embeddings and store
            doc_embedding = vector_db.store_document_chunks(
                doc_id=doc.doc_id,
                filename=doc.filename,
                text=doc.text,
            )
            if doc_embedding:
                doc_embeddings[doc.doc_id] = doc_embedding

    # Compute similarity matrix
    similarity_matrix = vector_db.compute_similarity_matrix(doc_embeddings)

    # Build response with doc info
    documents_info = [
        {"doc_id": doc.doc_id, "filename": doc.filename}
        for doc in req.documents
    ]

    return {
        "documents": documents_info,
        "similarity_matrix": similarity_matrix,
    }


@router.post("/summarize")
async def pipeline_summarize(req: schemas.PipelineSummarizeRequest):
    """
    Fetch chunks for selected doc_ids from Qdrant and generate a unified summary via Groq.
    """
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is not configured.")

    chunks = vector_db.get_chunks_for_docs(req.doc_ids, limit=100)
    if not chunks:
        raise HTTPException(status_code=404, detail="No content found for the selected documents.")

    # Truncate to fit context window (~6000 tokens worth of text)
    combined_text = "\n\n".join(chunks)
    if len(combined_text) > 24000:
        combined_text = combined_text[:24000] + "\n\n[Content truncated due to length...]"

    prompt = f"""You are a technical summarization expert. Summarize the following content into exactly {req.num_sections} sections. Each section must have a clear heading and exactly {req.lines_per_section} lines of summary. Be precise, technical, and informative. Format your response as:

SECTION 1: [Heading]
[line 1]
[line 2]
...

SECTION 2: [Heading]
...

Content to summarize:
{combined_text}"""

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
                    "max_tokens": 4096,
                },
                timeout=60.0,
            )
            response.raise_for_status()
            data = response.json()
            result_text = data["choices"][0]["message"]["content"]
            return {"summary_text": result_text}

    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=500, detail=f"Groq API Error: {e.response.text}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Groq API Error: {str(e)}")


@router.post("/teach")
async def pipeline_teach(req: schemas.PipelineTeachRequest):
    """
    RAG-based topic teaching: embed the topic, search Qdrant for relevant chunks,
    and use Groq to teach the topic using only the retrieved context.
    """
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is not configured.")

    if not req.topic.strip():
        raise HTTPException(status_code=400, detail="Topic cannot be empty.")

    # Search for relevant chunks
    results = vector_db.search_by_topic(
        topic=req.topic,
        doc_ids=req.doc_ids if req.doc_ids else None,
        top_k=15,
    )

    if not results:
        raise HTTPException(status_code=404, detail="No relevant content found in the uploaded PDFs.")

    # Build context from retrieved chunks
    context_parts = []
    for r in results:
        context_parts.append(f"[Source: {r['filename']} | Relevance: {r['score']:.2f}]\n{r['text']}")
    context = "\n\n---\n\n".join(context_parts)

    prompt = f"""You are an expert tutor. The student wants to learn about: "{req.topic}"

Based STRICTLY on the following content extracted from their uploaded documents, teach them this topic in a clear, structured, and detailed manner. Use examples from the provided text where possible. If the documents don't contain enough information about the topic, clearly state that.

Reference Material:
{context}

Now teach the student about "{req.topic}" using the above material. Structure your response with clear headings and explanations."""

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
                    "max_tokens": 4096,
                },
                timeout=60.0,
            )
            response.raise_for_status()
            data = response.json()
            result_text = data["choices"][0]["message"]["content"]

            # Include source info in response
            sources = list(set(r["filename"] for r in results))
            return {"teaching": result_text, "sources": sources}

    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=500, detail=f"Groq API Error: {e.response.text}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Groq API Error: {str(e)}")
