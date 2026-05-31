import { HfInference } from '@huggingface/inference';

const HF_TOKEN = import.meta.env.VITE_HUGGINGFACE_TOKEN;

if (!HF_TOKEN) {
  console.warn('Hugging Face token not found. Please set VITE_HUGGINGFACE_TOKEN in your .env file');
}

const hf = new HfInference(HF_TOKEN);

export async function summarizeText(text: string): Promise<string> {
  try {
    // Use a multilingual model to generate bullet point summary with specific point count
    const prompt = `Please analyze the following text paragraph by paragraph and extract the most important points. Create exactly 5-6 bullet points summary in the same language as text. Use bullet points (•) for each key point. Make sure each point is concise and captures the main idea from different paragraphs:

Text to analyze:
${text}

Bullet point summary (5-6 points):`;
    
    const response = await hf.textGeneration({
      model: 'microsoft/DialoGPT-medium',
      inputs: prompt,
      parameters: {
        max_new_tokens: 400,
        temperature: 0.6,
        do_sample: true,
        return_full_text: false,
      },
    });

    let summary = response.generated_text.trim();
    
    // Format and ensure bullet points
    if (!summary.includes('•') && !summary.includes('-') && !summary.includes('*')) {
      // If no bullet points, create them from sentences
      const sentences = summary.split(/[.!?]+/).filter(s => s.trim().length > 0);
      summary = sentences.map((sentence, index) => `• ${sentence.trim()}`).join('\n');
    }
    
    // Ensure we have at least 5-6 points
    const bulletPoints = extractBulletPoints(summary);
    if (bulletPoints.length < 5) {
      return createEnhancedBulletPoints(text);
    }
    
    return summary || createEnhancedBulletPoints(text);
  } catch (error) {
    console.error('Error during summarization:', error);
    // Fallback: create bullet points manually with 5-6 points
    return createEnhancedBulletPoints(text);
  }
}

// Extract bullet points from text
function extractBulletPoints(text: string): string[] {
  const lines = text.split('\n');
  const bulletPoints: string[] = [];
  
  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
      bulletPoints.push(trimmed.replace(/^[•\-\*]\s*/, ''));
    }
  });
  
  return bulletPoints;
}

// Enhanced fallback function to create exactly 5-6 bullet points
function createEnhancedBulletPoints(text: string): string {
  // Split text into paragraphs
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
  
  // Extract key sentences from each paragraph
  const keyPoints: string[] = [];
  
  paragraphs.forEach(paragraph => {
    const sentences = paragraph.split(/[.!?]+/).filter(s => s.trim().length > 15);
    
    if (sentences.length > 0) {
      // Take first and most important sentence from each paragraph
      keyPoints.push(sentences[0].trim());
      
      // If paragraph is long, take another key sentence
      if (sentences.length > 2 && paragraph.length > 200) {
        keyPoints.push(sentences[1].trim());
      }
    }
  });
  
  // Ensure we have at least 5-6 points
  let targetPoints = 6;
  if (keyPoints.length < 6) {
    // If not enough points, split longer points or add more sentences
    const additionalPoints: string[] = [];
    paragraphs.forEach(paragraph => {
      const sentences = paragraph.split(/[.!?]+/).filter(s => s.trim().length > 10);
      for (let i = 1; i < Math.min(sentences.length, 3); i++) {
        if (additionalPoints.length < (6 - keyPoints.length)) {
          additionalPoints.push(sentences[i].trim());
        }
      }
    });
    keyPoints.push(...additionalPoints);
  }
  
  // Get exactly 5-6 points
  const finalPoints = keyPoints.slice(0, 6);
  
  // If still less than 5, create shorter points from existing ones
  while (finalPoints.length < 5 && finalPoints.length > 0) {
    const lastPoint = finalPoints[finalPoints.length - 1];
    if (lastPoint.length > 50) {
      // Split long point into two
      const words = lastPoint.split(' ');
      const midPoint = Math.floor(words.length / 2);
      finalPoints.push(words.slice(midPoint).join(' ').trim());
    } else {
      break;
    }
  }
  
  // Format as bullet points
  return finalPoints.map((point, index) => `• ${point}`).join('\n');
}
