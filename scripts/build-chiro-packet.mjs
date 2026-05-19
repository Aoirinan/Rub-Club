/**
 * Rebuild public/chiropractic-new-patient-packet.pdf.
 *
 * Removes "Brandi Baggett, DC" everywhere and fixes typos on the HIPAA page
 * (HIPPA -> HIPAA, EFFECTICE -> EFFECTIVE, ACKOWLEGEMENT -> ACKNOWLEDGMENT).
 *
 * Pages 1, 5, 6, 7, 8 are typeset clean from text.
 * Pages 2, 3, 4, 9 are kept from the original scan (body diagram, checklists,
 * blank CMS-1500) — render once via scripts/extract-pdf-pages.mjs first.
 */
import fs from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit";

const ROOT = path.resolve(path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\//, "")), ".."));
const PAGES_DIR = path.join(ROOT, "scripts", "chiro-packet-scanned-pages");
const OUT = path.join(ROOT, "public", "chiropractic-new-patient-packet.pdf");

const PRACTICE_NAME = "Chiropractic Associates, Inc.";
const PRACTICE_ADDR = "3305 NE Loop 286 Ste.A, Paris, TX 75460";
const PRACTICE_PHONE = "903-785-5551";
const PRACTICE_FAX = "903-784-4188";
const DOCTORS_INLINE = "Gregory Thompson, DC and Sean Welborn, DC";
const DOCTORS_HEADER = "Gregory Thompson, DC    Sean Welborn, DC";
const DOCTORS_DR_HEADER = "Dr. Gregory Thompson    Dr. Sean Welborn";
const DOCTORS_PI_INLINE = "Gregory L. Thompson, DC. and Sean Welborn, DC.";

const PAGE = { W: 612, H: 792, M: 40 };
const COL_GAP = 16;
const COL_W = (PAGE.W - 2 * PAGE.M - COL_GAP) / 2;

function field(doc, label, lineWidth = COL_W - 4) {
  doc.font("Helvetica-Bold").fontSize(9).text(label, { continued: false });
  const y = doc.y;
  doc.moveTo(doc.x, y + 1).lineTo(doc.x + lineWidth, y + 1).lineWidth(0.5).stroke();
  doc.moveDown(0.8);
}

function inlineLabel(doc, label, lineWidth) {
  doc.font("Helvetica-Bold").fontSize(9).text(label, { continued: true });
  doc.font("Helvetica").text(" ", { continued: true });
  const x0 = doc.x;
  const y = doc.y + 9;
  doc.text(" ".repeat(Math.max(2, Math.floor(lineWidth / 4))));
  doc.moveTo(x0, y).lineTo(x0 + lineWidth, y).lineWidth(0.5).stroke();
}

function hr(doc) {
  const y = doc.y + 4;
  doc.moveTo(PAGE.M, y).lineTo(PAGE.W - PAGE.M, y).lineWidth(0.5).stroke();
  doc.moveDown(0.7);
}

function headerCenter(doc, lines, opts = {}) {
  const startY = opts.y ?? PAGE.M;
  doc.y = startY;
  for (const line of lines) {
    const { text, size = 11, bold = false } = typeof line === "string" ? { text: line } : line;
    doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(size);
    doc.text(text, PAGE.M, doc.y, { width: PAGE.W - 2 * PAGE.M, align: "center" });
  }
  doc.moveDown(0.4);
}

function p(doc, text, opts = {}) {
  doc.font(opts.bold ? "Helvetica-Bold" : "Helvetica").fontSize(opts.size ?? 9.5);
  doc.text(text, PAGE.M, doc.y, {
    width: PAGE.W - 2 * PAGE.M,
    align: opts.align ?? "left",
    paragraphGap: opts.gap ?? 4,
    lineGap: 1,
  });
}

function signatureLine(doc, label, width = PAGE.W - 2 * PAGE.M) {
  const y = doc.y + 10;
  doc.moveTo(PAGE.M, y).lineTo(PAGE.M + width, y).lineWidth(0.5).stroke();
  doc.y = y + 2;
  doc.font("Helvetica").fontSize(8).text(label, PAGE.M, doc.y, { width });
  doc.moveDown(0.6);
}

function buildPage1(doc) {
  headerCenter(doc, [
    { text: PRACTICE_NAME, size: 13, bold: true },
    { text: `${PRACTICE_ADDR}`, size: 10 },
    { text: PRACTICE_PHONE, size: 10 },
  ]);
  doc.moveDown(0.3);

  const startY = doc.y;
  const leftX = PAGE.M;
  const rightX = PAGE.M + COL_W + COL_GAP;

  // ---------- LEFT COLUMN ----------
  doc.font("Helvetica-Bold").fontSize(10).text("CONFIDENTIAL PATIENT INFORMATION:", leftX, startY, { width: COL_W });
  let y = doc.y + 4;

  const leftRows = [
    "DATE: ____________________",
    "Patient Name: __________________________________________",
    "                       First           Middle           Last",
    "Address: ________________________________________________",
    "City: ____________________  State: _______  Zip: _________",
    "E-Mail Address: __________________________________________",
    "(your email will be used for internal notifications only)",
    "Sex: ( ) Male  ( ) Female    Number of Children: ________",
    "Your Date of Birth: ______________  Your Age: __________",
    "                          Month/Day/Year",
    "Please Check one:",
    "( ) Married      ( ) Single      ( ) Divorced",
    "( ) Separated    ( ) Widowed     ( ) Minor",
    "Patient Employer: ________________________________________",
    "Occupation: ______________________________________________",
    "Employer Address: ________________________________________",
    "City: ____________________  State: _______  Zip: _________",
    "Employer Phone Number: ___________________________________",
    "Spouse's Name: ___________________________________________",
    "                       First           Middle           Last",
    "Spouse's Date of Birth: __________________  Age: ________",
    "Spouse's Employer: _______________________________________",
    "Spouse's Employer Phone Number: __________________________",
  ];
  doc.font("Helvetica").fontSize(9);
  for (const row of leftRows) {
    doc.text(row, leftX, y, { width: COL_W });
    y = doc.y + 2;
  }

  doc.font("Helvetica-Bold").fontSize(10).text("PHONE NUMBERS:", leftX, y, { width: COL_W });
  y = doc.y + 2;
  const leftRows2 = [
    "Cell Phone: ______________________________________________",
    "Home Phone: ______________________________________________",
    "Best Time To Reach You: __________________________________",
    "In Case of Emergency Call:",
    "Name: ____________________________________________________",
    "Relationship: ____________________________________________",
    "Contact Phone Number: ____________________________________",
  ];
  doc.font("Helvetica").fontSize(9);
  for (const row of leftRows2) {
    doc.text(row, leftX, y, { width: COL_W });
    y = doc.y + 2;
  }

  // ---------- RIGHT COLUMN ----------
  doc.font("Helvetica-Bold").fontSize(10).text("INSURANCE INFORMATION:", rightX, startY, { width: COL_W });
  let ry = doc.y + 4;
  const rightFields = [
    "Who is responsible for this account? _____________________",
    "Insurance Company: _______________________________________",
    "Patient ID #: ____________________________________________",
    "Group #: _________________________________________________",
    "Is patient covered by any other Insurance? ( ) YES   ( ) NO",
    "Subscriber's Name: _______________________________________",
    "(This is the person whose name the policy is under)",
    "Relationship to Patient: __________  Date of Birth: ______",
  ];
  doc.font("Helvetica").fontSize(9);
  for (const row of rightFields) {
    doc.text(row, rightX, ry, { width: COL_W });
    ry = doc.y + 2;
  }

  ry += 2;
  doc.font("Helvetica").fontSize(8.5).text(
    "I Certify that I, and/or my dependent(s) have Insurance coverage with the Insurance I have provided and assign directly to Chiropractic Associates, " +
      DOCTORS_INLINE +
      ", ALL insurance benefits, if any, otherwise payable to me for the services rendered. I understand that I am financially responsible for all charges whether or not they are paid by insurance. I authorize the use of my signature on all insurance submissions.",
    rightX,
    ry,
    { width: COL_W, align: "left", paragraphGap: 4, lineGap: 0.5 },
  );
  ry = doc.y + 4;
  doc.text(
    "The above-named chiropractic doctors may use my healthcare information and disclose such information to the above-named insurance company(ies) and their agents for the purpose of obtaining payment for services and determining insurance benefits or the benefits payable for services rendered. This consent will end one year from the date signed below.",
    rightX,
    ry,
    { width: COL_W, paragraphGap: 4, lineGap: 0.5 },
  );
  ry = doc.y + 6;
  doc.font("Helvetica-Bold").fontSize(9).text("PLEASE SIGN AND DATE:", rightX, ry, { width: COL_W });
  ry = doc.y + 6;
  doc.font("Helvetica").fontSize(9);
  const sigRows = [
    "X ________________________________________________________",
    "print name of patient, parent, guardian or responsible party",
    "",
    "X ________________________________________________________",
    "signature of patient, parent, guardian or responsible party",
    "",
    "Date: ______________   Relationship to Patient: __________",
    "",
    "Who may we send a thank you card for referring you to our office?",
    "__________________________________________________________",
    "",
    "Or how did you hear about our office?",
    "( ) Google   ( ) YellowBook   ( ) Yahoo",
    "( ) Bing   ( ) Our Sign   ( ) Radio/TV",
    "( ) Word of Mouth   ( ) Other: ___________________________",
  ];
  for (const row of sigRows) {
    doc.text(row, rightX, ry, { width: COL_W });
    ry = doc.y + 2;
  }
}

function buildPage5(doc) {
  headerCenter(doc, [
    { text: "CHIROPRACTIC ASSOCIATES", size: 14, bold: true },
    { text: DOCTORS_HEADER, size: 11 },
    { text: `${PRACTICE_ADDR.replace(", Paris, TX 75460", "   Paris, Texas 75460")}`, size: 10 },
    { text: `Ph. (903) 785-5551    Fax (903) 784-4188`, size: 10 },
  ]);
  doc.moveDown(0.8);
  doc.font("Helvetica").fontSize(10).text("Patient Name: ______________________________________________   DOB: ____________", PAGE.M, doc.y, { width: PAGE.W - 2 * PAGE.M });
  doc.moveDown(1);
  headerCenter(doc, [{ text: "ADVANCED ACKNOWLEDGMENT OF NON-COVERED SERVICES", size: 12, bold: true }], { y: doc.y });
  doc.moveDown(0.6);

  const body = [
    "IMPORTANT! Insurance companies have increasingly reduced covered benefits for chiropractic services provided. Every insurance company and most often, every policy offered by an insurance company provide different coverage limitations. Your doctor will make recommendations for treatment based upon what he/she feels is best regarding your health care needs, not based upon your individual insurance benefits. In an effort to provide the most affordable care, our office has decided to continue to participate in network with most insurance companies, in spite of continued reductions in insurance fee schedules. Please be aware that your insurance company will likely not provide coverage for all services provided. Services may be partially covered or not covered at all. The amount you are charged at the time of service is correct and may not be entirely reflected on your insurance explanation of benefits. Our office will NOT provide refunds for non-covered services that were provided to you at the time of service or services that were provided and never submitted for reimbursement to your insurance carrier. Our office will make every effort to attain accurate insurance benefits from your insurance company. However, we are not liable if the information we are given is not correct. For details regarding your chiropractic benefits or limitations of services, please contact your insurance company. If you are concerned about the reduction in fees and/or reduction in benefits by your insurance company, please contact your insurance customer relations department and recommend they increase the chiropractic benefits they provide. Please ask our staff if you have any questions regarding out-of-pocket expenses or details about this form.",
    "By signing below I acknowledge I have read the above statement and agree to abide by the policies detailed within.",
  ];
  for (const para of body) p(doc, para, { gap: 8 });
  doc.moveDown(1.5);
  doc.text("Patient Signature: ______________________________________   Date: ___________", PAGE.M, doc.y, { width: PAGE.W - 2 * PAGE.M });
}

function buildPage6(doc) {
  headerCenter(doc, [
    { text: "Chiropractic Associates Inc.", size: 14, bold: true },
    { text: DOCTORS_DR_HEADER, size: 11, bold: true },
    { text: PRACTICE_ADDR, size: 10 },
    { text: PRACTICE_PHONE, size: 10 },
  ]);
  doc.moveDown(0.8);
  headerCenter(doc, [{ text: "Informed Consent to Chiropractic Treatment", size: 12, bold: true }], { y: doc.y });
  doc.moveDown(0.6);

  const paras = [
    "I hereby request and consent to the performance of chiropractic adjustments and other chiropractic procedures including various modes of physical therapy, and if necessary, diagnostic x-rays on me (or on the patient named below, for whom I am legally responsible: ______________________________ ) by the chiropractor and/or anyone working in this office authorized by the chiropractor.",
    `I further understand that such chiropractic services may be performed by Chiropractic Associates and/or other licensed Doctors of Chiropractic who may treat me now or in the future at this office. I have had an opportunity to discuss with Dr. Gregory Thompson and/or Dr. Sean Welborn and/or with other office or clinic personnel the nature and purpose of chiropractic adjustments and other procedures. I understand that results are not guaranteed.`,
    "I understand and am informed that, as in the practice of medicine and all healthcare, the practice of chiropractic carries some risks to treatment; including, but not limited to: fractures, disc injuries, strokes, transient ischemic attack (TIA's) and sprains. I do not expect the doctor to be able to anticipate and explain all risks and complications. Further, I wish to rely on the doctor to exercise judgment during the course of the procedure which the doctor feels are in my best interests at the time, based upon the facts then known.",
    "I have read, or have had read to me, the above consent. I have also had and opportunity to ask questions about its contents, and by signing below, I agree to the treatment recommended by my doctor. I intend this consent form to cover the entire course of treatment for my present condition(s) for which I seek treatment at this facility.",
  ];
  for (const para of paras) p(doc, para, { gap: 6 });
  doc.moveDown(2);
  doc.font("Helvetica").fontSize(10);
  doc.text("_____________________________________________", PAGE.M, doc.y, { width: PAGE.W - 2 * PAGE.M });
  doc.text("print patient's name", PAGE.M, doc.y);
  doc.moveDown(0.8);
  doc.text("__________________________________________     __________________", PAGE.M, doc.y);
  doc.text("signature of patient                                                                   Date", PAGE.M, doc.y);
  doc.moveDown(0.8);
  doc.text("_____________________________________________", PAGE.M, doc.y);
  doc.text("print name of guardian", PAGE.M, doc.y);
  doc.moveDown(0.8);
  doc.text("__________________________________________     __________________", PAGE.M, doc.y);
  doc.text("signature of guardian                                                                Date", PAGE.M, doc.y);
  doc.moveDown(0.8);
  doc.text("Doctor Signature ___________________________________   Date __________", PAGE.M, doc.y);
}

function buildPage7(doc) {
  headerCenter(doc, [
    { text: "Chiropractic Associates", size: 13, bold: true },
    { text: PRACTICE_ADDR, size: 10 },
  ]);
  doc.moveDown(0.5);
  headerCenter(doc, [{ text: "Assignment of Benefits; Assignment of Cause of Action; Contractual Lien", size: 11, bold: true }], { y: doc.y });
  doc.moveDown(0.4);

  const intro = `The undersigned patient and/or responsible party, in consideration of treatment rendered or to be rendered and for deferred payment, irrevocably and exclusively assigns, grants and conveys, to ${DOCTORS_PI_INLINE}, a lien and assignment of any and all claims, causes of action, and right to any proceeds and/or benefits, including any Personal Injury Protection proceeds and/or benefits that the patient may have against any other person, entity, and/or insurance company for reimbursement and/or payment of the medical charges incurred with all the following rights, power, and authority:`;
  p(doc, intro, { gap: 6, size: 9 });

  const sections = [
    ["RELEASE OF INFORMATION:", "You are authorized to release information concerning my condition and treatment to my insurance company, attorney or insurance adjustor for purposes of processing my claim for benefits and payment for services rendered to me."],
    ["IRREVOCABLE ASSIGNMENT OF RIGHTS:", "You are assigned the exclusive, irrevocable right to any cause of action that exists in my favor against any insurance company for the terms of the policy, including the exclusive, irrevocable right to receive payment for such services, make demand in my name for payment, and prosecute and receive penalties, interest, court loss, or other legally compensable amounts owned by an insurance company in accordance with Article 21.55 of the Texas Insurance Code to cooperate, provide information as needed, and appear as needed, wherever to assist in the prosecution of such claims for benefits upon request."],
    ["DEMAND FOR PAYMENT:", `To any insurance company providing benefits of any kind to me/us for treatment rendered by the physician/facility named above within 5 days following your receipt of such bill for services to the extent of such bills are payable under the terms of the policy. This demand specifically conforms to Sec. 542.057 of the Texas Insurance Code, and Article 21.55 of the Texas Insurance Code, providing for attorney fees, 18% penalty, court cost, and interest from judgment, upon violation. I further instruct the provider to make all checks payable to Chiropractic Associates, and mailed to 3305 NE Loop 286 Ste. A, Paris Tx 75460.`],
    ["THIRD PARTY LIABILITY:", `If my injuries are the result of negligence from a third party, then I instruct the liability carrier to issue a separate draft to pay in full all services rendered, payable directly to Chiropractic Associates, and to send any and all checks to 3305 NE Loop 286 Ste. A, Paris Tx 75460.`],
    ["STATUTE OF LIMITATIONS:", "I waive my rights to claim any statute of limitations regarding claims for services rendered or to be rendered by the physician/facility named above, in addition to reasonable cost of collection, including attorney fees and court cost incurred."],
    ["LIMITED POWER OF ATTORNEY:", "I hereby grant to the physician/facility named above power to endorse my name upon any checks, drafts, or other negotiable instrument representing payment from any insurance company representing payment for treatment and healthcare rendered by the physician/facility named above. I agree that any insurance payment representing an amount in excess of the charges for treatment rendered will be credited to my/our account or forwarded to my/our address upon request in writing to the physician/facility named above."],
    ["REJECTION IN WRITING:", "I hereby authorize the physician/clinic named above to establish a PIP or UM/UIM claim on my behalf. I also instruct my insurance carrier to provide upon request to the provider/clinic named above, any rejections in writing as they apply to my lack of PIP or UM/UIM coverage. I allege that electronic signatures are not adequate proof of rejection, and are invalid to establish rejection, and instruct my carrier to provide only copies of my original signature regarding rejection as evidence of rejection of PIP or UM/UIM."],
    ["TERMINATION OF CARE:", "I hereby acknowledge and understand that if I do not keep appointments as recommended to me by my caring doctor at this clinic, he/she has full and complete right to terminate responsibility for my care and relinquish any disability granted me within a reasonable period of time. If during the course of my care, my insurance company requires me to take an examination from any other doctor, I will notify this physician/facility immediately. I understand the failure to do so may jeopardize my case."],
  ];
  for (const [label, body] of sections) {
    doc.font("Helvetica-Bold").fontSize(9).text(label, PAGE.M, doc.y, { continued: true, width: PAGE.W - 2 * PAGE.M });
    doc.font("Helvetica").fontSize(9).text(" " + body, { paragraphGap: 5, lineGap: 0.5 });
  }
  doc.moveDown(1);
  doc.font("Helvetica").fontSize(10).text("Signature of Patient and/or Responsible Parties:", PAGE.M, doc.y, { width: PAGE.W - 2 * PAGE.M });
  doc.moveDown(2);
  doc.text("___________________________________________________________   Date: ______________", PAGE.M, doc.y);
}

function buildPage8(doc) {
  headerCenter(doc, [
    { text: "Chiropractic Associates", size: 14, bold: true },
    { text: DOCTORS_HEADER, size: 11 },
    { text: PRACTICE_ADDR, size: 10 },
  ]);
  doc.moveDown(0.8);
  headerCenter(doc, [
    { text: "HIPAA", size: 13, bold: true },
    { text: "PRACTICE'S REQUIREMENTS", size: 12, bold: true },
  ], { y: doc.y });
  doc.moveDown(0.7);

  doc.font("Helvetica-Bold").fontSize(10).text("The Practice:", PAGE.M, doc.y, { width: PAGE.W - 2 * PAGE.M });
  doc.moveDown(0.4);
  const items = [
    ["(A)", "is required by Federal Law to maintain the privacy of your PHI and to provide you with this Privacy Notice detailing the Practice's legal duties and privacy practices with respect to your PHI."],
    ["(B)", "under the Privacy Rule, may be required by State Law to grant greater access or maintain greater restrictions on the use or release of your PHI that which is provided for under Federal Law."],
    ["(C)", "is required to abide by the terms of this Privacy Notice."],
    ["(D)", "reserves the right to change the terms of this Privacy Notice and to make the New Privacy Notice provisions effective for all of your PHI that is maintains."],
    ["(E)", "will distribute any revised Privacy Notice to you prior to implementation."],
    ["(F)", "will not retaliate against you for filing a complaint."],
  ];
  for (const [tag, body] of items) {
    doc.font("Helvetica").fontSize(10);
    doc.text(`${tag} ${body}`, PAGE.M + 12, doc.y, { width: PAGE.W - 2 * PAGE.M - 12, paragraphGap: 5, lineGap: 0.5 });
  }
  doc.moveDown(0.8);
  headerCenter(doc, [{ text: "EFFECTIVE DATE", size: 11, bold: true }], { y: doc.y });
  doc.moveDown(0.2);
  p(doc, "This Notice is in effect as of 4/15/2003", { align: "center" });
  doc.moveDown(0.4);
  headerCenter(doc, [{ text: "PATIENT ACKNOWLEDGMENT", size: 11, bold: true }], { y: doc.y });
  doc.moveDown(0.2);
  p(doc, "By subscribing my name below, I acknowledge receipt of a copy of this Notice, and my understanding and my agreement to its terms.", { align: "center" });
  doc.moveDown(2);
  doc.font("Helvetica-Bold").fontSize(11).text("Signature of Patient and/or Responsible party:", PAGE.M, doc.y, { width: PAGE.W - 2 * PAGE.M, align: "center" });
  doc.moveDown(1.5);
  doc.font("Helvetica").fontSize(10).text("__________________________________________________________", PAGE.M, doc.y, { align: "center" });
  doc.moveDown(0.5);
  doc.text("Date: ______________________", PAGE.M, doc.y, { align: "center" });
}

function placeFullPageImage(doc, imagePath) {
  doc.image(imagePath, 0, 0, { fit: [PAGE.W, PAGE.H] });
}

function main() {
  const required = ["page-02.png", "page-03.png", "page-04.png", "page-09.png"];
  for (const f of required) {
    const p = path.join(PAGES_DIR, f);
    if (!fs.existsSync(p)) {
      console.error("Missing rendered page:", p);
      console.error("Missing scanned pages 2,3,4,9 in scripts/chiro-packet-scanned-pages/");
      process.exit(1);
    }
  }

  const doc = new PDFDocument({
    size: "LETTER",
    margin: PAGE.M,
    info: {
      Title: "Chiropractic Associates New Patient Packet",
      Author: "Chiropractic Associates",
      Subject: "New patient intake and HIPAA notice",
    },
  });
  doc.pipe(fs.createWriteStream(OUT));

  buildPage1(doc); doc.addPage();
  placeFullPageImage(doc, path.join(PAGES_DIR, "page-02.png")); doc.addPage();
  placeFullPageImage(doc, path.join(PAGES_DIR, "page-03.png")); doc.addPage();
  placeFullPageImage(doc, path.join(PAGES_DIR, "page-04.png")); doc.addPage();
  buildPage5(doc); doc.addPage();
  buildPage6(doc); doc.addPage();
  buildPage7(doc); doc.addPage();
  buildPage8(doc); doc.addPage();
  placeFullPageImage(doc, path.join(PAGES_DIR, "page-09.png"));

  doc.end();
  doc.on("end", () => {});
  process.on("exit", () => {
    if (fs.existsSync(OUT)) {
      const stat = fs.statSync(OUT);
      console.log(`Wrote ${OUT} (${Math.round(stat.size / 1024)} KB)`);
    }
  });
}

main();
