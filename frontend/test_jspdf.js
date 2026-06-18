import { jsPDF } from 'jspdf';

const toBase64 = (arrayBuffer) => {
  let binary = '';
  const bytes = new Uint8Array(arrayBuffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

async function testFont() {
  try {
    const url = 'https://raw.githubusercontent.com/google/fonts/main/ofl/poppins/Poppins-Regular.ttf';
    console.log('Fetching Poppins Regular...');
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const buffer = await response.arrayBuffer();
    const base64 = toBase64(buffer);
    
    console.log('Registering font in jsPDF...');
    const doc = new jsPDF();
    doc.addFileToVFS('Poppins-Regular.ttf', base64);
    doc.addFont('Poppins-Regular.ttf', 'Poppins', 'normal');
    doc.setFont('Poppins', 'normal');
    doc.text('Hello in Poppins font!', 20, 20);
    
    console.log('Success! Registered and set Poppins font successfully.');
  } catch (error) {
    console.error('Font test failed:', error);
  }
}
testFont();
