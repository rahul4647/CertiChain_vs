# CertiChain Backend API - Blockchain Certificate System

Production-ready FastAPI backend for blockchain-verified certificate issuance using Crossmint NFT minting, Supabase database, and cryptographic signatures.

## 🚀 Features

- **Wallet Generation**: Generate Ethereum wallets for instructors
- **Certificate Minting**: Mint NFT certificates on Polygon blockchain via Crossmint
- **Digital Signatures**: Sign certificates with instructor's private key
- **QR Code Generation**: Dynamic QR codes for certificate verification
- **Blockchain Verification**: Complete verification flow with 5-point trust score
- **IPFS Storage**: Certificate PDFs stored on IPFS
- **Supabase Integration**: PostgreSQL database with Row Level Security

## 📋 Prerequisites

- Python 3.11+
- Supabase Account (Database + Storage)
- Crossmint API Key (Staging or Production)
- All dependencies installed from `requirements.txt`

## 🔧 Setup

### 1. Install Dependencies

```bash
cd /app/backend
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Create `.env` file with:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
CROSSMINT_API_KEY=sk_staging_xxxxx
CROSSMINT_BASE_URL=https://staging.crossmint.com/api/2022-06-09
APP_URL=http://localhost:3000
BACKEND_PORT=8001
```

### 3. Setup Database

Run the SQL schema in Supabase:

```bash
# In Supabase SQL Editor, execute:
cat schema.sql
```

Create storage buckets in Supabase Dashboard:
- `certificate-templates` (public)
- `certificate-pdfs` (public)

### 4. Run Server

```bash
# Development
python server.py

# Or with uvicorn
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

## 📡 API Endpoints

### Health Check
```bash
GET /api/health
```

### Wallet Management
```bash
POST /api/instructor/generate-wallet
Response: {"address": "0x...", "private_key": "..."}
```

### Group Management
```bash
POST /api/groups
Body: {
  "name": "Web Development Bootcamp",
  "description": "Complete course",
  "max_learners": 100,
  "creator_user_id": "uuid"
}

GET /api/groups/{group_id}
GET /api/groups/join-code/{join_code}
```

### NFT Collection (One-time Setup)
```bash
POST /api/crossmint/collection
Body: {
  "name": "CertiChain Certificates",
  "description": "Blockchain-verified educational certificates",
  "symbol": "CERT",
  "chain": "polygon"
}
```

### Certificate Claiming (Main Flow)
```bash
POST /api/certificates/claim
Body: {
  "join_code": "ABCD1234",
  "recipient_name": "John Doe",
  "recipient_email": "john@example.com",
  "student_id": "STU-12345"
}

Response: {
  "success": true,
  "certificate_id": "CERT-1234567890-ABC123",
  "verification_url": "http://localhost:3000/verify/CERT-...",
  "nft_id": "nft-abc-123",
  "qr_code": "base64_qr_image",
  "pdf_download_url": "/api/certificates/CERT-.../download",
  "message": "Certificate minted successfully!"
}
```

### Certificate Verification
```bash
GET /api/certificates/verify/{certificate_id}

Response: {
  "verified": true,
  "trustScore": 100,
  "certificateId": "CERT-...",
  "certificate": {
    "recipient": {...},
    "course": {...},
    "issuer": {...}
  },
  "verification": {
    "dataIntegrity": {"status": "✅ VERIFIED", ...},
    "issuerSignature": {"status": "✅ VERIFIED", ...},
    "blockchainNFT": {"status": "✅ EXISTS", ...},
    "receiverOwnership": {"status": "✅ VERIFIED", ...}
  },
  "blockchain": {...},
  "storage": {...}
}
```

### Certificate Download
```bash
GET /api/certificates/{certificate_id}/download
Returns: PDF file with certificate details
```

### NFT Status
```bash
GET /api/nft/{nft_id}
Returns: Crossmint NFT details
```

## 🔐 Security Features

1. **Cryptographic Signatures**: All certificates signed with instructor's private key
2. **Canonical Payload**: Sorted JSON ensures consistent hashing
3. **Hash Verification**: Certificate data integrity verification
4. **Signature Verification**: Recover and verify signer address
5. **NFT Non-Transferable**: Certificates marked as non-transferable
6. **Row Level Security**: Supabase RLS policies protect data

## 🏗️ Architecture

### Certificate Claiming Flow

1. **Validate Join Code**: Verify group exists
2. **Get Issuer Wallet**: Retrieve instructor's wallet address
3. **Generate Certificate Data**: Create unique certificate ID and data
4. **Sign Certificate**: Create canonical payload and sign with private key
5. **Generate QR Code**: Create QR with verification URL
6. **Upload to IPFS**: Store certificate PDF (via Crossmint)
7. **Mint NFT**: Mint on Polygon blockchain with all metadata
8. **Save to Database**: Store complete certificate record

### Verification Flow

1. **Fetch Certificate**: Retrieve from database
2. **Hash Verification**: Recalculate hash and compare
3. **Signature Verification**: Recover address from signature
4. **NFT Verification**: Check blockchain existence
5. **Trust Score**: Calculate 5-point verification score

## 🗄️ Database Schema

### Tables

- `profiles`: Extended user profiles with wallet info
- `groups`: Certificate groups/courses
- `certificate_templates`: PDF templates
- `template_fields`: Dynamic fields on templates
- `certificates`: Issued certificates with NFT data
- `nft_metadata`: Blockchain metadata
- `collections`: NFT collections

See `schema.sql` for complete schema.

## 🧪 Testing

### Test Wallet Generation
```bash
curl -X POST http://localhost:8001/api/instructor/generate-wallet
```

### Test Certificate Claim
```bash
curl -X POST http://localhost:8001/api/certificates/claim \
  -H "Content-Type: application/json" \
  -d '{
    "join_code": "YOUR_CODE",
    "recipient_name": "Test User",
    "recipient_email": "test@example.com",
    "student_id": "TEST-001"
  }'
```

### Test Verification
```bash
curl http://localhost:8001/api/certificates/verify/CERT-1234567890-ABC123
```

## 📝 Important Notes

### Crossmint Integration

- **Staging vs Production**: Use staging for testing
- **NFT Minting Time**: 30-60 seconds for on-chain confirmation
- **Email Delivery**: Crossmint creates custodial wallets for email recipients
- **Collection Required**: Create collection before minting first certificate

### Private Key Storage

**⚠️ CRITICAL**: In production:
1. Encrypt private keys before storing in database
2. Use KMS (AWS KMS, Google Cloud KMS, etc.)
3. Never expose private keys in API responses
4. Implement proper key rotation

### Environment Variables

Never commit `.env` file to version control. All sensitive data should be in environment variables.

## 🚨 Error Handling

The API returns structured error responses:

```json
{
  "detail": "Error message here"
}
```

HTTP Status Codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 404: Not Found
- 500: Internal Server Error

## 📊 Monitoring

Check logs:
```bash
tail -f /var/log/supervisor/backend.out.log
tail -f /var/log/supervisor/backend.err.log
```

## 🔄 Deployment

### Supervisor Configuration

```ini
[program:backend]
command=/root/.venv/bin/python -m uvicorn server:app --host 0.0.0.0 --port 8001
directory=/app/backend
autostart=true
autorestart=true
```

### Commands

```bash
sudo supervisorctl restart backend
sudo supervisorctl status backend
sudo supervisorctl tail -f backend
```

## 📚 Additional Resources

- [Crossmint API Docs](https://docs.crossmint.com/)
- [Supabase Docs](https://supabase.com/docs)
- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [Web3.py Docs](https://web3py.readthedocs.io/)

## 🐛 Common Issues

### Issue: NFT Minting Fails
**Solution**: Check Crossmint API key and collection ID. Ensure collection exists.

### Issue: Signature Verification Fails
**Solution**: Ensure canonical payload is sorted. Check private key format.

### Issue: Database Connection Error
**Solution**: Verify Supabase credentials in `.env` file.

## 📄 License

MIT License - See LICENSE file for details

## 👥 Support

For issues and questions, contact the development team.

---

**Built with ❤️ using FastAPI, Crossmint, Supabase, and Web3.py**
