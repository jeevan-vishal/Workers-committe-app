"""Local demo backend for the Workers Committee app.

Runs entirely in-memory — no Supabase needed. Use employee ID EMP001 with
password admin123 to log in as the committee admin (super_admin). OTP login
accepts any 6-digit code.
"""

import base64
import io
import json
import secrets
import uuid
from datetime import datetime, timedelta

import jwt
from fastapi import FastAPI, Header, HTTPException, Request, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

app = FastAPI(title="Workers Committee Mock API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SECRET = "demo-local-secret"
TOKEN_TTL = timedelta(days=7)

now = datetime.now()


def make_token(member, days=7):
    payload = {
        "sub": member["id"],
        "role": member["role"],
        "email": member.get("email"),
        "name": member["full_name"],
        "exp": now + timedelta(days=days),
    }
    return jwt.encode(payload, SECRET, algorithm="HS256")


def make_id():
    return str(uuid.uuid4())


def today_iso(md):
    return datetime(now.year, md[0], md[1]).isoformat()


def load_members():
    members = [
        {
            "id": make_id(), "employee_id": "EMP001", "full_name": "Kumar Selvam",
            "email": "admin@example.com", "phone": "+919800001001",
            "designation": "Committee President", "department": "Management",
            "role": "super_admin", "is_committee_member": True,
            "photo_url": None, "active": True, "password": "admin123",
            "date_of_birth": today_iso((3, 15)), "work_anniversary": today_iso((6, 1)),
        },
        {
            "id": make_id(), "employee_id": "EMP002", "full_name": "Priya Raman",
            "email": "priya@example.com", "phone": "+919800001002",
            "designation": "Machinist", "department": "Production",
            "role": "member", "is_committee_member": True,
            "photo_url": None, "active": True, "password": "member123",
            "date_of_birth": today_iso((now.month, now.day)), "work_anniversary": today_iso((10, 10)),
        },
        {
            "id": make_id(), "employee_id": "EMP003", "full_name": "Ravi Shankar",
            "email": "ravi@example.com", "phone": "+919800001003",
            "designation": "Quality Inspector", "department": "Quality",
            "role": "member", "is_committee_member": False,
            "photo_url": None, "active": True, "password": "member123",
            "date_of_birth": today_iso((2, 20)), "work_anniversary": today_iso((now.month, now.day)),
        },
        {
            "id": make_id(), "employee_id": "EMP004", "full_name": "Meena Kumari",
            "email": "meena@example.com", "phone": "+919800001004",
            "designation": "Assembler", "department": "Production",
            "role": "member", "is_committee_member": True,
            "photo_url": None, "active": True, "password": "member123",
            "date_of_birth": today_iso((11, 5)), "work_anniversary": today_iso((4, 22)),
        },
        {
            "id": make_id(), "employee_id": "EMP005", "full_name": "Arjun Naidu",
            "email": "arjun@example.com", "phone": "+919800001005",
            "designation": "Welder", "department": "Maintenance",
            "role": "member", "is_committee_member": False,
            "photo_url": None, "active": True, "password": "member123",
            "date_of_birth": today_iso((8, 30)), "work_anniversary": today_iso((9, 12)),
        },
    ]
    return members


members = load_members()

announcements = [
    {
        "id": make_id(), "title": "Factory Safety Week 2026",
        "body": "Safety drills every morning at 9 AM. All workers must wear protective gear in the shop floor.",
        "category": "general", "published_at": (now - timedelta(days=2)).isoformat(),
        "published_by": "Kumar Selvam",
    },
    {
        "id": make_id(), "title": "Wage Disbursement Date Updated",
        "body": "Salaries for this month will be credited on the 5th instead of the 1st due to the bank holiday.",
        "category": "urgent", "published_at": (now - timedelta(days=1)).isoformat(),
        "published_by": "Kumar Selvam",
    },
    {
        "id": make_id(), "title": "Annual Day Celebration",
        "body": "Join us on the last Saturday for the annual day celebrations at the community hall. Families welcome!",
        "category": "event", "published_at": (now - timedelta(hours=5)).isoformat(),
        "published_by": "Priya Raman",
    },
]

complaints = [
    {
        "id": make_id(), "ticket_no": "CMP-2026-001", "user_id": members[1]["id"],
        "category": "Facilities", "subject": "Broken water cooler",
        "description": "The cooler on the second floor has been leaking for a week.",
        "status": "in_progress", "is_anonymous": False,
        "created_at": (now - timedelta(days=4)).isoformat(),
        "history": [{"status": "open", "at": (now - timedelta(days=4)).isoformat()}],
    },
    {
        "id": make_id(), "ticket_no": "CMP-2026-002", "user_id": members[2]["id"],
        "category": "Safety", "subject": "No gloves at welding station",
        "description": "Welding gloves have not been restocked for two weeks.",
        "status": "open", "is_anonymous": True,
        "created_at": (now - timedelta(days=1)).isoformat(),
        "history": [{"status": "open", "at": (now - timedelta(days=1)).isoformat()}],
    },
]

leave_records = [
    {
        "id": make_id(), "user_id": members[2]["id"],
        "leave_type": "sick", "start_date": (now + timedelta(days=1)).date().isoformat(),
        "end_date": (now + timedelta(days=2)).date().isoformat(),
        "reason": "Fever and doctor visit", "status": "pending",
        "created_at": (now - timedelta(hours=20)).isoformat(),
        "admin_note": None,
    },
    {
        "id": make_id(), "user_id": members[3]["id"],
        "leave_type": "casual", "start_date": (now + timedelta(days=6)).date().isoformat(),
        "end_date": (now + timedelta(days=6)).date().isoformat(),
        "reason": "Family function", "status": "approved",
        "created_at": (now - timedelta(days=3)).isoformat(),
        "admin_note": "Approved - please update production roster",
    },
]

meetings = [
    {
        "id": make_id(), "title": "Monthly Workers Committee Meeting",
        "agenda": "Safety report, wage review, complaints follow-up",
        "location": "Meeting Hall, Block A", "meeting_date": (now + timedelta(days=3)).isoformat(),
        "qr_code_token": "mtg-" + secrets.token_hex(8), "attendance": [],
    },
    {
        "id": make_id(), "title": "Safety Sub-Committee Review",
        "agenda": "Review safety drill outcomes",
        "location": "Canteen", "meeting_date": (now + timedelta(days=10)).isoformat(),
        "qr_code_token": "mtg-" + secrets.token_hex(8), "attendance": [members[3]["id"]],
    },
]

documents = [
    {
        "id": make_id(), "title": "Factories Act, 1948 (Key Sections)", "category": "labour_law",
        "file_size_kb": 240, "file_url": "/demo-document",
    },
    {
        "id": make_id(), "title": "Holiday List 2026", "category": "circular",
        "file_size_kb": 80, "file_url": "/demo-document",
    },
    {
        "id": make_id(), "title": "Leave Policy 2026", "category": "policy",
        "file_size_kb": 120, "file_url": "/demo-document",
    },
    {
        "id": make_id(), "title": "Minutes - May Committee Meeting", "category": "minutes",
        "file_size_kb": 95, "file_url": "/demo-document",
    },
]

finance_categories = [
    {"id": make_id(), "name": "Member Contributions"},
    {"id": make_id(), "name": "Welfare Fund"},
    {"id": make_id(), "name": "Events & Celebrations"},
    {"id": make_id(), "name": "Office & Stationery"},
]

# Committee's UPI ID for receiving contributions via any UPI app
UPI_ID = "workerscommittee@okhdfc"
UPI_PAYEE = "Workers Committee"

transactions = [
    {
        "id": make_id(), "type": "income", "amount": 12500.0,
        "description": "Member contributions - June", "transaction_date": (now - timedelta(days=20)).isoformat(),
        "category_id": finance_categories[0]["id"],
    },
    {
        "id": make_id(), "type": "expense", "amount": 3400.0,
        "description": "Annual day venue booking", "transaction_date": (now - timedelta(days=12)).isoformat(),
        "category_id": finance_categories[2]["id"],
    },
    {
        "id": make_id(), "type": "income", "amount": 5000.0,
        "description": "Management welfare fund grant", "transaction_date": (now - timedelta(days=5)).isoformat(),
        "category_id": finance_categories[1]["id"],
    },
    {
        "id": make_id(), "type": "expense", "amount": 950.0,
        "description": "Printer ink & paper", "transaction_date": (now - timedelta(days=2)).isoformat(),
        "category_id": finance_categories[3]["id"],
    },
]

otp_store = {}


def current_member(authorization: str):
    if not authorization:
        return None
    try:
        token = authorization.replace("Bearer ", "")
        payload = jwt.decode(token, SECRET, algorithms=["HS256"])
        return next((m for m in members if m["id"] == payload["sub"]), None)
    except Exception:
        return None


def require_admin(member):
    if not member or member["role"] not in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    return member


def require_member(member):
    if not member:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return member


# ---------------------------------------------------------------- Auth
@app.post("/auth/login/employee-id")
def login_employee_id(body: dict):
    emp = body.get("employee_id", "").strip().lower()
    password = body.get("password", "")
    member = next((m for m in members if m["employee_id"].lower() == emp and m["active"]), None)
    if not member or member["password"] != password:
        raise HTTPException(status_code=401, detail="Invalid employee ID or password")
    return {"access_token": make_token(member), "refresh_token": make_token(member, days=30)}


@app.post("/auth/login/otp/request")
def request_otp(body: dict):
    phone = body.get("phone", "")
    otp_store[phone] = "123456"
    return {"message": "OTP sent (demo mode: use any 6-digit code)"}


@app.post("/auth/login/otp/verify")
def verify_otp(body: dict):
    phone = body.get("phone", "")
    code = body.get("token", "")
    member = next((m for m in members if m.get("phone") == phone and m["active"]), None)
    if not member:
        raise HTTPException(status_code=401, detail="Phone number not registered")
    if not (len(code) == 6 and code.isdigit()):
        raise HTTPException(status_code=401, detail="Invalid OTP")
    return {"access_token": make_token(member), "refresh_token": make_token(member, days=30)}


# ---------------------------------------------------------------- Members
@app.get("/members")
def list_members(search: str = "", authorization: str = Header(default="")):
    require_member(current_member(authorization))
    result = [m for m in members if m["active"]]
    if search:
        result = [m for m in result if search.lower() in m["full_name"].lower() or search.lower() in m["employee_id"].lower()]
    return result


@app.get("/members/birthdays-today")
def birthdays_today(authorization: str = Header(default="")):
    require_member(current_member(authorization))
    birthday = []
    anniversary = []
    for m in members:
        if not m["active"]:
            continue
        if m.get("date_of_birth"):
            md = datetime.fromisoformat(m["date_of_birth"])
            if (md.month, md.day) == (now.month, now.day):
                birthday.append({"id": m["id"], "full_name": m["full_name"]})
        if m.get("work_anniversary"):
            wa = datetime.fromisoformat(m["work_anniversary"])
            if (wa.month, wa.day) == (now.month, now.day):
                anniversary.append({"id": m["id"], "full_name": m["full_name"]})
    return {"birthdays": birthday, "anniversaries": anniversary}


@app.get("/members/me")
def me(authorization: str = Header(default="")):
    member = require_member(current_member(authorization))
    return {k: v for k, v in member.items() if k != "password"}


@app.post("/members/photo")
async def upload_photo(file: UploadFile = File(...), authorization: str = Header(default="")):
    member = require_member(current_member(authorization))
    contents = await file.read()
    content_type = file.content_type or "image/jpeg"
    data_url = f"data:{content_type};base64,{base64.b64encode(contents).decode('ascii')}"
    member["photo_url"] = data_url
    return {"photo_url": data_url}


@app.post("/members/admin/add")
def add_member(body: dict, authorization: str = Header(default="")):
    require_admin(current_member(authorization))
    member = {
        "id": make_id(),
        "employee_id": body.get("employee_id"),
        "full_name": body.get("full_name"),
        "email": body.get("email"),
        "phone": body.get("phone"),
        "designation": body.get("designation"),
        "department": body.get("department"),
        "role": body.get("role", "member"),
        "is_committee_member": bool(body.get("is_committee_member", False)),
        "photo_url": None, "active": True,
        "password": body.get("password", "member123"),
    }
    members.append(member)
    return member


@app.delete("/members/admin/{member_id}")
def deactivate_member(member_id: str, authorization: str = Header(default="")):
    require_admin(current_member(authorization))
    member = next((m for m in members if m["id"] == member_id), None)
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    member["active"] = False
    return {"message": "Member deactivated"}


@app.patch("/members/admin/{member_id}/role")
def update_member_role(member_id: str, body: dict, authorization: str = Header(default="")):
    admin = require_admin(current_member(authorization))
    member = next((m for m in members if m["id"] == member_id), None)
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    if member["id"] == admin["id"]:
        raise HTTPException(status_code=400, detail="You cannot change your own role")
    new_role = body.get("role", "member")
    if new_role not in ("member", "admin", "super_admin"):
        raise HTTPException(status_code=400, detail="Invalid role")
    member["role"] = new_role
    member["is_committee_member"] = new_role != "member"
    return {k: v for k, v in member.items() if k != "password"}


# ---------------------------------------------------------------- Announcements
@app.get("/announcements")
def list_announcements(category: str = "", authorization: str = Header(default="")):
    require_member(current_member(authorization))
    result = sorted(announcements, key=lambda a: a["published_at"], reverse=True)
    if category:
        result = [a for a in result if a["category"] == category]
    return result


@app.post("/announcements/admin/publish")
def publish_announcement(body: dict, authorization: str = Header(default="")):
    admin = require_admin(current_member(authorization))
    item = {
        "id": make_id(),
        "title": body.get("title"),
        "body": body.get("body"),
        "category": body.get("category", "general"),
        "published_at": now.isoformat(),
        "published_by": admin["full_name"],
    }
    announcements.insert(0, item)
    return item


# ---------------------------------------------------------------- Complaints
@app.post("/complaints")
def register_complaint(body: dict, authorization: str = Header(default="")):
    member = require_member(current_member(authorization))
    seq = len(complaints) + 1
    item = {
        "id": make_id(),
        "ticket_no": f"CMP-{now.year}-{seq:03d}",
        "user_id": member["id"],
        "category": body.get("category"),
        "subject": body.get("subject"),
        "description": body.get("description"),
        "status": "open",
        "is_anonymous": bool(body.get("is_anonymous", False)),
        "created_at": now.isoformat(),
        "history": [{"status": "open", "at": now.isoformat()}],
    }
    complaints.append(item)
    return item


@app.get("/complaints/mine")
def my_complaints(authorization: str = Header(default="")):
    member = require_member(current_member(authorization))
    return [c for c in complaints if c["user_id"] == member["id"]]


@app.get("/complaints/{complaint_id}/history")
def complaint_history(complaint_id: str, authorization: str = Header(default="")):
    require_member(current_member(authorization))
    item = next((c for c in complaints if c["id"] == complaint_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return item["history"]


@app.get("/complaints/admin/all")
def all_complaints(status: str = "", authorization: str = Header(default="")):
    require_admin(current_member(authorization))
    result = sorted(complaints, key=lambda c: c["created_at"], reverse=True)
    if status:
        result = [c for c in result if c["status"] == status]
    return result


@app.patch("/complaints/admin/{complaint_id}/status")
def update_complaint_status(complaint_id: str, body: dict, authorization: str = Header(default="")):
    require_admin(current_member(authorization))
    item = next((c for c in complaints if c["id"] == complaint_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Complaint not found")
    item["status"] = body.get("status")
    item["history"].append({"status": body.get("status"), "at": now.isoformat()})
    return item


# ---------------------------------------------------------------- Leave
LEAVE_TYPES = ["sick", "casual", "earned", "unpaid"]

@app.post("/leave/request")
def request_leave(body: dict, authorization: str = Header(default="")):
    member = require_member(current_member(authorization))
    item = {
        "id": make_id(),
        "user_id": member["id"],
        "leave_type": body.get("leave_type", "casual"),
        "start_date": body.get("start_date"),
        "end_date": body.get("end_date"),
        "reason": body.get("reason"),
        "status": "pending",
        "created_at": now.isoformat(),
        "admin_note": None,
    }
    leave_records.append(item)
    return item


@app.get("/leave/mine")
def my_leaves(authorization: str = Header(default="")):
    member = require_member(current_member(authorization))
    return [l for l in leave_records if l["user_id"] == member["id"]]


@app.get("/leave/admin/all")
def all_leaves(authorization: str = Header(default="")):
    require_admin(current_member(authorization))
    result = sorted(leave_records, key=lambda l: l["created_at"], reverse=True)
    out = []
    for l in result:
        owner = next((m for m in members if m["id"] == l["user_id"]), None)
        out.append({
            **l,
            "full_name": owner["full_name"] if owner else "Unknown",
            "employee_id": owner["employee_id"] if owner else "",
        })
    return out


@app.patch("/leave/admin/{leave_id}/status")
def update_leave_status(leave_id: str, body: dict, authorization: str = Header(default="")):
    require_admin(current_member(authorization))
    item = next((l for l in leave_records if l["id"] == leave_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Leave request not found")
    if body.get("status") not in ("approved", "rejected"):
        raise HTTPException(status_code=400, detail="Status must be approved or rejected")
    item["status"] = body.get("status")
    item["admin_note"] = body.get("admin_note")
    return item


# ---------------------------------------------------------------- Meetings
@app.get("/meetings")
def list_meetings(authorization: str = Header(default="")):
    require_member(current_member(authorization))
    result = sorted(meetings, key=lambda m: m["meeting_date"])
    return [{k: v for k, v in m.items() if k != "attendance"} for m in result]


@app.post("/meetings/admin/create")
def create_meeting(body: dict, authorization: str = Header(default="")):
    require_admin(current_member(authorization))
    item = {
        "id": make_id(),
        "title": body.get("title"),
        "agenda": body.get("agenda"),
        "location": body.get("location"),
        "meeting_date": body.get("meeting_date"),
        "qr_code_token": "mtg-" + secrets.token_hex(8),
        "attendance": [],
    }
    meetings.append(item)
    return {k: v for k, v in item.items() if k != "attendance"}


@app.post("/meetings/check-in/{token}")
def check_in(token: str, authorization: str = Header(default="")):
    member = require_member(current_member(authorization))
    meeting = next((m for m in meetings if m["qr_code_token"] == token), None)
    if not meeting:
        raise HTTPException(status_code=404, detail="Invalid QR code")
    if member["id"] not in meeting["attendance"]:
        meeting["attendance"].append(member["id"])
    return {"message": f"Checked in: {member['full_name']}"}


@app.get("/meetings/{meeting_id}/attendance")
def meeting_attendance(meeting_id: str, authorization: str = Header(default="")):
    require_member(current_member(authorization))
    meeting = next((m for m in meetings if m["id"] == meeting_id), None)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    attendees = [m for m in members if m["id"] in meeting["attendance"]]
    return {"count": len(attendees), "attendees": [{"id": m["id"], "full_name": m["full_name"]} for m in attendees]}


# ---------------------------------------------------------------- Documents
@app.get("/documents")
def list_documents(category: str = "", search: str = "", authorization: str = Header(default="")):
    require_member(current_member(authorization))
    result = documents
    if category:
        result = [d for d in result if d["category"] == category]
    if search:
        result = [d for d in result if search.lower() in d["title"].lower()]
    return result


@app.post("/documents/admin/upload")
async def upload_document(file: UploadFile = File(...), category: str = Form(...), authorization: str = Header(default="")):
    require_admin(current_member(authorization))
    data = await file.read()
    item = {
        "id": make_id(),
        "title": file.filename or "document",
        "category": category,
        "file_size_kb": max(1, len(data) // 1024),
        "file_url": "/demo-document",
    }
    documents.append(item)
    return item


MINIMAL_PDF = (
    b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
    b"2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n"
    b"3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n"
    b"4 0 obj<</Length 90>>stream\n"
    b"BT /F1 18 Tf 72 720 Td (Workers Committee Document) Tj ET\n"
    b"BT /F1 12 Tf 72 690 Td (This is a placeholder PDF generated by the demo backend.) Tj ET\n"
    b"endstream\nendobj\n"
    b"5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\n"
    b"trailer<</Root 1 0 R>>\n%%EOF"
)


@app.get("/demo-document")
def demo_document():
    return Response(
        content=MINIMAL_PDF,
        media_type="application/pdf",
        headers={"Content-Disposition": "inline; filename=demo.pdf"},
    )


# ---------------------------------------------------------------- Finance
def tx_summary(items):
    income = sum(t["amount"] for t in items if t["type"] == "income")
    expense = sum(t["amount"] for t in items if t["type"] == "expense")
    return {"total_income": income, "total_expense": expense, "balance": income - expense}


@app.get("/finance/summary")
def finance_summary(authorization: str = Header(default="")):
    require_member(current_member(authorization))
    return tx_summary(transactions)


@app.get("/finance/transactions")
def list_transactions(authorization: str = Header(default="")):
    require_member(current_member(authorization))
    result = sorted(transactions, key=lambda t: t["transaction_date"], reverse=True)
    out = []
    for t in result:
        cat = next((c for c in finance_categories if c["id"] == t["category_id"]), None)
        out.append({
            "id": t["id"], "type": t["type"], "amount": t["amount"],
            "description": t["description"], "transaction_date": t["transaction_date"],
            "payment_method": t.get("payment_method", "cash"),
            "upi_ref": t.get("upi_ref"),
            "finance_categories": {"name": cat["name"] if cat else "Other"},
        })
    return out


@app.post("/finance/admin/transactions")
def record_transaction(body: dict, authorization: str = Header(default="")):
    require_admin(current_member(authorization))
    t = {
        "id": make_id(),
        "type": body.get("type"),
        "amount": float(body.get("amount", 0)),
        "description": body.get("description"),
        "transaction_date": now.isoformat(),
        "category_id": body.get("category_id"),
        "payment_method": body.get("payment_method", "cash"),
        "upi_id": body.get("upi_id"),
        "upi_ref": body.get("upi_ref"),
    }
    transactions.append(t)
    return t


@app.get("/finance/upi-info")
def upi_info(authorization: str = Header(default="")):
    require_member(current_member(authorization))
    return {"upi_id": UPI_ID, "payee": UPI_PAYEE}


@app.get("/finance/export/excel")
def export_excel(authorization: str = Header(default="")):
    require_member(current_member(authorization))
    lines = ["Type,Amount,Description,Date"]
    for t in transactions:
        lines.append(f"{t['type']},{t['amount']},{t['description']},{t['transaction_date']}")
    csv_bytes = ("\n".join(lines) + "\n").encode("utf-8")
    return Response(
        content=csv_bytes,
        media_type="application/vnd.ms-excel",
        headers={"Content-Disposition": 'attachment; filename="finance_report.csv"'},
    )


@app.get("/finance/export/pdf")
def export_pdf(authorization: str = Header(default="")):
    require_member(current_member(authorization))
    lines = ["Workers Committee - Finance Report", ""]
    for t in transactions:
        lines.append(f"{t['type']}: {t['amount']} - {t['description']}")
    text = "\n".join(lines)
    stream = (
        b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
        b"2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n"
        b"3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n"
    )
    content = text.encode("latin-1", errors="replace")
    length = len(content)
    stream += f"4 0 obj<</Length {length}>>stream\n".encode()
    stream += content + b"\nendstream\nendobj\n"
    stream += b"5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\n"
    stream += b"trailer<</Root 1 0 R>>\n%%EOF"
    return Response(
        content=stream,
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="finance_report.pdf"'},
    )


# ---------------------------------------------------------------- Notifications
@app.post("/notifications/register-token")
def register_push_token(body: dict, authorization: str = Header(default="")):
    require_member(current_member(authorization))
    return {"message": "Push token registered (demo)"}


@app.post("/notifications/admin/send")
def send_push(body: dict, authorization: str = Header(default="")):
    require_admin(current_member(authorization))
    return {"message": f"Notification sent to {len(members)} members (demo)"}


# ---------------------------------------------------------------- Health
@app.get("/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)
