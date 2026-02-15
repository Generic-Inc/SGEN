import os
from dotenv import load_dotenv

from pinecone import Pinecone

load_dotenv()

# 1. Initialize Pinecone
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))

INDEX_NAME = "auto-embed-communities"
namespace="communities"

# 2. Create an Integrated Index (Run this once)
if not pc.has_index(INDEX_NAME):
    pc.create_index_for_model(
        name=INDEX_NAME,
        cloud="aws",
        region="us-east-1",
        embed={
            "model": "multilingual-e5-large",  # Pinecone's hosted model
            "field_map": {"text": "interest_text"}  # Tells Pinecone which field to embed
        }
    )

# Connect to the index
index = pc.Index(INDEX_NAME)


def add_community_to_db(community_id, interest_text):
    """
    Sends raw text to Pinecone.
    The 'upsert_records' method triggers automatic embedding.
    """
    print(community_id, interest_text)
    index.upsert_records(
        records=[
            {
                "_id": str(community_id),  # Unique ID for the record
                "interest_text": interest_text,
                "community_id": community_id  # Store the community ID for retrieval
            }
        ],
        namespace=namespace
    )


def edit_community_in_db(community_id, new_interest_text):
    """Updates work exactly like adds."""
    add_community_to_db(community_id, new_interest_text)


def search_communities(query_text):
    """
    Search using raw text. Pinecone embeds the query for you!
    """
    return index.search_records(
        namespace=namespace,
        query={
            "inputs": {"text": query_text},
            "top_k": 3
        }
    )


if __name__ == "__main__":
    # Example usage: No manual vector handling required!

    results = search_communities("digital art and sprites")
    print(results)