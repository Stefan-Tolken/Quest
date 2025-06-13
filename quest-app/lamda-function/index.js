// index.js
import QRCode from 'qrcode';
import PDFDocument from 'pdfkit';
import { S3 } from 'aws-sdk';
import JSZip from 'jszip';

const s3 = new S3();

exports.handler = async (event) => {
  try {
    const request = JSON.parse(event.body || '{}');
    const { 
      artefacts, 
      format, 
      imageType = 'png',
      qrSize = 300,
      errorCorrectionLevel = 'L'
    } = request;

    if (!artefacts || artefacts.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'No artefacts provided' })
      };
    }

    if (artefacts.length > 100) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Batch too large. Please use async processing for >100 items.' 
        })
      };
    }

    let downloadUrl;

    if (format === 'pdf') {
      downloadUrl = await generatePDFBatch(artefacts, qrSize, errorCorrectionLevel);
    } else {
      downloadUrl = await generateImageBatch(artefacts, imageType, qrSize, errorCorrectionLevel);
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ downloadUrl })
    };

  } catch (error) {
    console.error('Error generating QR codes:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

const generatePDFBatch = async (
  artefacts, 
  qrSize = 300,
  errorCorrectionLevel = 'L'
) => {
  const doc = new PDFDocument({ margin: 20 });
  const chunks = [];

  doc.on('data', chunk => chunks.push(chunk));

  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const qrDisplaySize = 80; // Display size in PDF (points)
  const margin = 20;
  const spacing = 10;
  
  const qrsPerRow = Math.floor((pageWidth - 2 * margin) / (qrDisplaySize + spacing));
  const qrsPerCol = Math.floor((pageHeight - 2 * margin) / (qrDisplaySize + 40));
  const qrsPerPage = qrsPerRow * qrsPerCol;

  for (let i = 0; i < artefacts.length; i++) {
    const artefact = artefacts[i];
    
    if (i > 0 && i % qrsPerPage === 0) {
      doc.addPage();
    }

    const pageIndex = i % qrsPerPage;
    const row = Math.floor(pageIndex / qrsPerRow);
    const col = pageIndex % qrsPerRow;

    const x = margin + col * (qrDisplaySize + spacing);
    const y = margin + row * (qrDisplaySize + 40);

    // Use similar data structure as your component
    const qrData = JSON.stringify({ 
      artefactId: artefact.id,
      name: artefact.name,
      artist: artefact.artist || null
    });

    // Generate QR code with same error correction level
    const qrDataUrl = await QRCode.toDataURL(qrData, { 
      width: qrSize,
      margin: 1,
      errorCorrectionLevel: errorCorrectionLevel,
      color: { dark: '#000000', light: '#FFFFFF' }
    });

    const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');
    doc.image(qrBuffer, x, y, { width: qrDisplaySize, height: qrDisplaySize });

    // Add labels
    doc.fontSize(8);
    doc.text(artefact.name, x, y + qrDisplaySize + 5, { 
      width: qrDisplaySize, 
      align: 'center' 
    });

    if (artefact.artist) {
      doc.fontSize(6);
      doc.text(`by ${artefact.artist}`, x, y + qrDisplaySize + 18, { 
        width: qrDisplaySize, 
        align: 'center' 
      });
    }
  }

  doc.end();

  return new Promise((resolve, reject) => {
    doc.on('end', async () => {
      try {
        const pdfBuffer = Buffer.concat(chunks);
        const key = `qr-batches/qr-codes-${Date.now()}.pdf`;
        
        await s3.putObject({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: key,
          Body: pdfBuffer,
          ContentType: 'application/pdf',
          Expires: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }).promise();

        const downloadUrl = s3.getSignedUrl('getObject', {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: key,
          Expires: 3600
        });

        resolve(downloadUrl);
      } catch (error) {
        reject(error);
      }
    });
  });
};

const generateImageBatch = async (
  artefacts, 
  imageType,
  qrSize = 300,
  errorCorrectionLevel = 'L'
) => {
  const zip = new JSZip();

  for (const artefact of artefacts) {
    // Use same data structure as your component
    const qrData = JSON.stringify({ 
      artefactId: artefact.id,
      name: artefact.name,
      artist: artefact.artist || null
    });

    const qrBuffer = await QRCode.toBuffer(qrData, { 
      width: qrSize,
      margin: 1,
      type: imageType === 'png' ? 'png' : 'jpeg',
      quality: imageType === 'png' ? undefined : 0.95,
      errorCorrectionLevel: errorCorrectionLevel
    });

    const fileName = `qr-${artefact.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.${imageType}`;
    zip.file(fileName, qrBuffer);
  }

  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
  const key = `qr-batches/qr-codes-${Date.now()}.zip`;
  
  await s3.putObject({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    Body: zipBuffer,
    ContentType: 'application/zip',
    Expires: new Date(Date.now() + 24 * 60 * 60 * 1000)
  }).promise();

  return s3.getSignedUrl('getObject', {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    Expires: 3600
  });
};