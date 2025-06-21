// index.js
const QRCode = require('qrcode');
const PDFDocument = require('pdfkit');
const { S3 } = require('aws-sdk');
const JSZip = require('jszip');

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

    // Clean up old files first (5 days old) - runs in background
    cleanupOldFiles(5).catch(error => {
      console.error('Cleanup failed but continuing with QR generation:', error);
    });

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

// Cleanup function that deletes old QR batch files
const cleanupOldFiles = async (olderThanDays = 5) => {
  try {
    const listParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Prefix: 'qr-batches/'
    };

    const objects = await s3.listObjectsV2(listParams).promise();
    
    if (!objects.Contents || objects.Contents.length === 0) {
      console.log('No QR batch files found for cleanup');
      return;
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const objectsToDelete = objects.Contents.filter(obj => 
      obj.LastModified < cutoffDate
    );

    if (objectsToDelete.length > 0) {
      // S3 deleteObjects can handle up to 1000 objects at once
      const deleteParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Delete: {
          Objects: objectsToDelete.map(obj => ({ Key: obj.Key })),
          Quiet: true // Don't return info about deleted objects (reduces response size)
        }
      };

      await s3.deleteObjects(deleteParams).promise();
      console.log(`Cleanup: Deleted ${objectsToDelete.length} QR batch files older than ${olderThanDays} days`);
    } else {
      console.log(`Cleanup: No files older than ${olderThanDays} days found`);
    }
  } catch (error) {
    console.error('Error during cleanup:', error);
    // Don't throw - we don't want cleanup failures to break QR generation
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
  const qrDisplaySize = 80;
  const margin = 20;
  const spacing = 10;
  
  // Increased text area to accommodate both artifact name and artist name
  const textAreaHeight = 50; // Space for text below QR code
  const verticalSpacing = 15; // Space between rows
  const totalCellHeight = qrDisplaySize + textAreaHeight + verticalSpacing;
  const totalCellWidth = qrDisplaySize + spacing;
  
  const qrsPerRow = Math.floor((pageWidth - 2 * margin) / totalCellWidth);
  const qrsPerCol = Math.floor((pageHeight - 2 * margin) / totalCellHeight);
  const qrsPerPage = qrsPerRow * qrsPerCol;

  for (let i = 0; i < artefacts.length; i++) {
    const artefact = artefacts[i];
    
    if (i > 0 && i % qrsPerPage === 0) {
      doc.addPage();
    }

    const pageIndex = i % qrsPerPage;
    const row = Math.floor(pageIndex / qrsPerRow);
    const col = pageIndex % qrsPerRow;

    const x = margin + col * totalCellWidth;
    const y = margin + row * totalCellHeight;

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://quest-sable.vercel.app';
    const qrData = `${baseUrl}/client?id=${artefact.id}`;

    const qrDataUrl = await QRCode.toDataURL(qrData, { 
      width: qrSize,
      margin: 1,
      errorCorrectionLevel: errorCorrectionLevel,
      color: { dark: '#000000', light: '#FFFFFF' }
    });

    const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');
    doc.image(qrBuffer, x, y, { width: qrDisplaySize, height: qrDisplaySize });

    // Add labels with improved spacing
    let currentY = y + qrDisplaySize + 8; // Increased gap from 5 to 8
    
    // Artifact name with consistent font size
    doc.fontSize(8);
    doc.text(artefact.name, x, currentY, { 
      width: qrDisplaySize, 
      align: 'center',
      lineGap: 1
    });
    
    // Calculate actual height used by the name text
    const nameHeight = doc.heightOfString(artefact.name, { 
      width: qrDisplaySize,
      align: 'center'
    });
    
    // Position artist name with proper spacing
    currentY += nameHeight + 5; // 5 points gap between name and artist
    
    // Artist name - always show if it exists (we have enough space now)
    if (artefact.artist) {
      doc.fontSize(6);
      doc.text(`by ${artefact.artist}`, x, currentY, { 
        width: qrDisplaySize, 
        align: 'center',
        lineGap: 1
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
          Metadata: {
            'created-at': new Date().toISOString(),
            'file-type': 'qr-batch-pdf'
          },
          ServerSideEncryption: 'AES256'
        }).promise();

        const downloadUrl = s3.getSignedUrl('getObject', {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: key,
          Expires: 7 * 24 * 3600 // 7 days
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
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://quest-sable.vercel.app';
    const qrData = `${baseUrl}/client?id=${artefact.id}`;

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
    Metadata: {
      'created-at': new Date().toISOString(),
      'file-type': 'qr-batch-zip'
    },
    ServerSideEncryption: 'AES256'
  }).promise();

  return s3.getSignedUrl('getObject', {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    Expires: 7 * 24 * 3600 // 7 days
  });
};