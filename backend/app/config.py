import os
from dotenv import load_dotenv

load_dotenv()

BOLNA_API_KEY = os.getenv("BOLNA_API_KEY", "")
BOLNA_AGENT_ID = os.getenv("BOLNA_AGENT_ID", "")
BOLNA_BASE_URL = os.getenv("BOLNA_BASE_URL", "https://api.bolna.dev")