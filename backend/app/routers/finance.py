from fastapi import APIRouter, Depends, Response
from pydantic import BaseModel
from typing import Optional
from datetime import date
from io import BytesIO
from app.core.security import get_current_member, require_admin
from app.core.supabase_client import get_user_client
from app.core.config import settings

router = APIRouter(prefix="/finance", tags=["finance"])


class NewTransaction(BaseModel):
    account_id: Optional[str] = None
    category_id: Optional[str] = None
    type: str            # "income" | "expense"
    amount: float
    description: Optional[str] = None
    receipt_url: Optional[str] = None
    payment_method: Optional[str] = "cash"   # cash | bank | upi
    upi_id: Optional[str] = None             # e.g. name@bank
    upi_ref: Optional[str] = None            # UPI transaction reference
    transaction_date: date = date.today()


@router.get("/transactions")
def list_transactions(start: Optional[date] = None, end: Optional[date] = None,
                       type: Optional[str] = None, current=Depends(get_current_member)):
    client = get_user_client(current["token"])
    q = client.table("finance_transactions").select(
        "*, finance_categories(name), finance_accounts(name)"
    ).order("transaction_date", desc=True)
    if start:
        q = q.gte("transaction_date", start.isoformat())
    if end:
        q = q.lte("transaction_date", end.isoformat())
    if type:
        q = q.eq("type", type)
    return q.execute().data


@router.post("/admin/transactions")
def record_transaction(payload: NewTransaction, current=Depends(get_current_member)):
    require_admin(current)
    client = get_user_client(current["token"])
    row = client.table("finance_transactions").insert({
        **payload.model_dump(mode="json"),
        "recorded_by": current["member"]["id"],
    }).execute()
    return row.data[0]


@router.get("/upi-info")
def upi_info(current=Depends(get_current_member)):
    """Committee's UPI ID for receiving contributions (shown with a QR on the app)."""
    return {"upi_id": settings.UPI_ID, "payee": "Workers Committee"}


@router.get("/summary")
def financial_summary(start: Optional[date] = None, end: Optional[date] = None,
                       current=Depends(get_current_member)):
    """Quick totals for dashboards/reports."""
    txs = list_transactions(start, end, None, current)
    income = sum(t["amount"] for t in txs if t["type"] == "income")
    expense = sum(t["amount"] for t in txs if t["type"] == "expense")
    return {"total_income": income, "total_expense": expense, "balance": income - expense,
            "transaction_count": len(txs)}


@router.get("/export/excel")
def export_excel(start: Optional[date] = None, end: Optional[date] = None,
                  current=Depends(get_current_member)):
    require_admin(current)
    from openpyxl import Workbook

    txs = list_transactions(start, end, None, current)
    wb = Workbook()
    ws = wb.active
    ws.title = "Transactions"
    ws.append(["Date", "Type", "Category", "Account", "Amount", "Description", "Payment Method", "UPI Ref"])
    for t in txs:
        ws.append([
            t["transaction_date"], t["type"],
            (t.get("finance_categories") or {}).get("name", ""),
            (t.get("finance_accounts") or {}).get("name", ""),
            t["amount"], t.get("description", ""),
            t.get("payment_method", "cash"), t.get("upi_ref", ""),
        ])

    buf = BytesIO()
    wb.save(buf)
    buf.seek(0)
    return Response(
        content=buf.read(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=finance_report.xlsx"},
    )


@router.get("/export/pdf")
def export_pdf(start: Optional[date] = None, end: Optional[date] = None,
                current=Depends(get_current_member)):
    require_admin(current)
    from reportlab.lib.pagesizes import A4
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph
    from reportlab.lib import colors
    from reportlab.lib.styles import getSampleStyleSheet

    txs = list_transactions(start, end, None, current)
    summary = financial_summary(start, end, current)

    buf = BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4)
    styles = getSampleStyleSheet()
    elements = [Paragraph("Workers Committee — Financial Report", styles["Title"])]

    data = [["Date", "Type", "Amount", "Description"]]
    for t in txs:
        data.append([str(t["transaction_date"]), t["type"], f"₹{t['amount']:.2f}",
                     t.get("description", "")])
    table = Table(data, repeatRows=1)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1F4E5F")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
    ]))
    elements.append(table)
    elements.append(Paragraph(
        f"Total Income: ₹{summary['total_income']:.2f} | "
        f"Total Expense: ₹{summary['total_expense']:.2f} | "
        f"Balance: ₹{summary['balance']:.2f}", styles["Normal"]
    ))
    doc.build(elements)
    buf.seek(0)
    return Response(
        content=buf.read(), media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=finance_report.pdf"},
    )
