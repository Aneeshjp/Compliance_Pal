AI system that assists Micro, Small, and Medium Enterprises in managing GST compliance and e‑invoicing reconciliation.
🚀 AI-Based GST Compliance Helper for MSMEs

📌 Overview
The AI-Based GST Compliance Helper is a web application designed to simplify GST compliance for Micro, Small, and Medium Enterprises (MSMEs). It automates invoice processing using OCR, validates GST data, performs reconciliation, and provides actionable insights through a dashboard.

---

🎯 Problem Statement
MSMEs face challenges in GST compliance due to manual invoice handling, data entry errors, complex reconciliation processes, and lack of clear insights. These issues often lead to mismatches, loss of Input Tax Credit (ITC), and penalties.

---

💡 Solution
This project provides an intelligent system that:
- Extracts invoice data automatically using OCR  
- Validates GST information  
- Performs reconciliation with GST records  
- Displays results in a user-friendly dashboard  
- Assists users with an AI-based assistant  

---
🧩 Features

🔐 Authentication
- Secure login and registration using JWT  
- Password hashing for security  

📥 Invoice Upload & OCR
- Upload invoices (PDF, JPG, PNG)  
- Extract GSTIN, invoice number, date, and tax values  

✅ GST Validation
- Validate GSTIN format  
- Detect missing or incorrect fields  

🔄 Reconciliation
- Match invoices with GST records  
- Identify:
  - Matched  
  - Mismatch  
  - Missing invoices  

📊 Dashboard
- View invoice summary  
- Analyze mismatches and errors  
- Display tax insights  

🤖 AI Assistant
- Answer user queries  
- Provide insights on GST data  

---
🧠 Advanced Features
- ITC (Input Tax Credit) optimization  
- Fraud and duplicate invoice detection  
- Vendor compliance scoring  
- Predictive alerts and notifications  
- OCR confidence scoring  

---
🏗️ System Architecture
User → Upload Invoice → OCR Extraction → Validation → Database
→ Reconciliation Engine → Dashboard → AI Assistant

---
🛠️ Tech Stack

Backend
- Python  
- FastAPI  
- SQLAlchemy  
- Pydantic  
- JWT Authentication  

OCR & Processing
- Tesseract OCR  
- RapidFuzz (fuzzy matching)  

Frontend
- React  
- Vite  
- Axios  

Database
- SQLite (MVP)  
- PostgreSQL (Production-ready)  
