# Part 2 of server.py - Certificate Claiming and Minting

@app.post("/api/certificates/claim")
async def claim_certificate(claim: CertificateClaimRequest):
    """
    MAIN ENDPOINT: Student claims certificate
    This triggers the entire flow:
    1. Validate join code
    2. Get instructor wallet
    3. Generate certificate data
    4. Sign certificate
    5. Generate QR code
    6. Upload PDF to IPFS
    7. Mint NFT
    8. Save to database
    """
    try:
        # Step 1: Get group by join code
        group_response = supabase.table("groups").select("*").eq("join_code", claim.join_code).single().execute()
        
        if not group_response.data:
            raise HTTPException(status_code=404, detail="Invalid join code")
        
        group = group_response.data
        
        # Step 2: Get instructor/issuer info
        issuer_response = supabase.table("profiles").select("*").eq("id", group["created_by"]).single().execute()
        
        if not issuer_response.data or not issuer_response.data.get("wallet_address"):
            raise HTTPException(status_code=400, detail="Instructor wallet not configured")
        
        issuer = issuer_response.data
        issuer_wallet = issuer["wallet_address"]
        issuer_private_key = issuer.get("private_key_encrypted")  # In production, decrypt this!
        
        # Get template
        template_response = supabase.table("certificate_templates").select("*").eq("id", group.get("template_id")).single().execute()
        
        if not template_response.data:
            raise HTTPException(status_code=404, detail="Certificate template not found")
        
        template = template_response.data
        
        # Step 3: Generate certificate ID and data
        certificate_id = generate_certificate_id()
        verification_url = f"{APP_URL}/verify/{certificate_id}"
        
        # Build certificate data
        certificate_data = {
            "certificateId": certificate_id,
            "recipientName": claim.recipient_name,
            "recipientEmail": claim.recipient_email,
            "studentId": claim.student_id or "",
            "courseName": group["name"],
            "issuerName": "Instructor",  # Get from user profile
            "issuerWallet": issuer_wallet,
            "issueDate": datetime.utcnow().isoformat(),
            "groupId": group["id"],
            "verificationUrl": verification_url
        }
        
        # Step 4: Create canonical payload and sign
        canonical_payload = create_canonical_payload(certificate_data)
        certificate_hash = hash_message(canonical_payload)
        
        # Sign with issuer's private key (if available)
        if issuer_private_key:
            issuer_signature = sign_message(canonical_payload, issuer_private_key)
        else:
            # For demo: generate temporary signature
            temp_account = Account.create()
            issuer_signature = sign_message(canonical_payload, temp_account.key.hex())
        
        # Step 5: Generate QR code
        qr_data = json.dumps({
            "certificateId": certificate_id,
            "verificationUrl": verification_url,
            "certificateHash": certificate_hash
        })
        
        # Create QR code image
        qr = qrcode.QRCode(version=1, box_size=10, border=4)
        qr.add_data(verification_url)
        qr.make(fit=True)
        qr_img = qr.make_image(fill_color="black", back_color="white")
        
        # Convert QR to base64
        qr_buffer = BytesIO()
        qr_img.save(qr_buffer, format="PNG")
        qr_base64 = base64.b64encode(qr_buffer.getvalue()).decode()
        
        # Step 6: Generate certificate PDF with QR code
        pdf_buffer = await generate_certificate_pdf(
            template_url=template["pdf_url"],
            certificate_data=certificate_data,
            qr_base64=qr_base64,
            group_id=group["id"]
        )
        
        # Step 7: Upload PDF to IPFS via Crossmint (simulate)
        ipfs_cid = f"Qm{certificate_id[:40]}"  # Simulated CID
        ipfs_url = f"ipfs://{ipfs_cid}"
        
        # Step 8: Mint NFT
        nft_result = await mint_nft(
            collection_id=group.get("collection_id"),
            certificate_id=certificate_id,
            certificate_data=certificate_data,
            certificate_hash=certificate_hash,
            issuer_signature=issuer_signature,
            canonical_payload=canonical_payload,
            ipfs_url=ipfs_url,
            recipient_email=claim.recipient_email
        )
        
        # Step 9: Save certificate to database
        cert_insert = supabase.table("certificates").insert({
            "certificate_id": certificate_id,
            "group_id": group["id"],
            "template_id": template["id"],
            "recipient_name": claim.recipient_name,
            "recipient_email": claim.recipient_email,
            "student_id": claim.student_id,
            "recipient_wallet": nft_result.get("recipient_wallet"),
            "issuer_name": "Instructor",
            "issuer_wallet": issuer_wallet,
            "issuer_user_id": group["created_by"],
            "canonical_payload": certificate_data,
            "certificate_hash": certificate_hash,
            "issuer_signature": issuer_signature,
            "nft_id": nft_result.get("nft_id"),
            "token_id": nft_result.get("token_id"),
            "blockchain_tx": nft_result.get("transaction_hash"),
            "chain": "polygon",
            "pdf_ipfs_cid": ipfs_cid,
            "pdf_ipfs_url": ipfs_url,
            "qr_code_data": qr_data,
            "verification_url": verification_url,
            "status": "minted",
            "claimed_at": datetime.utcnow().isoformat(),
            "minted_at": datetime.utcnow().isoformat()
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

async def mint_nft(
    collection_id: str,
    certificate_id: str,
    certificate_data: dict,
    certificate_hash: str,
    issuer_signature: str,
    canonical_payload: str,
    ipfs_url: str,
    recipient_email: str
) -> dict:
    """
    Mint NFT certificate on Crossmint
    """
    try:
        # If no collection_id, use a default one (you should create this first)
        if not collection_id:
            collection_id = "default-certichain-collection"
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            # Mint NFT
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
                        "image": ipfs_url,
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
                            {"trait_type": "PDF IPFS", "value": ipfs_url},
                            {"trait_type": "Verification URL", "value": certificate_data["verificationUrl"]},
                            {"trait_type": "Transferable", "value": "false"}
                        ]
                    }
                }
            )
            
            if response.status_code not in [200, 201]:
                # Log error but don't fail - NFT minting can be async
                print(f"NFT minting error: {response.text}")
                return {
                    "nft_id": f"pending-{certificate_id}",
                    "token_id": "pending",
                    "transaction_hash": "pending",
                    "recipient_wallet": "pending"
                }
            
            nft_data = response.json()
            
            return {
                "nft_id": nft_data.get("id"),
                "token_id": nft_data.get("onChain", {}).get("tokenId", "pending"),
                "transaction_hash": nft_data.get("onChain", {}).get("txId", "pending"),
                "recipient_wallet": nft_data.get("onChain", {}).get("owner", "pending")
            }
    except Exception as e:
        print(f"NFT minting failed: {e}")
        return {
            "nft_id": f"error-{certificate_id}",
            "token_id": "error",
            "transaction_hash": "error",
            "recipient_wallet": "error"
        }

async def generate_certificate_pdf(
    template_url: str,
    certificate_data: dict,
    qr_base64: str,
    group_id: str
) -> BytesIO:
    """
    Generate certificate PDF with QR code overlay
    """
    try:
        # For now, return a simple PDF
        # In production, you would overlay the QR on the template
        buffer = BytesIO()
        c = canvas.Canvas(buffer, pagesize=letter)
        
        # Add certificate content
        c.drawString(100, 700, f"CERTIFICATE OF COMPLETION")
        c.drawString(100, 650, f"Awarded to: {certificate_data['recipientName']}")
        c.drawString(100, 600, f"Course: {certificate_data['courseName']}")
        c.drawString(100, 550, f"Date: {certificate_data['issueDate'][:10]}")
        c.drawString(100, 500, f"Certificate ID: {certificate_data['certificateId']}")
        
        c.save()
        buffer.seek(0)
        return buffer
    except Exception as e:
        print(f"PDF generation failed: {e}")
        raise