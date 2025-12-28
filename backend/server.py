from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
import os
import json
import io
import base64
import hashlib
from datetime import datetime
import qrcode
from eth_account import Account
from eth_account.messages import encode_defunct
from web3 import Web3
import httpx
from supabase import create_client, Client
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from PyPDF2 import PdfReader, PdfWriter
from io import BytesIO
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="CertiChain API", version="1.0.0")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")
CROSSMINT_API_KEY = os.getenv("CROSSMINT_API_KEY")
CROSSMINT_BASE_URL = os.getenv("CROSSMINT_BASE_URL", "https://staging.crossmint.com/api/2022-06-09")
APP_URL = os.getenv("APP_URL", "http://localhost:3000")

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Pydantic Models
class WalletResponse(BaseModel):
    address: str
    private_key: str

class GroupCreate(BaseModel):
    name: str
    description: Optional[str] = None
    max_learners: int = 100
    creator_user_id: str

class CertificateClaimRequest(BaseModel):
    join_code: str
    recipient_name: str
    recipient_email: EmailStr
    student_id: Optional[str] = None

class CollectionCreate(BaseModel):
    name: str
    description: str
    symbol: str
    chain: str = "polygon"

# =====================================================
# UTILITY FUNCTIONS
# =====================================================

def generate_join_code() -> str:
    """Generate random 8-character join code"""
    import random
    import string
    chars = string.ascii_uppercase + string.digits
    return ''.join(random.choice(chars) for _ in range(8))

def generate_certificate_id() -> str:
    """Generate unique certificate ID"""
    import time
    import random
    timestamp = int(time.time())
    random_part = ''.join(random.choices('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', k=6))
    return f"CERT-{timestamp}-{random_part}"

def create_canonical_payload(data: dict) -> str:
    """Create canonical JSON payload with sorted keys"""
    sorted_keys = sorted(data.keys())
    return json.dumps({k: data[k] for k in sorted_keys}, separators=(',', ':'))

def hash_message(message: str) -> str:
    """Hash message using Web3 message hashing"""
    w3 = Web3()
    message_hash = encode_defunct(text=message)
    return w3.keccak(text=message).hex()

def sign_message(message: str, private_key: str) -> str:
    """Sign message with private key"""
    account = Account.from_key(private_key)
    message_hash = encode_defunct(text=message)
    signed_message = account.sign_message(message_hash)
    return signed_message.signature.hex()

def verify_signature(message: str, signature: str, expected_address: str) -> bool:
    """Verify signature matches expected address"""
    try:
        w3 = Web3()
        message_hash = encode_defunct(text=message)
        recovered_address = w3.eth.account.recover_message(message_hash, signature=signature)
        return recovered_address.lower() == expected_address.lower()
    except Exception as e:
        print(f"Signature verification failed: {e}")
        return False

# =====================================================
# API ENDPOINTS
# =====================================================

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

@app.post("/api/instructor/generate-wallet")
async def generate_instructor_wallet() -> WalletResponse:
    """
    Generate a new Ethereum wallet for instructor
    This wallet will be used to sign certificates
    """
    try:
        # Generate new wallet
        account = Account.create()
        
        return WalletResponse(
            address=account.address,
            private_key=account.key.hex()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Wallet generation failed: {str(e)}")

@app.post("/api/groups")
async def create_group(group: GroupCreate):
    """
    Create a new certificate group/course
    """
    try:
        join_code = generate_join_code()
        
        # Insert group into database
        response = supabase.table("groups").insert({
            "name": group.name,
            "description": group.description,
            "created_by": group.creator_user_id,
            "max_learners": group.max_learners,
            "status": "active",
            "join_code": join_code,
            "learner_count": 0
        }).execute()
        
        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to create group")
        
        return {
            "success": True,
            "group": response.data[0],
            "join_code": join_code
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Group creation failed: {str(e)}")

@app.get("/api/groups/{group_id}")
async def get_group(group_id: str):
    """
    Get group details by ID
    """
    try:
        response = supabase.table("groups").select("*").eq("id", group_id).single().execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Group not found")
        
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/groups/join-code/{join_code}")
async def get_group_by_join_code(join_code: str):
    """
    Get group details by join code
    """
    try:
        response = supabase.table("groups").select("*").eq("join_code", join_code).single().execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Group not found")
        
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/crossmint/collection")
async def create_nft_collection(collection: CollectionCreate):
    """
    Create NFT collection on Crossmint (one-time setup)
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{CROSSMINT_BASE_URL}/collections",
                headers={
                    "X-API-KEY": CROSSMINT_API_KEY,
                    "Content-Type": "application/json"
                },
                json={
                    "chain": collection.chain,
                    "metadata": {
                        "name": collection.name,
                        "description": collection.description,
                        "symbol": collection.symbol
                    }
                }
            )
            
            if response.status_code not in [200, 201]:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Crossmint API error: {response.text}"
                )
            
            data = response.json()
            
            # Store collection in database
            supabase.table("collections").insert({
                "collection_id": data.get("id"),
                "name": collection.name,
                "description": collection.description,
                "symbol": collection.symbol,
                "chain": collection.chain,
                "contract_address": data.get("contractAddress")
            }).execute()
            
            return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Collection creation failed: {str(e)}")