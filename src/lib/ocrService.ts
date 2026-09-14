/**
 * OCR Service — clean, replaceable placeholder.
 *
 * To connect a real OCR backend (e.g. Tesseract.js, Google Vision, AWS Textract):
 *   1. Replace the body of `extractTextFromImage()` with your implementation.
 *   2. Keep the same signature — no UI changes needed.
 */

export interface OcrResult {
  text: string;
  confidence: number;
  language?: string;
}

/** Simulate OCR by reading a File and returning placeholder text. */
export async function extractTextFromImage(file: File): Promise<OcrResult> {
  const filename = file.name.toLowerCase();

  // Simulate processing delay (300–800ms)
  await new Promise((r) => setTimeout(r, 300 + Math.random() * 500));

  const simulatedText = generateSimulatedText(filename);

  return {
    text: simulatedText,
    confidence: 0.72 + Math.random() * 0.25,
    language: 'en',
  };
}

/** Simulate extracting text from a document file (PDF, DOCX, TXT). */
export async function extractTextFromFile(file: File): Promise<string> {
  const filename = file.name.toLowerCase();

  await new Promise((r) => setTimeout(r, 200 + Math.random() * 400));

  // For .txt files we could actually read the content via FileReader
  if (filename.endsWith('.txt')) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  // For other types, return simulated content
  return generateSimulatedText(filename);
}

function generateSimulatedText(filename: string): string {
  const scenarios = [
    'Urgent: Your account has been compromised. Please verify your login credentials immediately by clicking the link below to prevent account suspension.',
    'Congratulations! You have been selected as the winner of our annual prize draw. Claim your reward of $250,000 by providing your bank details for the transfer.',
    'Your package delivery has been suspended due to incomplete address information. Please update your delivery preferences to avoid return to sender.',
    'Dear Customer, We have detected unusual activity on your account. Please confirm your identity by signing in through the secure portal.',
    'Your Netflix subscription has expired. Update your payment method to continue watching your favourite shows without interruption.',
    'Hi team, just a reminder about the quarterly review meeting scheduled for next Tuesday at 10 AM. Please prepare your updates beforehand.',
  ];

  // Deterministic pick based on filename so same file gets same result
  const index =
    filename.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) %
    scenarios.length;

  return scenarios[index];
}

