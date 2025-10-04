// Simple OCR wrapper using tesseract.js; for production consider async queueing and error handling
import Tesseract from "tesseract.js";

export async function extractReceiptData(filePath) {
  const {
    data: { text },
  } = await Tesseract.recognize(filePath, "eng");
  // naive extraction for amount/date
  const amountMatch = text.match(/(\d+[.,]\d{2})/);
  const dateMatch = text.match(/(\d{4}[-\/.]\d{2}[-\/.]\d{2})/);
  return {
    rawText: text,
    amount: amountMatch
      ? parseFloat(amountMatch[1].replace(",", "."))
      : undefined,
    date: dateMatch ? new Date(dateMatch[1]) : undefined,
  };
}
