
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '@/config/config';

const genAI = new GoogleGenerativeAI(config.gemini.apiKey);

export const getGenerativeModel = (modelName: string = 'gemini-2.0-flash') => {
  return genAI.getGenerativeModel({ model: modelName });
};
