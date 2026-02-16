import os
from dotenv import load_dotenv
from pinecone import Pinecone

load_dotenv()

# 1. Initialize Pinecone
pc = Pinecone(api_key="i dont wanna include api key cause im not even using it")

INDEX_NAME = "auto-embed-communities"
namespace = "communities"

# Define index globally as None first so functions don't crash if setup fails
index = None

# 2. Create an Integrated Index (Run this once)
try:
    # We use a broad try/except to catch ANY Pinecone error (Auth, Connection, etc.)
    # Note: pc.has_index is deprecated in newer SDKs, list_indexes is safer
    existing_indexes = [i.name for i in pc.list_indexes()]

    if INDEX_NAME not in existing_indexes:
        pc.create_index_for_model(
            name=INDEX_NAME,
            cloud="aws",
            region="us-east-1",
            embed={
                "model": "multilingual-e5-large",
                "field_map": {"text": "interest_text"}
            }
        )

    # Connect to the index if setup succeeded
    index = pc.Index(INDEX_NAME)

except Exception as e:
    # This block now correctly uses 'except' instead of 'else'
    print(f"⚠️ Skipping Pinecone setup (running in offline mode): {e}")
    index = None


def add_community_to_db(community_id, interest_text):
    """
    Sends raw text to Pinecone.
    """
    if index is None:
        print(f"[MOCK] Would add to Pinecone: {community_id} - {interest_text}")
        return

    print(community_id, interest_text)
    try:
        index.upsert_records(
            records=[
                {
                    "_id": str(community_id),
                    "interest_text": interest_text,
                    "community_id": community_id
                }
            ],
            namespace=namespace
        )
    except Exception as e:
        print(f"Failed to upsert to Pinecone: {e}")


def edit_community_in_db(community_id, new_interest_text):
    """Updates work exactly like adds."""
    add_community_to_db(community_id, new_interest_text)


def search_communities(query_text):
    """
    Search using raw text.
    """
    if index is None:
        print(f"[MOCK] Would search Pinecone for: {query_text}")
        return {"result": {"hits": []}}  # Return empty structure to prevent crashes

    try:
        return index.search_records(
            namespace=namespace,
            query={
                "inputs": {"text": query_text},
                "top_k": 3
            }
        )
    except Exception as e:
        print(f"Pinecone search failed: {e}")
        return {"result": {"hits": []}}


if __name__ == "__main__":
    # Example usage: No manual vector handling required!

    results = search_communities("digital art and sprites")
    print(results)