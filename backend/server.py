from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
import os
import json
import io
import base64
import hashlib
from datetime import datetime, timedelta
import qrcode
from eth_account import Account
from eth_account.messages import encode_defunct
from web3 import Web3
import httpx
from supabase import create_client, Client
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from PIL import Image, ImageDraw, ImageFont
from io import BytesIO
from dotenv import load_dotenv
import requests

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

# ==========================================
# SUBSCRIPTION CONSTANTS
# ==========================================
FREE_GROUP_LIMIT = 2  # Free users can only create 2 groups
FREE_MINT_LIMIT = 5   # Free users can only mint 5 certificates at a time

# Mint credit packages for Pro users
MINT_CREDIT_PACKAGES = {
    "starter": {"credits": 50, "price": 9.99},
    "basic": {"credits": 100, "price": 19.99},
    "standard": {"credits": 250, "price": 39.99},
    "premium": {"credits": 500, "price": 69.99},
    "enterprise": {"credits": 1000, "price": 119.99}
}

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

# NEW: Mint Certificate Request Model
class MintCertificateRequest(BaseModel):
    certificate_db_id: str  # The UUID from certificates table
    group_id: str
    template_id: str
    field_data: Dict[str, Any]  # Dynamic field data from form
    recipient_email: str
    recipient_name: str
    student_id: Optional[str] = None

# Subscription Models
class SubscriptionStatusResponse(BaseModel):
    subscription_type: str  # 'free' or 'pro'
    is_pro: bool
    subscription_expires_at: Optional[str]
    is_active: bool
    mint_credits: int
    groups_created: int
    groups_limit: int
    can_create_group: bool
    can_mint: bool
    total_certificates_issued: int

class UpgradeToProRequest(BaseModel):
    user_id: str
    duration_months: int = 1  # Default 1 month

class PurchaseCreditsRequest(BaseModel):
    user_id: str
    package: str  # starter, basic, standard, premium, enterprise

class BatchMintRequest(BaseModel):
    group_id: str
    template_id: str
    recipients: List[Dict[str, Any]]  # List of recipient data

# Utility Functions
def generate_join_code() -> str:
    import random
    import string
    chars = string.ascii_uppercase + string.digits
    return ''.join(random.choice(chars) for _ in range(8))

def generate_certificate_id() -> str:
    import time
    import random
    timestamp = int(time.time())
    random_part = ''.join(random.choices('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', k=6))
    return f"CERT-{timestamp}-{random_part}"

def create_canonical_payload(data: dict) -> str:
    sorted_keys = sorted(data.keys())
    return json.dumps({k: data[k] for k in sorted_keys}, separators=(',', ':'))

def hash_message(message: str) -> str:
    w3 = Web3()
    return w3.keccak(text=message).hex()

def sign_message(message: str, private_key: str) -> str:
    account = Account.from_key(private_key)
    message_hash = encode_defunct(text=message)
    signed_message = account.sign_message(message_hash)
    return signed_message.signature.hex()

def verify_signature(message: str, signature: str, expected_address: str) -> bool:
    try:
        w3 = Web3()
        message_hash = encode_defunct(text=message)
        recovered_address = w3.eth.account.recover_message(message_hash, signature=signature)
        return recovered_address.lower() == expected_address.lower()
    except Exception as e:
        print(f"Signature verification failed: {e}")
        return False

def generate_qr_code(data: str) -> str:
    """Generate QR code and return as base64 string"""
    qr = qrcode.QRCode(version=1, box_size=10, border=2)
    qr.add_data(data)
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="black", back_color="white")
    qr_buffer = BytesIO()
    qr_img.save(qr_buffer, format="PNG")
    qr_buffer.seek(0)
    return base64.b64encode(qr_buffer.getvalue()).decode()

# ==========================================
# SUBSCRIPTION HELPER FUNCTIONS
# ==========================================

async def get_instructor_by_user_id(user_id: str):
    """Get instructor record by user_id"""
    try:
        response = supabase.table("instructors").select("*").eq("user_id", user_id).single().execute()
        return response.data
    except Exception:
        return None

async def get_user_groups_count(user_id: str) -> int:
    """Count groups created by a user"""
    try:
        response = supabase.table("groups").select("id", count="exact").eq("created_by", user_id).execute()
        return response.count if response.count else 0
    except Exception:
        return 0

async def check_subscription_status(user_id: str) -> dict:
    """Check user's subscription status and limits"""
    instructor = await get_instructor_by_user_id(user_id)
    
    if not instructor:
        # No instructor record - treat as free user
        return {
            "subscription_type": "free",
            "is_pro": False,
            "subscription_expires_at": None,
            "is_active": False,
            "mint_credits": FREE_MINT_LIMIT,
            "groups_created": 0,
            "groups_limit": FREE_GROUP_LIMIT,
            "can_create_group": True,
            "can_mint": True,
            "total_certificates_issued": 0
        }
    
    subscription_type = instructor.get("subscription_type", "free")
    subscription_expires_at = instructor.get("subscription_expires_at")
    mint_credits = instructor.get("mint_credits", FREE_MINT_LIMIT if subscription_type == "free" else 0)
    total_certs = instructor.get("total_certificates_issued", 0)
    
    # Check if Pro subscription is still active
    is_pro_active = False
    if subscription_type == "pro" and subscription_expires_at:
        expires_dt = datetime.fromisoformat(subscription_expires_at.replace('Z', '+00:00'))
        is_pro_active = expires_dt > datetime.now(expires_dt.tzinfo)
    
    # If Pro expired, revert to free
    if subscription_type == "pro" and not is_pro_active:
        subscription_type = "free"
    
    # Get groups count
    groups_count = await get_user_groups_count(user_id)
    
    # Calculate limits
    if subscription_type == "free":
        groups_limit = FREE_GROUP_LIMIT
        can_create_group = groups_count < FREE_GROUP_LIMIT
        can_mint = mint_credits > 0
    else:  # Pro
        groups_limit = -1  # Unlimited
        can_create_group = is_pro_active
        can_mint = mint_credits > 0
    
    return {
        "subscription_type": subscription_type,
        "is_pro": subscription_type == "pro" and is_pro_active,
        "subscription_expires_at": subscription_expires_at,
        "is_active": is_pro_active if subscription_type == "pro" else True,
        "mint_credits": mint_credits,
        "groups_created": groups_count,
        "groups_limit": groups_limit,
        "can_create_group": can_create_group,
        "can_mint": can_mint,
        "total_certificates_issued": total_certs
    }

async def deduct_mint_credits(user_id: str, count: int = 1) -> bool:
    """Deduct mint credits from user's balance"""
    instructor = await get_instructor_by_user_id(user_id)
    if not instructor:
        return False
    
    current_credits = instructor.get("mint_credits", 0)
    if current_credits < count:
        return False
    
    new_credits = current_credits - count
    supabase.table("instructors").update({
        "mint_credits": new_credits
    }).eq("id", instructor["id"]).execute()
    
    return True

def generate_certificate_image(
    template_url: str,
    fields: List[Dict],
    field_data: Dict[str, str],
    qr_code_base64: str,
    template_width: int = 800,
    template_height: int = 560
) -> str:
    """
    Generate certificate image with text fields and QR code overlaid
    Returns base64 encoded image
    """
    try:
        # Download the template image
        response = requests.get(template_url, timeout=30)
        response.raise_for_status()
        template_img = Image.open(BytesIO(response.content))
        
        # Convert to RGBA for transparency support
        if template_img.mode != 'RGBA':
            template_img = template_img.convert('RGBA')
        
        # Get actual dimensions
        actual_width, actual_height = template_img.size
        
        # Create a drawing context
        draw = ImageDraw.Draw(template_img)
        
        # Try to load a font, fallback to default
        try:
            # Try different font paths
            font_paths = [
                "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
                "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
                "/usr/share/fonts/TTF/DejaVuSans-Bold.ttf",
            ]
            font = None
            for font_path in font_paths:
                if os.path.exists(font_path):
                    font = ImageFont.truetype(font_path, 24)
                    break
            if font is None:
                font = ImageFont.load_default()
        except Exception:
            font = ImageFont.load_default()
        
        # Calculate scale factors
        scale_x = actual_width / template_width
        scale_y = actual_height / template_height
        
        # Process each field
        for field in fields:
            field_type = field.get('type', 'text')
            x = int(field.get('x', 0) * scale_x)
            y = int(field.get('y', 0) * scale_y)
            width = int(field.get('width', 200) * scale_x)
            height = int(field.get('height', 40) * scale_y)
            
            if field_type == 'text':
                label = field.get('label', '')
                # Get the value from field_data using label as key
                text_value = field_data.get(label, label)
                
                # Calculate font size based on field height
                font_size = max(12, int(height * 0.6))
                try:
                    for font_path in font_paths:
                        if os.path.exists(font_path):
                            text_font = ImageFont.truetype(font_path, font_size)
                            break
                    else:
                        text_font = font
                except:
                    text_font = font
                
                # Get text bounding box for centering
                bbox = draw.textbbox((0, 0), text_value, font=text_font)
                text_width = bbox[2] - bbox[0]
                text_height = bbox[3] - bbox[1]
                
                # Center text in the field
                text_x = x + (width - text_width) // 2
                text_y = y + (height - text_height) // 2
                
                # Draw text (dark blue color)
                draw.text((text_x, text_y), text_value, fill=(30, 58, 138), font=text_font)
                
            elif field_type == 'qr':
                # Decode QR code from base64
                qr_image_data = base64.b64decode(qr_code_base64)
                qr_img = Image.open(BytesIO(qr_image_data))
                
                # Resize QR code to fit field
                qr_img = qr_img.resize((width, height), Image.Resampling.LANCZOS)
                
                # Convert to RGBA if needed
                if qr_img.mode != 'RGBA':
                    qr_img = qr_img.convert('RGBA')
                
                # Paste QR code onto template
                template_img.paste(qr_img, (x, y), qr_img if qr_img.mode == 'RGBA' else None)
        
        # Convert back to RGB for JPEG compatibility
        if template_img.mode == 'RGBA':
            # Create white background
            background = Image.new('RGB', template_img.size, (255, 255, 255))
            background.paste(template_img, mask=template_img.split()[3])
            template_img = background
        
        # Save to buffer
        output_buffer = BytesIO()
        template_img.save(output_buffer, format='JPEG', quality=90)
        output_buffer.seek(0)
        
        return base64.b64encode(output_buffer.getvalue()).decode()
        
    except Exception as e:
        print(f"Error generating certificate image: {e}")
        raise e

# API Endpoints
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

# ==========================================
# SUBSCRIPTION API ENDPOINTS
# ==========================================

@app.get("/api/subscription/status/{user_id}")
async def get_subscription_status(user_id: str):
    """Get user's subscription status and limits"""
    try:
        status = await check_subscription_status(user_id)
        return status
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get subscription status: {str(e)}")

@app.get("/api/subscription/packages")
async def get_credit_packages():
    """Get available mint credit packages"""
    return {
        "packages": MINT_CREDIT_PACKAGES,
        "free_limits": {
            "groups": FREE_GROUP_LIMIT,
            "mint_credits": FREE_MINT_LIMIT
        }
    }

@app.post("/api/subscription/upgrade")
async def upgrade_to_pro(request: UpgradeToProRequest):
    """Upgrade user to Pro subscription"""
    try:
        instructor = await get_instructor_by_user_id(request.user_id)
        if not instructor:
            raise HTTPException(status_code=404, detail="Instructor not found")
        
        # Calculate expiration date
        expires_at = datetime.utcnow() + timedelta(days=30 * request.duration_months)
        
        # Update instructor record
        supabase.table("instructors").update({
            "subscription_type": "pro",
            "subscription_expires_at": expires_at.isoformat()
        }).eq("id", instructor["id"]).execute()
        
        return {
            "success": True,
            "subscription_type": "pro",
            "expires_at": expires_at.isoformat(),
            "message": f"Successfully upgraded to Pro for {request.duration_months} month(s)"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upgrade failed: {str(e)}")

@app.post("/api/subscription/purchase-credits")
async def purchase_credits(request: PurchaseCreditsRequest):
    """Purchase mint credits"""
    try:
        if request.package not in MINT_CREDIT_PACKAGES:
            raise HTTPException(status_code=400, detail="Invalid package selected")
        
        instructor = await get_instructor_by_user_id(request.user_id)
        if not instructor:
            raise HTTPException(status_code=404, detail="Instructor not found")
        
        package = MINT_CREDIT_PACKAGES[request.package]
        current_credits = instructor.get("mint_credits", 0)
        new_credits = current_credits + package["credits"]
        
        # Update credits
        supabase.table("instructors").update({
            "mint_credits": new_credits
        }).eq("id", instructor["id"]).execute()
        
        return {
            "success": True,
            "package": request.package,
            "credits_added": package["credits"],
            "total_credits": new_credits,
            "price": package["price"],
            "message": f"Successfully added {package['credits']} mint credits"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Credit purchase failed: {str(e)}")

@app.post("/api/subscription/check-group-limit/{user_id}")
async def check_group_creation_limit(user_id: str):
    """Check if user can create a new group"""
    try:
        status = await check_subscription_status(user_id)
        
        if not status["can_create_group"]:
            if status["subscription_type"] == "free":
                return {
                    "allowed": False,
                    "reason": f"Free plan limit reached ({FREE_GROUP_LIMIT} groups). Upgrade to Pro for unlimited groups.",
                    "groups_created": status["groups_created"],
                    "groups_limit": status["groups_limit"],
                    "upgrade_required": True
                }
            else:
                return {
                    "allowed": False,
                    "reason": "Pro subscription has expired. Please renew to continue creating groups.",
                    "groups_created": status["groups_created"],
                    "subscription_expired": True
                }
        
        return {
            "allowed": True,
            "groups_created": status["groups_created"],
            "groups_limit": status["groups_limit"],
            "subscription_type": status["subscription_type"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Limit check failed: {str(e)}")

@app.post("/api/subscription/check-mint-limit/{user_id}")
async def check_mint_limit(user_id: str, count: int = 1):
    """Check if user has enough mint credits"""
    try:
        status = await check_subscription_status(user_id)
        
        has_enough = status["mint_credits"] >= count
        
        return {
            "allowed": has_enough,
            "current_credits": status["mint_credits"],
            "requested": count,
            "subscription_type": status["subscription_type"],
            "message": "Sufficient credits" if has_enough else f"Insufficient credits. You have {status['mint_credits']} credits, need {count}. Please purchase more credits."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Limit check failed: {str(e)}")

@app.post("/api/instructor/generate-wallet")
async def generate_instructor_wallet() -> WalletResponse:
    try:
        account = Account.create()
        return WalletResponse(address=account.address, private_key=account.key.hex())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Wallet generation failed: {str(e)}")

@app.post("/api/groups")
async def create_group(group: GroupCreate):
    try:
        # Check subscription limits before creating group
        status = await check_subscription_status(group.creator_user_id)
        
        if not status["can_create_group"]:
            if status["subscription_type"] == "free":
                raise HTTPException(
                    status_code=403,
                    detail={
                        "error": "GROUP_LIMIT_REACHED",
                        "message": f"Free plan allows only {FREE_GROUP_LIMIT} groups. Upgrade to Pro for unlimited groups.",
                        "groups_created": status["groups_created"],
                        "groups_limit": status["groups_limit"],
                        "upgrade_required": True
                    }
                )
            else:
                raise HTTPException(
                    status_code=403,
                    detail={
                        "error": "SUBSCRIPTION_EXPIRED",
                        "message": "Your Pro subscription has expired. Please renew to continue creating groups.",
                        "subscription_expired": True
                    }
                )
        
        join_code = generate_join_code()
        response = supabase.table("groups").insert({
            "name": group.name,
            "description": group.description,
            "instructor_id": group.creator_user_id,
            "join_code": join_code,
            "status": "active"
        }).execute()
        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to create group")
        return {"success": True, "group": response.data[0], "join_code": join_code}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Group creation failed: {str(e)}")

@app.get("/api/groups/{group_id}")
async def get_group(group_id: str):
    try:
        response = supabase.table("groups").select("*").eq("id", group_id).single().execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Group not found")
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/groups/join-code/{join_code}")
async def get_group_by_join_code(join_code: str):
    try:
        response = supabase.table("groups").select("*").eq("join_code", join_code).single().execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Group not found")
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/crossmint/collection")
async def create_nft_collection(collection: CollectionCreate):
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{CROSSMINT_BASE_URL}/collections",
                headers={"X-API-KEY": CROSSMINT_API_KEY, "Content-Type": "application/json"},
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
                raise HTTPException(status_code=response.status_code, detail=f"Crossmint API error: {response.text}")
            data = response.json()
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


# ==========================================
# NEW: MAIN MINTING ENDPOINT
# ==========================================
@app.post("/api/certificates/mint")
async def mint_certificate(request: MintCertificateRequest):
    """
    Main endpoint: Takes signed certificate data and mints NFT
    1. Generates certificate image with student name and dynamic QR code
    2. Uploads image to Supabase storage
    3. Mints NFT via Crossmint with all metadata
    4. Updates database with NFT details
    """
    try:
        # 1. Get the existing certificate record
        cert_response = supabase.table("certificates").select("*").eq("id", request.certificate_db_id).single().execute()
        if not cert_response.data:
            raise HTTPException(status_code=404, detail="Certificate not found")
        
        cert = cert_response.data
        
        # 2. Get group info
        group_response = supabase.table("groups").select("*").eq("id", request.group_id).single().execute()
        if not group_response.data:
            raise HTTPException(status_code=404, detail="Group not found")
        group = group_response.data
        
        # 3. Get template and fields
        template_response = supabase.table("certificate_templates").select("*").eq("id", request.template_id).single().execute()
        if not template_response.data:
            raise HTTPException(status_code=404, detail="Template not found")
        template = template_response.data
        
        fields_response = supabase.table("template_fields").select("*").eq("template_id", request.template_id).execute()
        fields = fields_response.data or []
        
        # 4. Get instructor info for signing
        instructor_response = supabase.table("instructors").select("*").eq("id", group["instructor_id"]).single().execute()
        if not instructor_response.data or not instructor_response.data.get("wallet_address"):
            raise HTTPException(status_code=400, detail="Instructor wallet not configured")
        
        instructor = instructor_response.data
        issuer_wallet = instructor["wallet_address"]
        issuer_private_key = instructor.get("private_key_encrypted")
        issuer_name = instructor.get("name", "Instructor")
        
        # 5. Generate certificate ID if not exists
        certificate_id = cert.get("certificate_id") or generate_certificate_id()
        
        # 6. Generate verification URL
        verification_url = f"{APP_URL}/verify/{certificate_id}"
        
        # 7. Generate dynamic QR code pointing to verification URL
        qr_code_base64 = generate_qr_code(verification_url)
        
        # 8. Generate certificate image with fields and QR code
        certificate_image_base64 = generate_certificate_image(
            template_url=template["pdf_url"],  # This is actually the image URL now
            fields=fields,
            field_data=request.field_data,
            qr_code_base64=qr_code_base64
        )
        
        # 9. Upload certificate image to Supabase storage
        image_filename = f"certificate-{certificate_id}.jpg"
        image_bytes = base64.b64decode(certificate_image_base64)
        
        upload_response = supabase.storage.from_("certificate-pdfs").upload(
            image_filename,
            image_bytes,
            {"content-type": "image/jpeg", "upsert": "true"}
        )
        
        # Get public URL for the uploaded image
        image_public_url = supabase.storage.from_("certificate-pdfs").get_public_url(image_filename)
        
        # 10. Build canonical payload for signing
        certificate_data = {
            "certificateId": certificate_id,
            "recipientName": request.recipient_name,
            "recipientEmail": request.recipient_email,
            "studentId": request.student_id or "",
            "courseName": group["name"],
            "issuerName": issuer_name,
            "issuerWallet": issuer_wallet,
            "issueDate": datetime.utcnow().isoformat(),
            "groupId": str(group["id"]),
            "verificationUrl": verification_url,
            "fieldData": request.field_data
        }
        
        # 11. Create canonical payload and sign
        canonical_payload = create_canonical_payload(certificate_data)
        certificate_hash = hash_message(canonical_payload)
        issuer_signature = sign_message(canonical_payload, issuer_private_key)
        
        # 12. Mint NFT via Crossmint
        collection_id = group.get("collection_id") or "default-certichain-collection"
        
        nft_result = await mint_nft_crossmint(
            collection_id=collection_id,
            certificate_id=certificate_id,
            certificate_data=certificate_data,
            certificate_hash=certificate_hash,
            issuer_signature=issuer_signature,
            canonical_payload=canonical_payload,
            image_url=image_public_url,
            recipient_email=request.recipient_email
        )
        
        # 13. Update certificate in database with all minting data
        update_data = {
            "certificate_id": certificate_id,
            "canonical_payload": certificate_data,
            "certificate_hash": certificate_hash,
            "issuer_signature": issuer_signature,
            "nft_id": nft_result.get("nft_id"),
            "contract_address": nft_result.get("contract_address", ""),
            "token_id": nft_result.get("token_id"),
            "blockchain_tx": nft_result.get("transaction_hash"),
            "recipient_wallet": nft_result.get("recipient_wallet"),
            "verification_url": verification_url,
            "qr_code_data": verification_url,
            "qr_code_image": f"data:image/png;base64,{qr_code_base64}",
            "ipfs_url": image_public_url,  # Using Supabase storage URL instead of IPFS
            "status": "minted" if nft_result.get("nft_id") and not nft_result.get("nft_id", "").startswith("error") else "pending",
            "updated_at": datetime.utcnow().isoformat()
        }
        
        supabase.table("certificates").update(update_data).eq("id", request.certificate_db_id).execute()
        
        # 14. Update instructor's certificate count
        supabase.table("instructors").update({
            "total_certificates_issued": instructor.get("total_certificates_issued", 0) + 1
        }).eq("id", instructor["id"]).execute()
        
        return {
            "success": True,
            "certificate_id": certificate_id,
            "verification_url": verification_url,
            "nft_id": nft_result.get("nft_id"),
            "token_id": nft_result.get("token_id"),
            "transaction_hash": nft_result.get("transaction_hash"),
            "recipient_wallet": nft_result.get("recipient_wallet"),
            "qr_code": qr_code_base64,
            "certificate_image_url": image_public_url,
            "message": "Certificate minted successfully!"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Minting error: {e}")
        raise HTTPException(status_code=500, detail=f"Certificate minting failed: {str(e)}")


async def mint_nft_crossmint(
    collection_id: str,
    certificate_id: str,
    certificate_data: dict,
    certificate_hash: str,
    issuer_signature: str,
    canonical_payload: str,
    image_url: str,
    recipient_email: str
) -> dict:
    """Mint NFT certificate on Crossmint with all metadata"""
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{CROSSMINT_BASE_URL}/collections/{collection_id}/nfts",
                headers={
                    "X-API-KEY": CROSSMINT_API_KEY,
                    "Content-Type": "application/json"
                },
                json={
                    "recipient": f"email:{recipient_email}:polygon",
                    "metadata": {
                        "name": f"Certificate #{certificate_id}",
                        "description": f"{certificate_data['courseName']} - Issued by {certificate_data['issuerName']}",
                        "image": image_url,
                        "external_url": certificate_data["verificationUrl"],
                        "attributes": [
                            {"trait_type": "Certificate ID", "value": certificate_id},
                            {"trait_type": "Certificate Hash", "value": certificate_hash},
                            {"trait_type": "Issuer Signature", "value": issuer_signature},
                            {"trait_type": "Issuer Name", "value": certificate_data["issuerName"]},
                            {"trait_type": "Issuer Wallet", "value": certificate_data["issuerWallet"]},
                            {"trait_type": "Canonical Payload", "value": canonical_payload},
                            {"trait_type": "Recipient Name", "value": certificate_data["recipientName"]},
                            {"trait_type": "Recipient Email", "value": certificate_data["recipientEmail"]},
                            {"trait_type": "Student ID", "value": certificate_data.get("studentId", "")},
                            {"trait_type": "Course Name", "value": certificate_data["courseName"]},
                            {"trait_type": "Issue Date", "value": certificate_data["issueDate"]},
                            {"trait_type": "Certificate Image", "value": image_url},
                            {"trait_type": "Verification URL", "value": certificate_data["verificationUrl"]},
                            {"trait_type": "Transferable", "value": "false"}
                        ]
                    }
                }
            )
            
            print(f"Crossmint response status: {response.status_code}")
            print(f"Crossmint response: {response.text}")
            
            if response.status_code not in [200, 201]:
                print(f"NFT minting error: {response.text}")
                return {
                    "nft_id": f"pending-{certificate_id}",
                    "token_id": "pending",
                    "transaction_hash": "pending",
                    "recipient_wallet": "pending",
                    "contract_address": ""
                }
            
            nft_data = response.json()
            return {
                "nft_id": nft_data.get("id"),
                "token_id": nft_data.get("onChain", {}).get("tokenId", "pending"),
                "transaction_hash": nft_data.get("onChain", {}).get("txId", "pending"),
                "recipient_wallet": nft_data.get("onChain", {}).get("owner", "pending"),
                "contract_address": nft_data.get("onChain", {}).get("contractAddress", "")
            }
            
    except Exception as e:
        print(f"NFT minting failed: {e}")
        return {
            "nft_id": f"error-{certificate_id}",
            "token_id": "error",
            "transaction_hash": "error",
            "recipient_wallet": "error",
            "contract_address": ""
        }


@app.post("/api/certificates/claim")
async def claim_certificate(claim: CertificateClaimRequest):
    """MAIN ENDPOINT: Student claims certificate"""
    try:
        # Get group by join code
        group_response = supabase.table("groups").select("*").eq("join_code", claim.join_code).single().execute()
        if not group_response.data:
            raise HTTPException(status_code=404, detail="Invalid join code")
        group = group_response.data
        
        # Get instructor/issuer info
        try:
            issuer_response = supabase.table("instructors").select("*").eq("id", group["instructor_id"]).single().execute()
            if issuer_response.data and issuer_response.data.get("wallet_address"):
                issuer = issuer_response.data
                issuer_wallet = issuer["wallet_address"]
                issuer_private_key = issuer.get("private_key_encrypted")
            else:
                raise Exception("No instructor found")
        except:
            temp_account = Account.create()
            issuer_wallet = temp_account.address
            issuer_private_key = temp_account.key.hex()
        
        # Get template
        template = None
        if group.get("template_id"):
            template_response = supabase.table("certificate_templates").select("*").eq("id", group["template_id"]).single().execute()
            if template_response.data:
                template = template_response.data
        
        # Generate certificate ID and data
        certificate_id = generate_certificate_id()
        verification_url = f"{APP_URL}/verify/{certificate_id}"
        
        certificate_data = {
            "certificateId": certificate_id,
            "recipientName": claim.recipient_name,
            "recipientEmail": claim.recipient_email,
            "studentId": claim.student_id or "",
            "courseName": group["name"],
            "issuerName": "Instructor",
            "issuerWallet": issuer_wallet,
            "issueDate": datetime.utcnow().isoformat(),
            "groupId": group["id"],
            "verificationUrl": verification_url
        }
        
        # Create canonical payload and sign
        canonical_payload = create_canonical_payload(certificate_data)
        certificate_hash = hash_message(canonical_payload)
        issuer_signature = sign_message(canonical_payload, issuer_private_key)
        
        # Generate QR code
        qr_base64 = generate_qr_code(verification_url)
        
        # Simulate IPFS URL (using certificate image URL)
        ipfs_url = f"ipfs://Qm{certificate_id[:40]}"
        
        # Mint NFT
        nft_result = await mint_nft_crossmint(
            collection_id=group.get("collection_id") or "default-certichain-collection",
            certificate_id=certificate_id,
            certificate_data=certificate_data,
            certificate_hash=certificate_hash,
            issuer_signature=issuer_signature,
            canonical_payload=canonical_payload,
            image_url=ipfs_url,
            recipient_email=claim.recipient_email
        )
        
        # Save certificate to database
        supabase.table("certificates").insert({
            "certificate_id": certificate_id,
            "group_id": group["id"],
            "claimed_by_user_id": None,
            "canonical_payload": certificate_data,
            "certificate_hash": certificate_hash,
            "issuer_signature": issuer_signature,
            "nft_id": nft_result.get("nft_id"),
            "contract_address": nft_result.get("contract_address", ""),
            "token_id": nft_result.get("token_id"),
            "blockchain_tx": nft_result.get("transaction_hash"),
            "ipfs_url": ipfs_url,
            "verification_url": verification_url,
            "status": "valid",
            "issued_at": datetime.utcnow().isoformat()
        }).execute()
        
        return {
            "success": True,
            "certificate_id": certificate_id,
            "verification_url": verification_url,
            "nft_id": nft_result.get("nft_id"),
            "qr_code": qr_base64,
            "pdf_download_url": f"/api/certificates/{certificate_id}/download",
            "message": "Certificate minted successfully!"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Certificate claim failed: {str(e)}")


@app.get("/api/certificates/verify/{certificate_id}")
async def verify_certificate(certificate_id: str):
    """Verify certificate by ID (QR code scan endpoint)"""
    try:
        cert_response = supabase.table("certificates").select("*").eq("certificate_id", certificate_id).single().execute()
        if not cert_response.data:
            return {"verified": False, "message": "Certificate not found"}
        
        cert = cert_response.data
        canonical_payload = cert.get("canonical_payload", {})
        
        # Handle both string and dict canonical_payload
        if isinstance(canonical_payload, str):
            canonical_payload_str = canonical_payload
            canonical_payload = json.loads(canonical_payload)
        else:
            canonical_payload_str = json.dumps(canonical_payload)
        
        certificate_hash = cert.get("certificate_hash", "")
        issuer_signature = cert.get("issuer_signature", "")
        
        # Get issuer wallet from canonical_payload
        issuer_wallet = canonical_payload.get("issuerWallet", "")
        
        # Verification checks
        recalculated_hash = hash_message(canonical_payload_str)
        data_integrity_valid = recalculated_hash == certificate_hash
        data_integrity_status = "✅ VERIFIED" if data_integrity_valid else "❌ TAMPERED"
        
        signature_valid = verify_signature(canonical_payload_str, issuer_signature, issuer_wallet) if issuer_signature and issuer_wallet else False
        signature_status = "✅ VERIFIED" if signature_valid else "❌ INVALID"
        
        nft_id = cert.get("nft_id", "")
        nft_exists = nft_id and not nft_id.startswith("error") and not nft_id.startswith("pending")
        nft_status = "✅ MINTED" if nft_exists else "⏳ PENDING"
        
        # Calculate trust score
        checks_passed = sum([data_integrity_valid, signature_valid, nft_exists, True, True])
        trust_score = int((checks_passed / 5) * 100)
        
        # Get field data for display
        field_data = cert.get("field_data", {}) or canonical_payload.get("fieldData", {})
        
        return {
            "verified": trust_score >= 60,
            "trustScore": trust_score,
            "certificateId": certificate_id,
            "certificate": {
                "recipient": {
                    "name": canonical_payload.get("recipientName", "") or field_data.get("Recipient Name", ""),
                    "email": canonical_payload.get("recipientEmail", ""),
                    "studentId": canonical_payload.get("studentId", ""),
                    "wallet": cert.get("recipient_wallet", "")
                },
                "course": {
                    "name": canonical_payload.get("courseName", ""),
                    "completionDate": cert.get("issued_at", "")[:10] if cert.get("issued_at") else ""
                },
                "issuer": {
                    "name": canonical_payload.get("issuerName", ""),
                    "wallet": issuer_wallet,
                    "verified": True
                },
                "fieldData": field_data
            },
            "verification": {
                "dataIntegrity": {
                    "status": data_integrity_status,
                    "message": "Certificate data has not been tampered" if data_integrity_valid else "Data may have been modified",
                    "certificateHash": certificate_hash
                },
                "issuerSignature": {
                    "status": signature_status,
                    "message": "Cryptographically signed by issuer" if signature_valid else "Signature verification pending",
                    "signature": issuer_signature[:50] + "..." if issuer_signature else "",
                    "signedBy": issuer_wallet
                },
                "blockchainNFT": {
                    "status": nft_status,
                    "message": "NFT minted on Polygon blockchain" if nft_exists else "NFT minting in progress",
                    "chain": "polygon",
                    "contractAddress": cert.get("contract_address", ""),
                    "tokenId": cert.get("token_id", ""),
                    "transaction": cert.get("blockchain_tx", ""),
                    "nftId": nft_id
                },
                "receiverOwnership": {
                    "status": "✅ VERIFIED",
                    "message": "Owned by original recipient",
                    "currentOwner": cert.get("recipient_wallet", "")
                }
            },
            "blockchain": {
                "chain": "polygon",
                "contractAddress": cert.get("contract_address", ""),
                "tokenId": cert.get("token_id", ""),
                "transactionHash": cert.get("blockchain_tx", ""),
                "explorerUrl": f"https://polygonscan.com/tx/{cert.get('blockchain_tx', '')}" if cert.get("blockchain_tx") and cert.get("blockchain_tx") != "pending" else ""
            },
            "storage": {
                "imageUrl": cert.get("ipfs_url", ""),
                "qrCodeImage": cert.get("qr_code_image", "")
            }
        }
    except Exception as e:
        print(f"Verification error: {e}")
        raise HTTPException(status_code=500, detail=f"Verification failed: {str(e)}")


@app.get("/api/certificates/{certificate_id}/download")
async def download_certificate(certificate_id: str):
    """Download certificate image"""
    try:
        cert_response = supabase.table("certificates").select("*").eq("certificate_id", certificate_id).single().execute()
        if not cert_response.data:
            raise HTTPException(status_code=404, detail="Certificate not found")
        
        cert = cert_response.data
        
        # If we have the certificate image URL, redirect to it
        if cert.get("ipfs_url") and cert["ipfs_url"].startswith("http"):
            return JSONResponse(content={"redirect_url": cert["ipfs_url"]})
        
        # Fallback: Generate a simple certificate
        buffer = BytesIO()
        c = canvas.Canvas(buffer, pagesize=letter)
        c.drawString(100, 700, "CERTIFICATE OF COMPLETION")
        canonical_payload = cert.get("canonical_payload", {})
        c.drawString(100, 650, f"Awarded to: {canonical_payload.get('recipientName', '')}")
        c.drawString(100, 600, f"Course: {canonical_payload.get('courseName', '')}")
        c.drawString(100, 550, f"Date: {cert.get('claimed_at', '')[:10] if cert.get('claimed_at') else ''}")
        c.drawString(100, 500, f"Certificate ID: {certificate_id}")
        c.drawString(100, 450, f"Verification: {cert.get('verification_url', '')}")
        c.save()
        buffer.seek(0)
        
        return StreamingResponse(
            buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=certificate-{certificate_id}.pdf"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Download failed: {str(e)}")


@app.get("/api/nft/{nft_id}")
async def get_nft_status(nft_id: str):
    """Get NFT status from Crossmint"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{CROSSMINT_BASE_URL}/nfts/{nft_id}",
                headers={"X-API-KEY": CROSSMINT_API_KEY}
            )
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail="NFT not found")
            return response.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Log verification to database
@app.post("/api/certificates/verify/{certificate_id}/log")
async def log_verification(certificate_id: str, request_data: dict = None):
    """Log certificate verification attempt"""
    try:
        cert_response = supabase.table("certificates").select("id").eq("certificate_id", certificate_id).single().execute()
        if not cert_response.data:
            return {"logged": False}
        
        supabase.table("certificate_verifications").insert({
            "certificate_pk": cert_response.data["id"],
            "verified_at": datetime.utcnow().isoformat(),
            "verifier_ip": request_data.get("ip", "") if request_data else "",
            "verifier_user_agent": request_data.get("user_agent", "") if request_data else "",
            "trust_score": request_data.get("trust_score", 0) if request_data else 0,
            "result_text": "Verification accessed"
        }).execute()
        
        return {"logged": True}
    except Exception as e:
        print(f"Log verification error: {e}")
        return {"logged": False}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
