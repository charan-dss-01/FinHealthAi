import json
import random
import os

categories = {
    "Inventory & Supplies": [
        "METRO CASH AND CARRY SUPPLIES",
        "HUL DISTRIBUTOR BANGALORE",
        "P&G WHOLESALE INDIA",
        "NESTLE DISTRIBUTOR BILL",
        "AMUL MILK PRODUCTS WHOLESALE",
        "BRITANNIA BISCUITS DISTRIBUTOR",
        "PARLE AGRO SUPPLIES",
        "GODREJ CONSUMER PRODUCTS",
        "PACKAGING MATERIAL PURCHASE",
        "PLASTIC CONTAINERS WHOLESALE",
    ],
    "Utilities": [
        "BESCOM ELECTRICITY BILL",
        "BWSSB WATER BILL BANGALORE",
        "TATA POWER COMMERCIAL ELECTRICITY",
        "COMMERCIAL LPG CYLINDER REFILL",
        "AIRTEL BROADBAND BILL FOR STORE",
        "RELIANCE JIO BUSINESS FIBER",
    ],
    "Rent & Facilities": [
        "STORE RENT PAYMENT",
        "SHOP OWNER MONTHLY RENT",
        "WAREHOUSE LEASE EMI",
        "GODOWN RENT TRANSFER",
    ],
    "Salaries & Payroll": [
        "STAFF SALARY TRANSFER",
        "HELPER MONTHLY WAGES",
        "STORE MANAGER SALARY",
        "SALARY FOR ACCOUNTANT",
        "WORKER BONUS PAYMENT",
    ],
    "Customer Revenue": [
        "UPI PAYMENT RECEIVED FROM CUSTOMER",
        "QR CODE PAYTM SETTLEMENT",
        "BHARATPE DAILY SETTLEMENT CREDIT",
        "PHONEPE MERCHANT CREDIT",
        "CUSTOMER CASH DEPOSIT",
    ],
    "Personal Expense (Co-mingled)": [
        "SWIGGY FOOD ORDER",
        "ZOMATO RESTAURANT PAY",
        "NETFLIX MONTHLY SUBSCRIPTION",
        "AMAZON PERSONAL SHOPPING",
        "MYNTRA FASHION STORE",
        "SCHOOL FEES TRANSFER",
        "COLLEGE ADMISSION FEES",
        "HOSPITAL MEDICAL BILL",
        "SALON HAIR CUT AND SPA",
    ],
    "Taxes & Government": [
        "GST PAYMENT ONLINE",
        "INCOME TAX ADVANCE TAX",
        "MUNICIPAL TRADE LICENSE FEE",
        "PROFESSIONAL TAX PAYMENT",
    ],
    "Logistics & Freight": [
        "DELHIVERY FREIGHT CHARGES",
        "PORTER TEMPO TRANSPORT",
        "ECOM EXPRESS SHIPPING",
        "LOCAL AUTO RICKSHAW CARGO",
    ],
    "Bank Fees & Loans": [
        "SBI MAB PENALTY FEE",
        "HDFC COMMERCIAL LOAN EMI",
        "AXIS BANK CHEQUE BOUNCE CHARGE",
        "IMPS SERVICE CHARGE",
    ],
    "Equipment & Maintenance": [
        "REFRIGERATOR REPAIR WORK",
        "POS MACHINE RENTAL FEE",
        "WEIGHING SCALE CALIBRATION",
        "AIR CONDITIONER SERVICING",
    ]
}

dataset = []

for category, templates in categories.items():
    for _ in range(120): # Generate 1,200 total samples
        base = random.choice(templates)
        ref = f"UPI/{random.randint(100000000000, 999999999999)}"
        amount = random.randint(100, 75000)
        
        description = f"{ref}/{base}" if random.random() > 0.3 else f"{base} REF{random.randint(1000,9999)}"
        
        dataset.append({
            "text": description,
            "category": category,
            "amount": amount
        })

random.shuffle(dataset)

os.makedirs("scripts/ml/data", exist_ok=True)
with open("scripts/ml/data/dataset.json", "w", encoding="utf-8") as f:
    json.dump(dataset, f, indent=2)

print(f"Dataset generated successfully with {len(dataset)} labeled SMB transactions across {len(categories)} categories!")
