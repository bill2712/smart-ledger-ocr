import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Transaction, TransactionType } from "../types";

const processFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the Data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

export const extractTransactionsFromImage = async (file: File): Promise<Transaction[]> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please check your environment configuration.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const base64Data = await processFileToBase64(file);

  const schema: Schema = {
    type: Type.ARRAY,
    description: "List of transactions extracted from the image.",
    items: {
      type: Type.OBJECT,
      properties: {
        date: {
          type: Type.STRING,
          description: "The date of the transaction in DD/MM/YYYY format (e.g., 15/12/2025). Normalize year to 4 digits.",
        },
        description: {
          type: Type.STRING,
          description: "The name, item, or description of the transaction.",
        },
        amount: {
          type: Type.NUMBER,
          description: "The absolute numeric value of the transaction amount (no symbols).",
        },
        type: {
          type: Type.STRING,
          enum: [TransactionType.INCOME, TransactionType.EXPENSE],
          description: "Detect if this is money in (refund, income, deposit) or money out (expense, purchase, withdrawal). Default to EXPENSE for receipts.",
        },
      },
      required: ["date", "description", "amount", "type"],
    },
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: file.type,
            },
          },
          {
            text: "Analyze this image (receipt, invoice, or bank statement). Extract all transaction rows. Ensure the date is strictly in DD/MM/YYYY format. Identify if the transaction is an expense (spending) or income (refund/deposit). Return a JSON array.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        systemInstruction: "You are a highly accurate OCR assistant for accounting. Your job is to extract transaction details from images. Pay close attention to dates and prices.",
      },
    });

    const text = response.text;
    if (!text) return [];

    const data = JSON.parse(text) as Transaction[];
    return data;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to extract data from the image. Please try again.");
  }
};
