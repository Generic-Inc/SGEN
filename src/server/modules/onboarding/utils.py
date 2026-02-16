import os
from dotenv import load_dotenv

# Try importing Pinecone, but prepare to fail gracefully
try:
    from pinecone import Pinecone
except ImportError:
    Pinecone = None

load_dotenv()

print("--- ⚠️ PINECONE BYPASS MODE ACTIVE ⚠️ ---")


# --- MOCK CLASSES (Fake Pinecone) ---
# These classes look like Pinecone but do nothing, preventing crashes.
class MockIndex:
    def upsert_records(self, *args, **kwargs):
        print(f"  [Mock] Would upsert to Pinecone: {kwargs.get('records', 'Unknown')}")
        return {}

    def search_records(self, *args, **kwargs):
        print(f"  [Mock] Would search Pinecone for: {kwargs.get('query', 'Unknown')}")
        # Return a fake empty result to keep the frontend happy
        return {"matches": []}


class MockPinecone:
    def __init__(self, api_key=None):
        pass

    def has_index(self, name):
        return True  # Pretend the index exists

    def create_index_for_model(self, *args, **kwargs):
        print(f"  [Mock] Would create index: {kwargs}")

    def Index(self, name):
        return MockIndex()


# --- INITIALIZATION ---
INDEX_NAME = "auto-embed-communities"
namespace = "communities"

try:
    # 1. Try to get the real key
    api_key = os.getenv("PINECONE_API_KEY")

    # 2. If key exists, try to initialize (But wrap in try/except!)
    if api_key:
        pc = Pinecone(api_key=api_key)
        # We try to access the index to check if the key is ACTUALLY valid
        # If this line fails (401 Unauthorized), we jump to the except block
        index = pc.Index(INDEX_NAME)
    else:
        raise ValueError("No API Key found")

except Exception as e:
    # 3. FALLBACK: If anything goes wrong (Invalid Key, No Internet, etc.)
    print(f"⚠️ Pinecone Connection Failed ({e}). Switching to Mock Mode.")
    pc = MockPinecone()
    index = pc.Index(INDEX_NAME)


# --- EXPORTED FUNCTIONS ---
# These signatures match your original file so imports don't break.

def add_community_to_db(community_id, interest_text):
    """
    Sends raw text to Pinecone (Safely).
    """
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
        print(f"⚠️ Failed to add community to vector DB: {e}")


def edit_community_in_db(community_id, new_interest_text):
    """Updates work exactly like adds."""
    add_community_to_db(community_id, new_interest_text)


def search_communities(query_text):
    """
    Search using raw text (Safely).
    """
    try:
        return index.search_records(
            namespace=namespace,
            query={
                "inputs": {"text": query_text},
                "top_k": 3
            }
        )
    except Exception as e:
        print(f"⚠️ Failed to search communities: {e}")
        return {"matches": []}