import os
import numpy as np
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct, Filter, FieldCondition, MatchValue
from fastembed import TextEmbedding

# Initialize Qdrant client lazily to avoid lock conflicts with uvicorn reloader on Windows
_client = None

def get_client():
    global _client
    if _client is None:
        qdrant_url = os.getenv("QDRANT_URL")
        qdrant_api_key = os.getenv("QDRANT_API_KEY")
        if qdrant_url:
            # Connect to Qdrant Cloud (recommended for production deployment)
            _client = QdrantClient(url=qdrant_url, api_key=qdrant_api_key)
        else:
            # Fallback to local storage (default for local development)
            QDRANT_PATH = os.path.join(os.path.dirname(__file__), "qdrant_storage")
            _client = QdrantClient(path=QDRANT_PATH)
    return _client

COLLECTION_NAME = "pdf_knowledge_base"
EMBEDDING_DIM = 384  # all-MiniLM-L6-v2 dimension

# Initialize embedding model (lazy load)
_embedding_model = None

def get_embedding_model():
    global _embedding_model
    if _embedding_model is None:
        _embedding_model = TextEmbedding(model_name="BAAI/bge-small-en-v1.5")
    return _embedding_model

def ensure_collection():
    """Create the collection if it doesn't exist."""
    collections = [c.name for c in get_client().get_collections().collections]
    if COLLECTION_NAME not in collections:
        get_client().create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(size=EMBEDDING_DIM, distance=Distance.COSINE),
        )

def chunk_text(text, chunk_size=500, overlap=50):
    """Split text into overlapping chunks by word count."""
    words = text.split()
    chunks = []
    start = 0
    while start < len(words):
        end = start + chunk_size
        chunk = " ".join(words[start:end])
        if chunk.strip():
            chunks.append(chunk)
        start += chunk_size - overlap
    return chunks

def embed_texts(texts):
    """Generate embeddings for a list of texts."""
    model = get_embedding_model()
    embeddings = list(model.embed(texts))
    return [e.tolist() for e in embeddings]

def store_document_chunks(doc_id, filename, text):
    """Chunk a document, embed it, and store in Qdrant. Returns the doc-level embedding."""
    ensure_collection()
    chunks = chunk_text(text)
    if not chunks:
        return None

    embeddings = embed_texts(chunks)

    points = []
    for i, (chunk, emb) in enumerate(zip(chunks, embeddings)):
        point_id = hash(f"{doc_id}_{i}") % (2**63)  # Unique positive int ID
        points.append(PointStruct(
            id=point_id,
            vector=emb,
            payload={
                "doc_id": doc_id,
                "filename": filename,
                "chunk_index": i,
                "text": chunk,
            }
        ))

    # Upsert in batches of 100
    for batch_start in range(0, len(points), 100):
        batch = points[batch_start:batch_start + 100]
        get_client().upsert(collection_name=COLLECTION_NAME, points=batch)

    # Return document-level embedding (average of chunk embeddings)
    doc_embedding = np.mean(embeddings, axis=0).tolist()
    return doc_embedding

def compute_similarity_matrix(doc_embeddings):
    """Compute cosine similarity between document-level embeddings.
    Returns a dict like { ("doc1", "doc2"): 0.85, ... }
    """
    doc_ids = list(doc_embeddings.keys())
    matrix = {}
    for i in range(len(doc_ids)):
        for j in range(i + 1, len(doc_ids)):
            a = np.array(doc_embeddings[doc_ids[i]])
            b = np.array(doc_embeddings[doc_ids[j]])
            norm_a = np.linalg.norm(a)
            norm_b = np.linalg.norm(b)
            if norm_a == 0 or norm_b == 0:
                similarity = 0.0
            else:
                similarity = float(np.dot(a, b) / (norm_a * norm_b))
            matrix[f"{doc_ids[i]}||{doc_ids[j]}"] = round(similarity * 100, 2)
    return matrix

def get_chunks_for_docs(doc_ids, limit=50):
    """Retrieve stored text chunks for given document IDs."""
    all_chunks = []
    for doc_id in doc_ids:
        results = get_client().scroll(
            collection_name=COLLECTION_NAME,
            scroll_filter=Filter(
                must=[FieldCondition(key="doc_id", match=MatchValue(value=doc_id))]
            ),
            limit=limit,
        )
        points = results[0]
        # Sort by chunk_index to maintain order
        points.sort(key=lambda p: p.payload.get("chunk_index", 0))
        all_chunks.extend([p.payload["text"] for p in points])
    return all_chunks

def search_by_topic(topic, doc_ids=None, top_k=10):
    """Embed a topic and search for the most relevant chunks."""
    topic_embedding = embed_texts([topic])[0]

    search_filter = None
    if doc_ids:
        search_filter = Filter(
            should=[
                FieldCondition(key="doc_id", match=MatchValue(value=did))
                for did in doc_ids
            ]
        )

    results = get_client().query_points(
        collection_name=COLLECTION_NAME,
        query=topic_embedding,
        query_filter=search_filter,
        limit=top_k,
    )

    return [
        {"text": r.payload["text"], "filename": r.payload["filename"], "score": r.score}
        for r in results.points
    ]

def check_doc_exists(doc_id):
    """Check if a document already has embeddings stored."""
    try:
        results = get_client().scroll(
            collection_name=COLLECTION_NAME,
            scroll_filter=Filter(
                must=[FieldCondition(key="doc_id", match=MatchValue(value=doc_id))]
            ),
            limit=1,
        )
        return len(results[0]) > 0
    except Exception:
        return False
