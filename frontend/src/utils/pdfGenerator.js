import { jsPDF } from 'jspdf';
import toast from 'react-hot-toast';

// Global cache for Poppins font base64 to prevent multiple downloads
let poppinsRegularBase64 = '';
let poppinsBoldBase64 = '';

const toBase64 = (arrayBuffer) => {
  let binary = '';
  const bytes = new Uint8Array(arrayBuffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

const ensurePoppinsFonts = async (pdfDoc) => {
  const activeFonts = pdfDoc.getFontList();
  if (activeFonts['Poppins']) return;

  try {
    if (!poppinsRegularBase64 || !poppinsBoldBase64) {
      const regularUrl = 'https://raw.githubusercontent.com/google/fonts/main/ofl/poppins/Poppins-Regular.ttf';
      const boldUrl = 'https://raw.githubusercontent.com/google/fonts/main/ofl/poppins/Poppins-Bold.ttf';

      const [resRegular, resBold] = await Promise.all([
        fetch(regularUrl),
        fetch(boldUrl)
      ]);

      if (!resRegular.ok || !resBold.ok) {
        throw new Error('Failed to fetch Poppins fonts');
      }

      const [bufRegular, bufBold] = await Promise.all([
        resRegular.arrayBuffer(),
        resBold.arrayBuffer()
      ]);

      poppinsRegularBase64 = toBase64(bufRegular);
      poppinsBoldBase64 = toBase64(bufBold);
    }

    pdfDoc.addFileToVFS('Poppins-Regular.ttf', poppinsRegularBase64);
    pdfDoc.addFont('Poppins-Regular.ttf', 'Poppins', 'normal');

    pdfDoc.addFileToVFS('Poppins-Bold.ttf', poppinsBoldBase64);
    pdfDoc.addFont('Poppins-Bold.ttf', 'Poppins', 'bold');
  } catch (err) {
    console.error('Failed to load Poppins, falling back to Helvetica:', err);
  }
};

export const generatePrescriptionPDF = async (appointment) => {
  const toastId = toast.loading('Generating premium prescription PDF...');
  
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 16;
    const contentWidth = pageWidth - (margin * 2);

    const dateObj = appointment.date ? new Date(appointment.date) : new Date();

    // Load and register Poppins fonts
    await ensurePoppinsFonts(doc);
    const activeFonts = doc.getFontList();
    const usePoppins = activeFonts['Poppins'] ? true : false;
    const fontName = usePoppins ? 'Poppins' : 'Helvetica';

    // Premium Corporate Medical Color Palette matching reference image
    const COLOR_NAVY = [15, 44, 89];          // Deep clinical navy (Headers, names, main labels)
    const COLOR_SKY_BLUE = [95, 168, 245];     // Corporate sky blue (Accent shapes, icons, highlights)
    const COLOR_LIGHT_BLUE = [239, 246, 255];  // Soft light blue (Patient block background, waves fill)
    const COLOR_WATERMARK = [246, 250, 254];   // Ultra-faint sky blue (Center watermark)
    const COLOR_SLATE = [100, 116, 139];       // Muted slate gray (Descriptions, secondary details)
    const COLOR_BORDER = [191, 219, 254];      // Subtle blue/border color (Form underlines)

    // Stethoscope Icon Drawing Helper
    const drawStethoscope = (pdfDoc, x, y, scale, color, isWatermark = false) => {
      const fillColor = isWatermark ? COLOR_WATERMARK : [255, 255, 255];
      pdfDoc.setDrawColor(...color);
      pdfDoc.setLineWidth(1.0 * scale);
      
      // U-shape tubing using rounded rect
      pdfDoc.setFillColor(...fillColor);
      pdfDoc.roundedRect(x - 7 * scale, y - 4 * scale, 14 * scale, 14 * scale, 7 * scale, 7 * scale, isWatermark ? 'S' : 'FD');
      
      if (!isWatermark) {
        // Clear top half
        pdfDoc.setFillColor(...fillColor);
        pdfDoc.rect(x - 8 * scale, y - 5 * scale, 16 * scale, 5.5 * scale, 'F');
      }
      
      // Ear hooks pointing up and in
      pdfDoc.line(x - 7 * scale, y + 1 * scale, x - 7 * scale, y - 5 * scale);
      pdfDoc.line(x - 7 * scale, y - 5 * scale, x - 4 * scale, y - 8 * scale);
      
      pdfDoc.line(x + 7 * scale, y + 1 * scale, x + 7 * scale, y - 5 * scale);
      pdfDoc.line(x + 7 * scale, y - 5 * scale, x + 4 * scale, y - 8 * scale);
      
      // Ear tips (small solid circles)
      pdfDoc.setFillColor(...color);
      pdfDoc.circle(x - 4 * scale, y - 8 * scale, 0.7 * scale, 'F');
      pdfDoc.circle(x + 4 * scale, y - 8 * scale, 0.7 * scale, 'F');
      
      // Middle Plus Circle (Medicine / Cross Icon) between ear tubes
      pdfDoc.setFillColor(...fillColor);
      pdfDoc.circle(x, y - 1 * scale, 3.2 * scale, isWatermark ? 'S' : 'FD');
      
      // Cross inside
      pdfDoc.setLineWidth(0.8 * scale);
      pdfDoc.line(x - 1.2 * scale, y - 1 * scale, x + 1.2 * scale, y - 1 * scale);
      pdfDoc.line(x, y - 2.2 * scale, x, y + 0.2 * scale);
      
      // Lower tubing & chestpiece
      pdfDoc.setLineWidth(1.0 * scale);
      // Tube going down
      pdfDoc.line(x, y + 10 * scale, x, y + 13 * scale);
      
      // curve/loop down-left
      pdfDoc.line(x, y + 13 * scale, x - 4 * scale, y + 17 * scale);
      pdfDoc.line(x - 4 * scale, y + 17 * scale, x - 4 * scale, y + 19 * scale);
      
      // Chestpiece
      pdfDoc.setFillColor(...color);
      pdfDoc.circle(x - 4 * scale, y + 20 * scale, 2.0 * scale, 'FD');
    };

    // Standard Page Initialization (Stethoscope Watermark, Waves, Header, and Footer)
    const initPage = (pdfDoc) => {
      // 1. Faint Stethoscope Watermark in center background
      drawStethoscope(pdfDoc, pageWidth / 2, 140, 3.4, COLOR_WATERMARK, true);

      // 2. Top Left Curved Sky Blue Wave Shape
      pdfDoc.setFillColor(...COLOR_SKY_BLUE);
      pdfDoc.path([
        { op: 'm', c: [0, 0] },
        { op: 'l', c: [95, 0] },
        { op: 'c', c: [75, 12, 35, 20, 0, 26] },
        { op: 'h' }
      ]).fill();
      
      // "PRESCRIPTION" text inside top curve
      pdfDoc.setTextColor(255, 255, 255);
      pdfDoc.setFont(fontName, 'bold');
      pdfDoc.setFontSize(9.5);
      pdfDoc.text('PRESCRIPTION', 12, 11);

      // 3. Doctor Details in Top Right (Stethoscope logo REMOVED per user request)
      const doctorName = appointment.doctor_id?.user?.name || 'Dr. Sarah Miles';
      const specialization = appointment.doctor_id?.specialization || 'General Health Specialist';
      
      // Check if hospital doctor or independent doctor
      const isHospitalDoctor = !!appointment.doctor_id?.hospitalId;
      const hospitalName = isHospitalDoctor ? (appointment.doctor_id?.hospitalId?.name || '') : '';
      const headerTagline = isHospitalDoctor ? hospitalName : '';

      // Doctor text details & DATE stacked on top-right, aligned right
      const rightMarginX = pageWidth - margin; // 194
      
      pdfDoc.setTextColor(...COLOR_NAVY);
      pdfDoc.setFont(fontName, 'bold');
      pdfDoc.setFontSize(13);
      pdfDoc.text(doctorName, rightMarginX, 13, { align: 'right' });

      pdfDoc.setFont(fontName, 'bold');
      pdfDoc.setFontSize(8.5);
      pdfDoc.setTextColor(...COLOR_SKY_BLUE);
      pdfDoc.text(specialization.toUpperCase(), rightMarginX, 17.5, { align: 'right' });

      if (headerTagline) {
        pdfDoc.setFont(fontName, 'normal');
        pdfDoc.setFontSize(7.5);
        pdfDoc.setTextColor(...COLOR_SLATE);
        pdfDoc.text(headerTagline, rightMarginX, 21.5, { align: 'right' });
      }

      // Dynamic Formatted Date stacked on top-right corner
      const formattedDateVal = dateObj.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
      pdfDoc.setFont(fontName, 'bold');
      pdfDoc.setFontSize(7.5);
      pdfDoc.setTextColor(...COLOR_NAVY);
      const dateY = headerTagline ? 25.5 : 21.5;
      pdfDoc.text(`Date: ${formattedDateVal}`, rightMarginX, dateY, { align: 'right' });

      // 4. Bottom-Right Curved Footer Wave
      pdfDoc.setFillColor(...COLOR_LIGHT_BLUE);
      pdfDoc.path([
        { op: 'm', c: [210, 297] },
        { op: 'l', c: [125, 297] },
        { op: 'c', c: [155, 295, 180, 270, 210, 265] },
        { op: 'h' }
      ]).fill();

      // Footer contact info inside bottom right wave (hospital details if hospital doctor, otherwise doctor details)
      const footerNameText = isHospitalDoctor ? hospitalName : doctorName;
      const footerEmail = isHospitalDoctor 
        ? (appointment.doctor_id?.hospitalId?.email || appointment.doctor_id?.user?.email || 'hospital@careclinic.com')
        : (appointment.doctor_id?.user?.email || 'doctor@hospital.com');
      const footerPhone = isHospitalDoctor
        ? (appointment.doctor_id?.hospitalId?.phone || appointment.doctor_id?.user?.phone || '+91 98765 43210')
        : (appointment.doctor_id?.phone || appointment.doctor_id?.user?.phone || '+91 98765 43210');
      const footerWebsite = appointment.doctor_id?.hospitalId?.website || appointment.doctor_id?.website || '';

      pdfDoc.setTextColor(...COLOR_NAVY);
      pdfDoc.setFont(fontName, 'bold');
      pdfDoc.setFontSize(9.5);
      pdfDoc.text(footerNameText, rightMarginX, 276, { align: 'right' });

      pdfDoc.setFont(fontName, 'normal');
      pdfDoc.setFontSize(7);
      pdfDoc.setTextColor(...COLOR_SLATE);
      pdfDoc.text(footerPhone.replace(/^\+/, ''), rightMarginX, 281.5, { align: 'right' });
      pdfDoc.text(footerEmail, rightMarginX, 285.5, { align: 'right' });
      if (footerWebsite) {
        pdfDoc.text(footerWebsite, rightMarginX, 289.5, { align: 'right' });
      }

      // 5. QR Code & Address in Bottom Left
      const qrX = margin;
      const qrY = 272;
      pdfDoc.setDrawColor(...COLOR_SKY_BLUE);
      pdfDoc.setLineWidth(0.4);
      pdfDoc.rect(qrX, qrY, 14, 14);

      // Dynamic QR squares inside
      pdfDoc.setFillColor(...COLOR_SKY_BLUE);
      pdfDoc.rect(qrX + 1.5, qrY + 1.5, 3.5, 3.5, 'F');
      pdfDoc.rect(qrX + 9, qrY + 1.5, 3.5, 3.5, 'F');
      pdfDoc.rect(qrX + 1.5, qrY + 9, 3.5, 3.5, 'F');
      pdfDoc.rect(qrX + 6, qrY + 6, 2, 2, 'F');
      pdfDoc.rect(qrX + 9, qrY + 9, 2.5, 2.5, 'F');
      pdfDoc.rect(qrX + 6, qrY + 10.5, 1.5, 1.5, 'F');
      pdfDoc.rect(qrX + 10.5, qrY + 6, 1.5, 1.5, 'F');

      // Address label & details next to QR Code
      pdfDoc.setTextColor(...COLOR_NAVY);
      pdfDoc.setFont(fontName, 'bold');
      pdfDoc.setFontSize(8.5);
      pdfDoc.text('Address', margin + 18, 276);

      pdfDoc.setFont(fontName, 'normal');
      pdfDoc.setFontSize(7);
      pdfDoc.setTextColor(...COLOR_SLATE);

      // Correct location address: hospital address if hospital doctor, otherwise doctor's address
      let correctAddress = '';
      if (isHospitalDoctor) {
        const rawAddress = appointment.doctor_id?.hospitalId?.address || '';
        const rawCity = appointment.doctor_id?.hospitalId?.city || '';
        const rawState = appointment.doctor_id?.hospitalId?.state || '';
        const rawZip = appointment.doctor_id?.hospitalId?.zip || '';
        correctAddress = [rawAddress, rawCity, rawState, rawZip].filter(Boolean).join(', ');
      } else {
        const docAddress = appointment.doctor_id?.address || appointment.doctor_id?.user?.address || '';
        const docCity = appointment.doctor_id?.user?.city || '';
        const docState = appointment.doctor_id?.user?.state || '';
        const docZip = appointment.doctor_id?.user?.zip || '';
        correctAddress = [docAddress, docCity, docState, docZip].filter(Boolean).join(', ');
      }

      if (!correctAddress) {
        correctAddress = 'Address not provided';
      }

      const splitAddress = pdfDoc.splitTextToSize(correctAddress, 65);
      pdfDoc.text(splitAddress, margin + 18, 280.5);
    };

    initPage(doc);

    // ==================== PAGE 1 CONTENT: DEMOGRAPHICS CARD ====================
    const patient = appointment.patient_id;
    const snapshot = appointment.patient_snapshot;
    const patientName = patient?.name || snapshot?.name || appointment.patient || 'Walk-in Patient';
    
    function calculateAge(dobString) {
      if (!dobString) return 'N/A';
      const dob = new Date(dobString);
      const diffMs = Date.now() - dob.getTime();
      const ageDate = new Date(diffMs);
      return Math.abs(ageDate.getUTCFullYear() - 1970);
    }

    const patientAge = patient?.dob ? calculateAge(patient.dob) : (snapshot?.age || appointment.age || 'N/A');
    const patientGender = patient?.gender || snapshot?.gender || appointment.gender || 'N/A';
    const patientAddress = patient?.address || snapshot?.address || appointment.address || 'N/A';
    const diagnosis = appointment.prescription?.diagnosis || 'Routine Checkup';

    const cardY = 35;
    const cardHeight = 24;

    // Background Demographic fill box
    doc.setFillColor(...COLOR_LIGHT_BLUE);
    doc.rect(margin, cardY, contentWidth, cardHeight, 'F');

    // Text details inside Demographics Card (Double-column layout with aligned underlines - INSURANCE REMOVED)
    doc.setFont(fontName, 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...COLOR_NAVY);

    const colW = contentWidth / 2; // 89
    const lineGap = 6.8;

    // 1. Column 1: Patient Name, Address
    const col1X = margin + 4; // 20
    const col1UnderlineX = margin + 26; // 42 (Aligned underline start for Column 1)
    const col1UnderlineEnd = margin + colW - 4; // 101

    // Row 1: Patient Name
    doc.text('Patient Name', col1X, cardY + 6.2);
    doc.setDrawColor(...COLOR_BORDER);
    doc.setLineWidth(0.3);
    doc.line(col1UnderlineX, cardY + 7.2, col1UnderlineEnd, cardY + 7.2);
    
    doc.setFont(fontName, 'bold');
    doc.setTextColor(...COLOR_NAVY);
    doc.text(patientName, col1UnderlineX + 1.5, cardY + 6.2);

    // Row 2: Address
    doc.setFont(fontName, 'bold');
    doc.text('Address', col1X, cardY + 6.2 + lineGap);
    doc.line(col1UnderlineX, cardY + 6.2 + lineGap + 1.0, col1UnderlineEnd, cardY + 6.2 + lineGap + 1.0);
    
    const shortAddress = patientAddress.length > 28 ? patientAddress.slice(0, 28) + '...' : patientAddress;
    doc.text(shortAddress, col1UnderlineX + 1.5, cardY + 6.2 + lineGap);


    // 2. Column 2: Age, Sex (Insurance removed)
    const col2X = margin + colW + 4; // 109
    const col2UnderlineX = margin + colW + 15; // 120 (Aligned underline start for Column 2)
    const col2UnderlineEnd = margin + contentWidth - 4; // 190

    // Row 1: Age
    doc.setFont(fontName, 'bold');
    doc.text('Age', col2X, cardY + 6.2);
    doc.line(col2UnderlineX, cardY + 7.2, col2UnderlineEnd, cardY + 7.2);
    doc.text(`${patientAge} Y`, col2UnderlineX + 1.5, cardY + 6.2);

    // Row 2: Sex
    doc.text('Sex', col2X, cardY + 6.2 + lineGap);
    doc.line(col2UnderlineX, cardY + 6.2 + lineGap + 1.0, col2UnderlineEnd, cardY + 6.2 + lineGap + 1.0);
    doc.text(patientGender.toUpperCase(), col2UnderlineX + 1.5, cardY + 6.2 + lineGap);


    // 3. Row 3: Diagnosis (spanning full width since insurance was removed)
    const diagX = col1X;
    const diagUnderlineX = col1UnderlineX;
    const diagUnderlineEnd = col2UnderlineEnd; // 190

    doc.text('Diagnosis', diagX, cardY + 6.2 + (lineGap * 2));
    doc.line(diagUnderlineX, cardY + 6.2 + (lineGap * 2) + 1.0, diagUnderlineEnd, cardY + 6.2 + (lineGap * 2) + 1.0);
    
    const formattedDiagnosis = diagnosis.length > 70 ? diagnosis.slice(0, 70) + '...' : diagnosis;
    doc.text(formattedDiagnosis, diagUnderlineX + 1.5, cardY + 6.2 + (lineGap * 2));


    // ==================== SECTION LAYOUT & FLOW ====================
    let yOffset = 68;

    const drawSectionHeader = (title, yPos) => {
      doc.setFont(fontName, 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(...COLOR_NAVY);
      doc.text(title.toUpperCase(), margin, yPos);
      
      doc.setFillColor(...COLOR_SKY_BLUE);
      doc.rect(margin, yPos + 1.8, 8, 0.4, 'F');
      doc.setFillColor(...COLOR_BORDER);
      doc.rect(margin + 8, yPos + 1.95, contentWidth - 8, 0.15, 'F');
    };

    // 1. Recorded Vitals Section
    const standardVitals = appointment.vitals || {};
    const customVitals = appointment.custom_vitals || [];
    const vitalsList = [];

    if (standardVitals.bp) vitalsList.push({ name: 'Blood Pressure', value: standardVitals.bp });
    if (standardVitals.pulse) vitalsList.push({ name: 'Pulse (bpm)', value: standardVitals.pulse });
    if (standardVitals.temperature) vitalsList.push({ name: 'Temp (°F)', value: standardVitals.temperature });
    if (standardVitals.weight) vitalsList.push({ name: 'Weight (kg)', value: standardVitals.weight });
    
    customVitals.forEach(cv => {
      if (cv.name && cv.value) {
        vitalsList.push({ name: cv.name, value: cv.value });
      }
    });

    if (vitalsList.length > 0) {
      drawSectionHeader('Recorded Vitals', yOffset);
      yOffset += 6;

      doc.setFont(fontName, 'normal');
      const cols = 3;
      const colWidth = (contentWidth - 6) / cols;
      const boxHeight = 10;

      for (let i = 0; i < vitalsList.length; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const bx = margin + (col * (colWidth + 3));
        const by = yOffset + (row * (boxHeight + 2.5));

        // Draw cell box
        doc.setFillColor(253, 254, 255);
        doc.setDrawColor(...COLOR_BORDER);
        doc.setLineWidth(0.15);
        doc.roundedRect(bx, by, colWidth, boxHeight, 1.2, 1.2, 'FD');

        // Metric sky-blue indicator bar on the left of each cell
        doc.setFillColor(...COLOR_SKY_BLUE);
        doc.rect(bx, by + 1.2, 0.8, boxHeight - 2.4, 'F');

        // Metric Title
        doc.setFont(fontName, 'bold');
        doc.setTextColor(...COLOR_SLATE);
        doc.setFontSize(6.2);
        doc.text(vitalsList[i].name.toUpperCase(), bx + 2.5, by + 3.4);

        // Metric Value
        doc.setFont(fontName, 'bold');
        doc.setTextColor(...COLOR_NAVY);
        doc.setFontSize(8.5);
        doc.text(vitalsList[i].value, bx + 2.5, by + 7.5);
      }
      yOffset += Math.ceil(vitalsList.length / cols) * (boxHeight + 2.5) + 6;
    }

    // 2. Chief Complaint Section
    if (appointment.reason) {
      drawSectionHeader('Chief Complaint', yOffset);
      yOffset += 6;
      doc.setFont(fontName, 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(...COLOR_SLATE);
      
      const splitReason = doc.splitTextToSize(appointment.reason, contentWidth);
      doc.text(splitReason, margin, yOffset);
      yOffset += (splitReason.length * 4.2) + 6;
    }

    // 3. Medication Schedule (Rx)
    if (yOffset > pageHeight - 64) {
      doc.addPage();
      initPage(doc);
      yOffset = 32; // Offset below header wave
    }

    drawSectionHeader('Medication Schedule (Rx)', yOffset);
    yOffset += 6;

    const medicines = appointment.prescription?.medicines || [];

    if (medicines.length === 0) {
      doc.setFont(fontName, 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(...COLOR_SLATE);
      doc.text('No medicines prescribed.', margin, yOffset);
      yOffset += 8;
    } else {
      // Serif Rx logo on its own line
      doc.setFont('Times', 'italic');
      doc.setFontSize(28);
      doc.setTextColor(...COLOR_SKY_BLUE);
      doc.text('Rx', margin, yOffset + 5.5);
      
      // Move to the next line for the drugs table as requested by the user
      yOffset += 8;

      const tableX = margin;
      const tableWidth = contentWidth;

      // Table Header with corporate sky-blue background spanning full width
      doc.setFillColor(...COLOR_SKY_BLUE);
      doc.rect(tableX, yOffset, tableWidth, 6.8, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont(fontName, 'bold');
      doc.setFontSize(7.2);
      // Adjusted headers for full-width layout
      doc.text('DRUG NAME', tableX + 3, yOffset + 4.5);
      doc.text('DOSAGE', tableX + 50, yOffset + 4.5);
      doc.text('FREQUENCY', tableX + 75, yOffset + 4.5);
      doc.text('DURATION', tableX + 102, yOffset + 4.5);
      doc.text('INSTRUCTIONS', tableX + 128, yOffset + 4.5);

      yOffset += 6.8;
      doc.setFontSize(7.5);

      medicines.forEach((med, idx) => {
        // Row alternating tints (very soft light blue)
        if (idx % 2 === 1) {
          doc.setFillColor(250, 253, 255);
          doc.rect(tableX, yOffset, tableWidth, 8.5, 'F');
        }

        doc.setDrawColor(...COLOR_BORDER);
        doc.setLineWidth(0.12);
        doc.line(tableX, yOffset + 8.5, tableX + tableWidth, yOffset + 8.5);

        doc.setTextColor(...COLOR_NAVY);
        doc.setFont(fontName, 'bold');
        doc.text(med.name || 'Medication', tableX + 3, yOffset + 5.5);

        doc.setFont(fontName, 'normal');
        doc.text(med.dosage || '-', tableX + 50, yOffset + 5.5);
        doc.text(med.frequency || '-', tableX + 75, yOffset + 5.5);
        doc.text(med.duration || '-', tableX + 102, yOffset + 5.5);

        doc.setTextColor(...COLOR_SLATE);
        doc.setFontSize(7);
        doc.text(med.instruction || '-', tableX + 128, yOffset + 5.5);
        doc.setFontSize(7.5);

        yOffset += 8.5;
      });
      yOffset += 8;
    }

    // 4. Clinical Advice & Notes Section
    const notes = appointment.consultation_notes || appointment.prescription?.notes || '';
    if (notes) {
      if (yOffset > pageHeight - 44) {
        doc.addPage();
        initPage(doc);
        yOffset = 32;
      }

      drawSectionHeader('Advice & lifestyle advice', yOffset);
      yOffset += 6;

      doc.setFont(fontName, 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(...COLOR_SLATE);
      
      const splitNotes = doc.splitTextToSize(notes, contentWidth);
      doc.text(splitNotes, margin, yOffset);
      yOffset += (splitNotes.length * 4.2) + 8;
    }

    // 5. Signature Line
    if (yOffset > pageHeight - 38) {
      doc.addPage();
      initPage(doc);
    }

    const signoffY = pageHeight - 38;
    doc.setFont(fontName, 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...COLOR_NAVY);

    // Signature line on the right
    doc.text('Signature', pageWidth - margin - 62, signoffY);
    doc.setDrawColor(...COLOR_BORDER);
    doc.setLineWidth(0.3);
    doc.line(pageWidth - margin - 45, signoffY + 0.8, pageWidth - margin, signoffY + 0.8);

    // Save Document File
    const cleanedName = patientName.replace(/\s+/g, '_');
    const dateStringClean = dateObj.toISOString().split('T')[0];
    const fileName = `Prescription_${cleanedName}_${dateStringClean}.pdf`;
    doc.save(fileName);
    toast.success('Prescription PDF downloaded successfully!', { id: toastId });
  } catch (error) {
    console.error('PDF generation failed:', error);
    toast.error('Failed to download PDF.', { id: toastId });
  }
};
