import chromadb
from google import genai
import os

from dotenv import load_dotenv

load_dotenv()
gemini_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


def get_google_embedding(text):
    """Generates a 768-dimension vector using Google's model."""
    result = gemini_client.models.embed_content(
        model="gemini-embedding-001",
        content=text
    )
    return result.embeddings


client = chromadb.PersistentClient(path="./my_vector_db")
collection = client.get_or_create_collection(name="communities")


def add_community_to_db(community_id, interest_text):
    """Embeds the interest and stores it in Chroma."""
    vector = get_google_embedding(interest_text)

    collection.add(
        ids=[str(community_id)],
        embeddings=[vector],
        metadatas=[{"community_id": community_id}],
        documents=[interest_text]
    )


def edit_community_in_db(community_id, new_interest_text):
    """
    Updates an existing community's embedding and text.
    Uses 'update' to modify existing records based on ID.
    """
    new_vector = get_google_embedding(new_interest_text)

    collection.update(
        ids=[str(community_id)],
        embeddings=[new_vector],
        metadatas=[{"community_id": community_id}],
        documents=[new_interest_text]
    )



