import os
from datetime import datetime
from PIL import Image, ImageDraw, ImageFont

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "demo_documents")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Define different color palettes to make invoices unique
PALETTES = {
    "blue": {"bg": "#ffffff", "header_bg": "#1e3a8a", "header_text": "#ffffff", "text": "#1e293b", "accent": "#3b82f6", "table_bg": "#f1f5f9"}, # Corporate Blue
    "green": {"bg": "#fcfcfc", "header_bg": "#064e3b", "header_text": "#ffffff", "text": "#022c22", "accent": "#10b981", "table_bg": "#ecfdf5"}, # Green
    "purple": {"bg": "#ffffff", "header_bg": "#581c87", "header_text": "#ffffff", "text": "#3b0764", "accent": "#a855f7", "table_bg": "#faf5ff"}, # Purple
    "orange": {"bg": "#fffdfa", "header_bg": "#b45309", "header_text": "#ffffff", "text": "#451a03", "accent": "#f59e0b", "table_bg": "#fffbeb"}, # Orange
}

INVOICE_PROFILES = [
    {
        "vendor": {"name": "Tata Steel Ltd", "gstin": "29AADCB2230M1ZV", "state": "Karnataka (29)"},
        "invoice_num": "INV-2026-001",
        "invoice_date": datetime(2026, 3, 15),
        "items": [
            ("Hot Rolled Steel Coils", 2, 40000.0, 80000.0),
            ("TMT Bars 12mm", 500, 90.0, 45000.0)
        ],
        "taxable_amount": 125000.0,
        "cgst": 11250.0,
        "sgst": 11250.0,
        "igst": 0.0,
        "palette": PALETTES["blue"],
        "layout": 1
    },
    {
        "vendor": {"name": "Reliance Industries", "gstin": "07AAACR5055K1Z0", "state": "Delhi (07)"},
        "invoice_num": "INV-2026-002",
        "invoice_date": datetime(2026, 3, 20),
        "items": [
            ("High Density Polyethylene", 100, 500.0, 50000.0),
            ("Industrial Solvents (Barrels)", 5, 7000.0, 35000.0)
        ],
        "taxable_amount": 85000.0,
        "cgst": 0.0,
        "sgst": 0.0,
        "igst": 15300.0,
        "palette": PALETTES["green"],
        "layout": 2
    },
    {
        "vendor": {"name": "Infosys Technologies", "gstin": "33AABCU9603R1ZM", "state": "Tamil Nadu (33)"},
        "invoice_num": "INV-2026-003",
        "invoice_date": datetime(2026, 4, 1),
        "items": [
            ("Enterprise Architecture Audit", 1, 80000.0, 80000.0),
            ("Cloud Migration Services", 1, 100000.0, 100000.0),
            ("Security Code Review", 1, 20000.0, 20000.0)
        ],
        "taxable_amount": 200000.0,
        "cgst": 0.0,
        "sgst": 0.0,
        "igst": 36000.0,
        "palette": PALETTES["purple"],
        "layout": 3
    },
    {
        "vendor": {"name": "TCS", "gstin": "06AABCT1332L1ZX", "state": "Haryana (06)"},
        "invoice_num": "INV-2026-005",
        "invoice_date": datetime(2026, 5, 10),
        "items": [
            ("Annual Maintenance Contract", 1, 120000.0, 120000.0),
            ("Dedicated Developer Hours", 20, 2750.0, 55000.0)
        ],
        "taxable_amount": 175000.0,
        "cgst": 0.0,
        "sgst": 0.0,
        "igst": 31500.0,
        "palette": PALETTES["orange"],
        "layout": 1
    }
]

def get_fonts():
    try:
        return {
            "title": ImageFont.truetype("arialbd.ttf", 60),
            "h1": ImageFont.truetype("arialbd.ttf", 45),
            "h2": ImageFont.truetype("arialbd.ttf", 35),
            "bold": ImageFont.truetype("arialbd.ttf", 28),
            "regular": ImageFont.truetype("arial.ttf", 28),
            "small": ImageFont.truetype("arial.ttf", 20)
        }
    except IOError:
        font = ImageFont.load_default()
        return {k: font for k in ["title", "h1", "h2", "bold", "regular", "small"]}

def generate_invoice(profile):
    fonts = get_fonts()
    width, height = 1200, 1600
    palette = profile["palette"]
    img = Image.new('RGB', (width, height), color=palette["bg"])
    draw = ImageDraw.Draw(img)

    layout_style = profile["layout"]
    vendor = profile["vendor"]
    invoice_num = profile["invoice_num"]
    invoice_date = profile["invoice_date"]
    line_items = profile["items"]
    
    taxable_amount = profile["taxable_amount"]
    cgst = profile["cgst"]
    sgst = profile["sgst"]
    igst = profile["igst"]
    total_gst = cgst + sgst + igst
    grand_total = taxable_amount + total_gst

    # --- HEADER SECTION ---
    if layout_style == 1:
        draw.rectangle([0, 0, width, 200], fill=palette["header_bg"])
        draw.text((80, 70), vendor["name"], fill=palette["header_text"], font=fonts["h1"])
        draw.text((80, 130), f"GSTIN: {vendor['gstin']}", fill=palette["header_text"], font=fonts["regular"])
        draw.text((width - 350, 80), "TAX INVOICE", fill=palette["header_text"], font=fonts["title"])
        y_offset = 260
    elif layout_style == 2:
        draw.text((80, 80), "TAX INVOICE", fill=palette["accent"], font=fonts["title"])
        draw.text((80, 160), vendor["name"], fill=palette["text"], font=fonts["h1"])
        draw.text((80, 220), f"GSTIN: {vendor['gstin']}  |  State: {vendor['state']}", fill=palette["accent"], font=fonts["regular"])
        draw.line([(80, 270), (width-80, 270)], fill=palette["accent"], width=3)
        y_offset = 320
    else:
        draw.text((width/2 - 150, 80), "INVOICE", fill=palette["text"], font=fonts["title"])
        draw.text((width/2 - 200, 160), vendor["name"], fill=palette["accent"], font=fonts["h2"])
        draw.text((width/2 - 180, 210), f"GSTIN: {vendor['gstin']}", fill=palette["text"], font=fonts["regular"])
        draw.line([(width/2 - 250, 250), (width/2 + 250, 250)], fill=palette["accent"], width=2)
        y_offset = 300

    # --- INVOICE DETAILS SECTION ---
    if layout_style == 1:
        draw.rectangle([80, y_offset, 550, y_offset+180], outline=palette["accent"], width=2)
        draw.text((110, y_offset+20), "Billed To:", fill=palette["accent"], font=fonts["small"])
        draw.text((110, y_offset+60), "Recipient Company LLC", fill=palette["text"], font=fonts["bold"])
        draw.text((110, y_offset+100), "GSTIN: 27AAPFU0939F1ZV", fill=palette["text"], font=fonts["regular"])
        
        draw.rectangle([650, y_offset, width-80, y_offset+180], fill=palette["table_bg"])
        draw.text((680, y_offset+40), f"Invoice No:", fill=palette["text"], font=fonts["bold"])
        draw.text((850, y_offset+40), f"{invoice_num}", fill=palette["accent"], font=fonts["bold"])
        draw.text((680, y_offset+100), f"Date:", fill=palette["text"], font=fonts["bold"])
        draw.text((850, y_offset+100), f"{invoice_date.strftime('%B %d, %Y')}", fill=palette["text"], font=fonts["regular"])
        y_offset += 250
    else:
        draw.text((80, y_offset), "Billed To:", fill=palette["accent"], font=fonts["bold"])
        draw.text((80, y_offset+40), "Recipient Company LLC", fill=palette["text"], font=fonts["h2"])
        draw.text((80, y_offset+90), "GSTIN: 27AAPFU0939F1ZV", fill=palette["text"], font=fonts["regular"])
        
        draw.text((700, y_offset), f"Invoice Number: {invoice_num}", fill=palette["text"], font=fonts["bold"])
        draw.text((700, y_offset+50), f"Invoice Date:   {invoice_date.strftime('%d-%m-%Y')}", fill=palette["text"], font=fonts["regular"])
        y_offset += 200

    # --- TABLE SECTION ---
    draw.rectangle([80, y_offset, width-80, y_offset+60], fill=palette["accent"])
    draw.text((100, y_offset+15), "Description", fill="#ffffff", font=fonts["bold"])
    draw.text((700, y_offset+15), "Qty", fill="#ffffff", font=fonts["bold"])
    draw.text((820, y_offset+15), "Unit Price", fill="#ffffff", font=fonts["bold"])
    draw.text((1000, y_offset+15), "Total Amount", fill="#ffffff", font=fonts["bold"])
    
    y_offset += 60
    alt_bg = False
    for item in line_items:
        if alt_bg:
            draw.rectangle([80, y_offset, width-80, y_offset+50], fill=palette["table_bg"])
        alt_bg = not alt_bg
        
        item_name = item[0][:40] + "..." if len(item[0]) > 40 else item[0]
        draw.text((100, y_offset+10), item_name, fill=palette["text"], font=fonts["regular"])
        draw.text((720, y_offset+10), str(item[1]), fill=palette["text"], font=fonts["regular"])
        draw.text((820, y_offset+10), f"{item[2]:,.2f}", fill=palette["text"], font=fonts["regular"])
        draw.text((1000, y_offset+10), f"{item[3]:,.2f}", fill=palette["text"], font=fonts["regular"])
        y_offset += 50
        
    draw.line([(80, y_offset), (width-80, y_offset)], fill=palette["accent"], width=2)

    # --- TOTALS SECTION ---
    y_offset += 50
    totals_x = 750
    vals_x = 980
    
    draw.text((totals_x, y_offset), "Taxable Amount:", fill=palette["text"], font=fonts["regular"])
    draw.text((vals_x, y_offset), f"₹ {taxable_amount:,.2f}", fill=palette["text"], font=fonts["bold"])
    
    y_offset += 50
    if igst > 0:
        draw.text((totals_x, y_offset), "IGST (18%):", fill=palette["text"], font=fonts["regular"])
        draw.text((vals_x, y_offset), f"₹ {igst:,.2f}", fill=palette["text"], font=fonts["regular"])
        y_offset += 50
    else:
        draw.text((totals_x, y_offset), "CGST (9%):", fill=palette["text"], font=fonts["regular"])
        draw.text((vals_x, y_offset), f"₹ {cgst:,.2f}", fill=palette["text"], font=fonts["regular"])
        y_offset += 40
        draw.text((totals_x, y_offset), "SGST (9%):", fill=palette["text"], font=fonts["regular"])
        draw.text((vals_x, y_offset), f"₹ {sgst:,.2f}", fill=palette["text"], font=fonts["regular"])
        y_offset += 50

    draw.rectangle([totals_x - 20, y_offset, width-80, y_offset+70], fill=palette["accent"])
    draw.text((totals_x, y_offset+15), "Grand Total:", fill="#ffffff", font=fonts["bold"])
    draw.text((vals_x, y_offset+15), f"₹ {grand_total:,.2f}", fill="#ffffff", font=fonts["bold"])

    # --- FOOTER ---
    footer_y = height - 120
    draw.line([(80, footer_y), (width-80, footer_y)], fill=palette["accent"], width=1)
    draw.text((80, footer_y + 20), "Thank you for your business!", fill=palette["text"], font=fonts["bold"])
    draw.text((80, footer_y + 60), "This is a computer-generated invoice and does not require a physical signature.", fill=palette["text"], font=fonts["small"])

    # Save
    filename = os.path.join(OUTPUT_DIR, f"{invoice_num.replace('/', '_')}.png")
    img.save(filename, "PNG")
    print(f"Generated: {filename}")

def main():
    # Clean up old demo images
    for file in os.listdir(OUTPUT_DIR):
        if file.endswith((".jpg", ".jpeg", ".png", ".pdf")):
            try:
                os.remove(os.path.join(OUTPUT_DIR, file))
            except Exception as e:
                print(f"Failed to remove {file}: {e}")

    # Generate the 4 specific highly tailored demo invoices
    for profile in INVOICE_PROFILES:
        generate_invoice(profile)
        
    print("Successfully generated 4 highly realistic and specific demo invoices.")

if __name__ == "__main__":
    main()
