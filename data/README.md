# FinHealth AI — Demo & Presentation Sample Files

This folder contains realistic sample files prepared specifically for showcasing FinHealth AI during live demos and hackathon presentations.

---

## 📁 Available Demo Files

### 1. `sample_bank_statement_sbi_current.csv`
* **Use Case:** Main bank statement ingestion on the **/upload** page.
* **Format:** State Bank of India (SBI) Current Account format (`Date,Description,Credit,Debit`).
* **What it demonstrates:**
  - Ingestion of daily UPI QR settlements (PhonePe, Paytm, BharatPe).
  - Categorization of distributor stock payments (HUL, ITC, Britannia, Amul).
  - Commercial utility & helper salary payments.
  - Automatically recalculates **Sales, Cash Runway, Net Profit**, and updates the Dashboard in real time!

### 2. `sample_bank_statement_hdfc_merchant.csv`
* **Use Case:** High-volume merchant statement ingestion.
* **Format:** Standard HDFC Bank Current Account format (`Date,Narration,Deposit,Withdrawal,Balance`).
* **What it demonstrates:**
  - Robust multi-bank statement format compatibility (handles `Deposit` / `Withdrawal` columns as well as `Credit` / `Debit`).

### 3. `sample_statement_with_personal_leakages.csv`
* **Use Case:** Demonstrating **Expense Leakage & Co-mingling Detection**.
* **What it demonstrates:**
  - Contains mixed transactions where personal lifestyle expenses are co-mingled in the store current account (Zomato food, Myntra clothes, School fees, Netflix, LIC policy).
  - FinHealth AI automatically flags these as **"Personal Leak"** vs **"Store Spend"**, showing the merchant where their operating capital is leaking!

### 4. `sample_distributor_bill_receipt.png`
* **Use Case:** Live Multimodal Bill/Receipt extraction on the **/copilot** page.
* **What it demonstrates:**
  - A clean, realistic FMCG Wholesale Tax Invoice (`Sri Balaji Wholesale Traders - ₹14,196`).
  - Attach this image in the Copilot chat:
    - FinHealth AI reads the invoice using vision AI.
    - Extracts the **Vendor Name, Total Amount, Date**, and categorizes it as **Store Inventory**.
    - Renders the one-click **"Save as Transaction"** button directly in the chat!

---

## 🚀 Recommended Demo Flow

1. **Step 1: Upload Bank Statement**
   - Go to `http://localhost:3000/upload`
   - Click **Choose File** -> select `data/sample_bank_statement_sbi_current.csv` (or `sample_statement_with_personal_leakages.csv`)
   - Click **Process Statement & Update Dashboard**
   - Show how transactions are automatically classified and categorized.

2. **Step 2: Review Live Dashboard & Runway**
   - Go to `http://localhost:3000/dashboard`
   - Point out the updated **Cash Runway Buffer**, **Health Score (85/100)**, and cash flow charts.

3. **Step 3: Show Customer Khaata & Notification Ledger**
   - Go to `http://localhost:3000/khaata`
   - Show the **Pending Receivables (₹10,550)**, **Settled Accounts**, and **Overdue Receivables**.
   - Click **Add New Credit Entry** or **Mark Paid** to demonstrate the automated WhatsApp/Email notification audit trail!

4. **Step 4: AI Financial Copilot & Receipt Analysis**
   - Go to `http://localhost:3000/copilot`
   - Click the paperclip / image icon and attach `data/sample_distributor_bill_receipt.png`.
   - Watch the Copilot extract the bill details and provide the one-click ledger save button!
   - Ask any question in English, Telugu, or Hindi (e.g., *"How are my numbers looking this month compared to last month?"*).
