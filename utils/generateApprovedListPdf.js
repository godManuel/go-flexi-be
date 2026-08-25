const PDFDocument = require("pdfkit");

/**
 * Step 4: Approved users are added to an existing PDF list. Two separate
 * lists are kept depending on upgradeType (SMEDAN_CAC vs BUSINESS_COOPERATIVE).
 * This streams a freshly generated PDF snapshot of the current list.
 */
function streamApprovedListPdf(res, { upgradeType, users }) {
  const doc = new PDFDocument({ margin: 40 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="approved-${upgradeType.toLowerCase()}-list.pdf"`,
  );

  doc.pipe(res);

  doc
    .fontSize(16)
    .text(`Approved DWC Users - ${upgradeType}`, { align: "center" });
  doc.moveDown();
  doc.fontSize(11).text(`Total approved: ${users.length}`);
  doc.moveDown();

  users.forEach((u, idx) => {
    doc
      .fontSize(10)
      .text(
        `${idx + 1}. ${u.name}  |  ${u.email}  |  Acct: ${u.usdAccountNumber || "N/A"}  |  Approved: ${
          u.approvedAt ? u.approvedAt.toISOString().split("T")[0] : "N/A"
        }`,
      );
  });

  doc.end();
}

module.exports = { streamApprovedListPdf };
