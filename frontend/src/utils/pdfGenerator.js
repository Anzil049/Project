import { jsPDF } from 'jspdf';

export const generatePrescriptionPDF = (appointment) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Helper variables
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);

  // Colors
  const COLOR_NAVY = [15, 23, 42];      // Primary text/header
  const COLOR_TEAL = [13, 148, 136];    // Accent
  const COLOR_SLATE = [100, 116, 139];  // Secondary text
  const COLOR_LIGHT_BG = [248, 250, 252]; // Light grey background
  const COLOR_BORDER = [226, 232, 240];  // Divider lines

  // 1. HEADER SECTION
  // Doctor details (Left side)
  const doctorName = appointment.doctor_id?.user?.name || 'Dr. Doctor';
  const specialization = appointment.doctor_id?.specialization || 'General Health';
  const hospitalName = appointment.doctor_id?.hospitalId?.name || 'Independent Clinic';
  const docEmail = appointment.doctor_id?.user?.email || '';
  const docPhone = appointment.doctor_id?.user?.phone || '';

  doc.setTextColor(...COLOR_NAVY);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(doctorName, margin, 20);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...COLOR_TEAL);
  doc.text(specialization.toUpperCase(), margin, 25);

  doc.setFontSize(9);
  doc.setTextColor(...COLOR_SLATE);
  if (docEmail || docPhone) {
    doc.text(`${docEmail} | ${docPhone}`, margin, 29);
  }

  // Clinic/Hospital details (Right side)
  doc.setTextColor(...COLOR_NAVY);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(hospitalName, pageWidth - margin, 20, { align: 'right' });
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLOR_SLATE);
  doc.text('Prescription Document', pageWidth - margin, 25, { align: 'right' });

  // Date and Token
  const dateObj = appointment.slot_id?.start_datetime ? new Date(appointment.slot_id.start_datetime) : new Date();
  const dateString = dateObj.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
  doc.text(`Date: ${dateString}`, pageWidth - margin, 29, { align: 'right' });

  // Main Divider Line
  doc.setDrawColor(...COLOR_TEAL);
  doc.setLineWidth(0.8);
  doc.line(margin, 33, pageWidth - margin, 33);

  // 2. PATIENT INFO SECTION
  const patient = appointment.patient_id;
  const snapshot = appointment.patient_snapshot;
  const patientName = patient?.name || snapshot?.name || 'Walk-in Patient';
  
  function calculateAge(dobString) {
    if (!dobString) return 'N/A';
    const dob = new Date(dobString);
    const diffMs = Date.now() - dob.getTime();
    const ageDate = new Date(diffMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  }

  const patientAge = patient?.dob ? calculateAge(patient.dob) : (snapshot?.age || 'N/A');
  const patientGender = patient?.gender || snapshot?.gender || 'N/A';
  const bloodGroup = patient?.bloodGroup || snapshot?.bloodGroup || 'N/A';
  const patientPhone = patient?.phone || snapshot?.phone || 'N/A';
  const patientAddress = patient?.address || snapshot?.address || 'N/A';

  // Draw background box for patient details
  doc.setFillColor(...COLOR_LIGHT_BG);
  doc.setDrawColor(...COLOR_BORDER);
  doc.setLineWidth(0.25);
  doc.roundedRect(margin, 38, contentWidth, 24, 3, 3, 'FD');

  // Patient Info details text
  doc.setTextColor(...COLOR_NAVY);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`Patient: ${patientName.toUpperCase()}`, margin + 5, 44);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLOR_SLATE);
  doc.text(`Age/Gender: ${patientAge} Y / ${patientGender}`, margin + 5, 50);
  doc.text(`Blood Group: ${bloodGroup}`, margin + 5, 55);

  doc.text(`Token Number: T-${appointment.token_number || '-'}`, pageWidth - margin - 5, 44, { align: 'right' });
  doc.text(`Contact: ${patientPhone}`, pageWidth - margin - 5, 50, { align: 'right' });
  doc.text(`Address: ${patientAddress}`, pageWidth - margin - 5, 55, { align: 'right' });

  // 3. VITALS SECTION (Standard + Custom)
  let yOffset = 68;
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...COLOR_NAVY);
  doc.text('CLINICAL VITALS', margin, yOffset);
  yOffset += 4;

  const standardVitals = appointment.vitals || {};
  const customVitals = appointment.custom_vitals || [];

  // Group vitals into list
  const vitalsList = [];
  if (standardVitals.bp) vitalsList.push({ name: 'Blood Pressure', value: standardVitals.bp });
  if (standardVitals.pulse) vitalsList.push({ name: 'Pulse Rate', value: standardVitals.pulse });
  if (standardVitals.temperature) vitalsList.push({ name: 'Temperature', value: standardVitals.temperature });
  if (standardVitals.weight) vitalsList.push({ name: 'Body Weight', value: standardVitals.weight });
  
  customVitals.forEach(cv => {
    vitalsList.push({ name: cv.name, value: cv.value });
  });

  if (vitalsList.length === 0) {
    doc.setFont('Helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(...COLOR_SLATE);
    doc.text('No vitals recorded.', margin, yOffset);
    yOffset += 6;
  } else {
    // Render vitals in a grid: 3 items per row
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);

    const boxWidth = contentWidth / 3;
    const boxHeight = 12;

    for (let i = 0; i < vitalsList.length; i++) {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const bx = margin + (col * boxWidth);
      const by = yOffset + (row * boxHeight);

      // Draw background cell
      doc.setFillColor(252, 253, 253);
      doc.setDrawColor(...COLOR_BORDER);
      doc.roundedRect(bx, by, boxWidth - 2, boxHeight - 2, 1, 1, 'FD');

      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(...COLOR_SLATE);
      doc.setFontSize(7);
      doc.text(vitalsList[i].name.toUpperCase(), bx + 3, by + 4);

      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(...COLOR_NAVY);
      doc.setFontSize(9);
      doc.text(vitalsList[i].value, bx + 3, by + 8.5);
    }
    yOffset += Math.ceil(vitalsList.length / 3) * boxHeight + 4;
  }

  // 4. CHIEF COMPLAINT & DIAGNOSIS
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...COLOR_NAVY);
  doc.text('ASSESSMENT / DIAGNOSIS', margin, yOffset);
  yOffset += 5;

  const diagnosis = appointment.prescription?.diagnosis || 'General Health Review';
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...COLOR_TEAL);
  doc.text(diagnosis, margin, yOffset);
  yOffset += 5;

  if (appointment.reason) {
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...COLOR_SLATE);
    doc.text(`Chief Complaint: ${appointment.reason}`, margin, yOffset);
    yOffset += 6;
  }

  yOffset += 4;

  // 5. MEDICATION SCHEDULE (Rx)
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...COLOR_NAVY);
  doc.text('Rx (Medications)', margin, yOffset);
  yOffset += 4;

  const medicines = appointment.prescription?.medicines || [];

  if (medicines.length === 0) {
    doc.setFont('Helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(...COLOR_SLATE);
    doc.text('No medication prescribed.', margin, yOffset);
    yOffset += 6;
  } else {
    // Header for table
    doc.setFillColor(...COLOR_NAVY);
    doc.rect(margin, yOffset, contentWidth, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    
    doc.text('DRUG NAME', margin + 3, yOffset + 5);
    doc.text('DOSAGE', margin + 60, yOffset + 5);
    doc.text('FREQUENCY', margin + 85, yOffset + 5);
    doc.text('DURATION', margin + 115, yOffset + 5);
    doc.text('INSTRUCTIONS', margin + 140, yOffset + 5);

    yOffset += 8;

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);

    medicines.forEach((med, idx) => {
      // Row highlighting
      if (idx % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(margin, yOffset, contentWidth, 8, 'F');
      }

      doc.setTextColor(...COLOR_NAVY);
      doc.setFont('Helvetica', 'bold');
      doc.text(med.name || 'Drug', margin + 3, yOffset + 5);

      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(...COLOR_NAVY);
      doc.text(med.dosage || '-', margin + 60, yOffset + 5);
      doc.text(med.frequency || '-', margin + 85, yOffset + 5);
      doc.text(med.duration || '-', margin + 115, yOffset + 5);

      doc.setTextColor(...COLOR_SLATE);
      doc.setFontSize(8);
      doc.text(med.instruction || '-', margin + 140, yOffset + 5);
      doc.setFontSize(8.5);

      doc.setDrawColor(...COLOR_BORDER);
      doc.setLineWidth(0.1);
      doc.line(margin, yOffset + 8, pageWidth - margin, yOffset + 8);

      yOffset += 8;
    });
    yOffset += 4;
  }

  // 6. CLINICAL NOTES & ADVICE
  const notes = appointment.consultation_notes || appointment.prescription?.notes || '';
  if (notes) {
    // Avoid running off page bottom: check space, add page if needed
    if (yOffset > pageHeight - 40) {
      doc.addPage();
      yOffset = 20;
    }

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...COLOR_NAVY);
    doc.text('ADVICE & INSTRUCTIONS', margin, yOffset);
    yOffset += 5;

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...COLOR_SLATE);
    
    // Split long text into paragraphs
    const splitNotes = doc.splitTextToSize(notes, contentWidth);
    doc.text(splitNotes, margin, yOffset);
    yOffset += (splitNotes.length * 4) + 6;
  }

  // 7. FOOTER SECTION (Digitally Generated Signature)
  if (yOffset > pageHeight - 35) {
    doc.addPage();
    yOffset = 20;
  }

  yOffset = pageHeight - 30;

  doc.setDrawColor(...COLOR_BORDER);
  doc.setLineWidth(0.25);
  doc.line(margin, yOffset, pageWidth - margin, yOffset);
  
  yOffset += 5;

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...COLOR_SLATE);
  doc.text('This is a digitally generated prescription, signed electronically.', margin, yOffset);
  doc.text(`System ID: ${appointment._id}`, margin, yOffset + 3.5);

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...COLOR_TEAL);
  doc.text(doctorName, pageWidth - margin, yOffset + 3, { align: 'right' });
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...COLOR_SLATE);
  doc.text('Electronically Signed', pageWidth - margin, yOffset + 6.5, { align: 'right' });

  // Save the document
  const fileName = `Prescription_${patientName.replace(/\s+/g, '_')}_${dateObj.toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};
