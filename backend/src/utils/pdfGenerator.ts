import PDFDocument from 'pdfkit';
import { Response } from 'express';

export const generateChallanPDF = (challan: any, res: Response) => {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  doc.pipe(res);

  // Header / Company Logo & Info
  doc
    .fillColor('#1E293B')
    .fontSize(22)
    .font('Helvetica-Bold')
    .text('APEX WHOLESALE & DISTRIBUTION', 40, 40);

  doc
    .fillColor('#64748B')
    .fontSize(9)
    .font('Helvetica')
    .text('102 Logistics Park, Industrial Zone, Phase II', 40, 68)
    .text('Email: info@apexdistributors.com | Phone: +91 98765 43210 | GSTIN: 27AAAAA0000A1Z5', 40, 80);

  doc
    .moveTo(40, 98)
    .lineTo(555, 98)
    .strokeColor('#CBD5E1')
    .lineWidth(1)
    .stroke();

  // Document Title & Badge
  doc
    .fillColor('#0F172A')
    .fontSize(16)
    .font('Helvetica-Bold')
    .text('SALES CHALLAN / INVOICE', 40, 115);

  const statusColor =
    challan.status === 'CONFIRMED'
      ? '#166534'
      : challan.status === 'DRAFT'
      ? '#854D0E'
      : '#991B1B';

  doc
    .fillColor(statusColor)
    .fontSize(10)
    .font('Helvetica-Bold')
    .text(`[ STATUS: ${challan.status} ]`, 420, 115, { align: 'right' });

  // Customer and Order Details Box
  doc
    .rect(40, 140, 250, 90)
    .fillAndStroke('#F8FAFC', '#E2E8F0');

  doc
    .fillColor('#334155')
    .fontSize(10)
    .font('Helvetica-Bold')
    .text('CUSTOMER DETAILS', 50, 148);

  doc
    .fillColor('#0F172A')
    .fontSize(10)
    .font('Helvetica-Bold')
    .text(challan.customer.name, 50, 164)
    .font('Helvetica')
    .fontSize(9)
    .fillColor('#475569')
    .text(challan.customer.businessName, 50, 178)
    .text(`Mobile: ${challan.customer.mobile}`, 50, 190)
    .text(`GSTIN: ${challan.customer.gstNumber || 'N/A'}`, 50, 202)
    .text(`Address: ${challan.customer.address}`, 50, 214, { width: 230 });

  doc
    .rect(305, 140, 250, 90)
    .fillAndStroke('#F8FAFC', '#E2E8F0');

  doc
    .fillColor('#334155')
    .fontSize(10)
    .font('Helvetica-Bold')
    .text('CHALLAN METADATA', 315, 148);

  doc
    .fillColor('#475569')
    .fontSize(9)
    .font('Helvetica')
    .text('Challan No:', 315, 166)
    .font('Helvetica-Bold')
    .fillColor('#0F172A')
    .text(challan.challanNumber, 400, 166)
    .font('Helvetica')
    .fillColor('#475569')
    .text('Date:', 315, 182)
    .fillColor('#0F172A')
    .text(new Date(challan.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' }), 400, 182)
    .font('Helvetica')
    .fillColor('#475569')
    .text('Issued By:', 315, 198)
    .fillColor('#0F172A')
    .text(challan.createdBy?.name || 'System', 400, 198);

  // Line Items Table Header
  const tableTop = 250;

  doc
    .rect(40, tableTop, 515, 24)
    .fill('#1E293B');

  doc
    .fillColor('#FFFFFF')
    .fontSize(9)
    .font('Helvetica-Bold')
    .text('S.No', 48, tableTop + 7)
    .text('Item Description / SKU', 90, tableTop + 7)
    .text('Unit Price', 330, tableTop + 7, { width: 60, align: 'right' })
    .text('Qty', 400, tableTop + 7, { width: 50, align: 'right' })
    .text('Subtotal (₹)', 460, tableTop + 7, { width: 85, align: 'right' });

  let y = tableTop + 24;

  challan.items.forEach((item: any, idx: number) => {
    const bg = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
    doc.rect(40, y, 515, 22).fill(bg);

    doc
      .fillColor('#334155')
      .fontSize(9)
      .font('Helvetica')
      .text((idx + 1).toString(), 48, y + 6)
      .text(`${item.productNameSnapshot} (${item.skuSnapshot})`, 90, y + 6, { width: 230 })
      .text(`₹${item.unitPriceSnapshot.toFixed(2)}`, 330, y + 6, { width: 60, align: 'right' })
      .text(item.quantity.toString(), 400, y + 6, { width: 50, align: 'right' })
      .font('Helvetica-Bold')
      .text(`₹${item.subtotal.toFixed(2)}`, 460, y + 6, { width: 85, align: 'right' });

    y += 22;
  });

  // Table Bottom Line
  doc
    .moveTo(40, y)
    .lineTo(555, y)
    .strokeColor('#CBD5E1')
    .stroke();

  y += 15;

  // Summary Box
  doc
    .rect(320, y, 235, 60)
    .fillAndStroke('#F1F5F9', '#CBD5E1');

  doc
    .fillColor('#475569')
    .fontSize(9)
    .font('Helvetica')
    .text('Total Quantity:', 330, y + 12)
    .fillColor('#0F172A')
    .font('Helvetica-Bold')
    .text(`${challan.totalQuantity} Units`, 450, y + 12, { align: 'right' })
    .fillColor('#475569')
    .font('Helvetica')
    .text('Total Amount:', 330, y + 34)
    .fillColor('#0284C7')
    .font('Helvetica-Bold')
    .fontSize(12)
    .text(`₹${challan.totalAmount.toFixed(2)}`, 430, y + 32, { align: 'right' });

  y += 90;

  // Terms and Signature Footer
  doc
    .fillColor('#64748B')
    .fontSize(8)
    .font('Helvetica')
    .text('Terms & Conditions:', 40, y)
    .text('1. Goods once dispatched will not be returned unless damaged during transit.', 40, y + 12)
    .text('2. Payment is due within 15 days of challan issuance.', 40, y + 22);

  doc
    .fillColor('#334155')
    .fontSize(9)
    .font('Helvetica-Bold')
    .text('Authorized Signatory', 420, y + 40, { align: 'center' })
    .moveTo(400, y + 35)
    .lineTo(540, y + 35)
    .strokeColor('#94A3B8')
    .stroke();

  doc.end();
};
