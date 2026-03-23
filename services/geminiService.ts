
import { GoogleGenAI, Type } from "@google/genai";

interface ServiceConfig {
  textModel: string;
  imageModel: string;
  imageResolution: string;
  aspectRatio: string;
}

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY is not configured in the environment variables.");
  }
  return new GoogleGenAI({ apiKey });
};

const getMimeType = (dataUrl: string) => {
  return dataUrl.match(/data:([^;]+);base64,/)?.[1] || "image/png";
};

export interface ProductAnalysis {
  description: string;
  lighting: string;
}

export const analyzeImageAndSuggestDescription = async (imageBase64: string, config: ServiceConfig): Promise<ProductAnalysis> => {
  const ai = getAiClient();
  const mimeType = getMimeType(imageBase64);
  const data = imageBase64.split(',')[1];
  
  const prompt = "Analyze this product image. Provide a concise visual description and a suggested optimal lighting condition for professional photography of this product type.";

  const response = await ai.models.generateContent({
    model: config.textModel,
    contents: {
      parts: [
        { text: prompt },
        { inlineData: { mimeType, data } },
      ],
    },
    config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                description: {
                    type: Type.STRING,
                    description: "A concise visual description of the product (color, material, shape, type). Max 30 words."
                },
                lighting: {
                    type: Type.STRING,
                    description: "Suggested optimal lighting condition for this product type (e.g., 'soft diffused light', 'dramatic side lighting')."
                }
            },
            required: ['description', 'lighting']
        }
    }
  });
  
  const resultText = response.text?.trim();
  if (!resultText) {
    return { description: '', lighting: 'bright, even studio light' };
  }

  try {
    const resultJson = JSON.parse(resultText) as ProductAnalysis;
    return resultJson.description && resultJson.lighting 
      ? resultJson 
      : { description: resultText, lighting: 'bright, even studio light' };
  } catch (e) {
      console.error("Failed to parse analysis JSON:", e, resultText);
      return { description: resultText, lighting: 'bright, even studio light' };
  }
};

export const translatePromptToEnglish = async (chineseText: string, config: ServiceConfig): Promise<string> => {
    if (!chineseText.trim()) {
        return "";
    }
    const ai = getAiClient();
    const prompt = `Translate the following Chinese description into a concise, descriptive English prompt suffix suitable for an AI image generator. Focus on visual details. Only return the English translation.
    
    Chinese: "${chineseText}"
    English:`;

    const response = await ai.models.generateContent({
        model: config.textModel,
        contents: prompt
    });

    return response.text?.trim() || '';
}

export const getCreativeConcept = async (productDescription: string, config: ServiceConfig): Promise<string> => {
    const ai = getAiClient();
    const prompt = `Based on the product "${productDescription}", brainstorm a unique, high-end, commercial photography concept.
    Describe a creative scene, atmosphere, or interaction.
    Return ONLY a concise prompt suffix for an image generator.
    Example: for "leather wallet", return "on a vintage wooden desk with a classic fountain pen and a glass of whiskey".
    Example: for "trail running shoes", return "splashing through a muddy puddle on a misty forest path, motion blur".
    Your turn:`;

    const response = await ai.models.generateContent({
        model: config.textModel,
        contents: prompt
    });

    return response.text?.trim() || 'in a minimalist studio with geometric shadows, 8k';
}

export const getPromptFromImage = async (imageBase64: string, config: ServiceConfig): Promise<string> => {
  const ai = getAiClient();
  const mimeType = getMimeType(imageBase64);
  const data = imageBase64.split(',')[1];
  
  const prompt = "Analyze this image in detail. Generate a descriptive English prompt that an AI image generator could use to create a similar image. Describe the subject, the style (e.g., 'oil painting', 'photorealistic', '3d render'), the composition, the lighting, and the overall mood. Be specific. Return ONLY the generated prompt.";

  const response = await ai.models.generateContent({
    model: config.textModel,
    contents: {
      parts: [
        { text: prompt },
        { inlineData: { mimeType, data } },
      ],
    },
  });

  return response.text?.trim() || 'A beautiful landscape, digital art';
};

export const optimizePrompt = async (productName: string, config: ServiceConfig): Promise<string> => {
  const ai = getAiClient();
  const prompt = `Refine this product description for an AI image generator prompt. Make it descriptive but concise: "${productName}"`;
  const response = await ai.models.generateContent({
    model: config.textModel,
    contents: prompt,
  });
  return response.text?.trim() || '';
};

export interface BedroomScene {
  name: string;
  name_cn: string;
  description: string;
  description_cn: string;
  promptSuffix: string;
}

export const getBedroomSceneSuggestions = async (material: string, config: ServiceConfig): Promise<BedroomScene[]> => {
  const ai = getAiClient();
  const prompt = `Based on the product material "${material}", suggest 4 suitable bedroom scenes for product photography. 
  Include both popular/classic and niche/creative bedroom styles from around the world.
  For each scene, provide:
  1. A short name in English.
  2. A short name in Chinese.
  3. A brief description in English.
  4. A brief description in Chinese.
  5. A prompt suffix for an AI image generator (in English).

  Return the result as a JSON array of objects.
  Example:
  [
    {
      "name": "Scandinavian Minimalist",
      "name_cn": "北欧极简风",
      "description": "Clean lines, light wood, and neutral tones.",
      "description_cn": "线条简洁，浅色木材，中性色调。",
      "promptSuffix": "in a bright Scandinavian bedroom with light oak furniture and white linen bedding"
    }
  ]`;

  const response = await ai.models.generateContent({
    model: config.textModel,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            name_cn: { type: Type.STRING },
            description: { type: Type.STRING },
            description_cn: { type: Type.STRING },
            promptSuffix: { type: Type.STRING }
          },
          required: ["name", "name_cn", "description", "description_cn", "promptSuffix"]
        }
      }
    }
  });

  const resultText = response.text?.trim();
  if (!resultText) return [];

  try {
    return JSON.parse(resultText) as BedroomScene[];
  } catch (e) {
    console.error("Failed to parse bedroom scenes JSON:", e, resultText);
    return [];
  }
};

export const generateImage = async (
  productName: string,
  promptSuffix: string,
  config: ServiceConfig,
  mainImageBase64?: string | null,
  refImageBase64?: string | null
): Promise<string | null> => {
  const ai = getAiClient();
  const fullPrompt = `${productName} ${promptSuffix}`.trim();

  if (config.imageModel === 'imagen-4.0-generate-001') {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: fullPrompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/png',
          aspectRatio: config.aspectRatio as any || '1:1',
        },
    });
    
    const base64EncodeString = response.generatedImages?.[0]?.image?.imageBytes;
    if (base64EncodeString) {
      return `data:image/png;base64,${base64EncodeString}`;
    }
    return null;

  } else {
    // Gemini Image models path
    const parts: any[] = [];
    let prompt = "";

    if (mainImageBase64) {
      const mainMimeType = getMimeType(mainImageBase64);
      const mainData = mainImageBase64.split(',')[1];
      prompt = `Generate a high-quality, photorealistic product image. 8k resolution, masterpiece, commercial photography.
        Product/Subject: ${productName || 'The main object'}.
        Instruction/Scene: ${promptSuffix}.
        Constraint: Maintain the visual identity of the main product.`;
      parts.push({ text: prompt });
      parts.push({ inlineData: { mimeType: mainMimeType, data: mainData } });

      if (refImageBase64) {
        const refMimeType = getMimeType(refImageBase64);
        const refData = refImageBase64.split(',')[1];
        parts.push({ inlineData: { mimeType: refMimeType, data: refData } });
        parts[0].text += " (Use the second image as a style/composition reference)";
      }
    } else {
      prompt = fullPrompt;
      parts.push({ text: prompt });
    }

    const generationConfig: any = {};
    
    // Construct imageConfig for Gemini models
    generationConfig.imageConfig = {
      aspectRatio: config.aspectRatio || "1:1"
    };
        
    if ((config.imageModel === 'gemini-3-pro-image-preview' || config.imageModel === 'gemini-3.1-flash-image-preview') && ['512px', '1K', '2K', '4K'].includes(config.imageResolution)) {
      generationConfig.imageConfig.imageSize = config.imageResolution;
    }

    const response = await ai.models.generateContent({
      model: config.imageModel,
      contents: { parts },
      config: generationConfig,
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }

    return null;
  }
};


export const getDynamicAnglePrompts = async (imageBase64: string, existingAngles: string[], config: ServiceConfig): Promise<string[]> => {
    const ai = getAiClient();
    const mimeType = getMimeType(imageBase64);
    const data = imageBase64.split(',')[1];

    const analysisPrompt = `
    Role: Creative Director for a high-end commercial photography studio.
    
    Task: Analyze the provided product image. Generate 2 UNIQUE, HIGH-IMPACT, and COMMERCIALLY VIABLE photography prompt suffixes.
    
    Constraint: The following angles/styles are ALREADY planned: [${existingAngles.join(', ')}]. DO NOT duplicate them.
    
    Goal: Create "Hero Shots" that stop the scroll. Consider these directions if they fit the product:
    1. Creative Physics (floating, splashing, suspension, balance).
    2. Atmospheric Lighting (god rays, neon noir, dappled sunlight, dramatic rim light).
    3. Abstract/Geometric (mirror reflections, prism effects, geometric prop styling).
    4. Contextual Storytelling (implied human interaction, specific environment).

    Output Format:
    Return ONLY the two descriptive prompt suffixes separated by "|||". Do not add numbering or introductory text. English only.
    
    Example Output: "floating in mid-air with water splashes, high shutter speed, fresh vibe ||| placed on a dark reflective surface with neon cyberpunk lighting, dramatic mood"
    `;
    
    const response = await ai.models.generateContent({
        model: config.textModel,
        contents: {
            parts: [{ text: analysisPrompt }, { inlineData: { mimeType, data } }]
        }
    });

    const analysisResult = response.text;
    
    // Updated fallbacks to be more "Creative/Hero Shot" oriented
    const fallbacks = [
        "Levitating in a surreal minimalist space with soft pastel gradients, commercial masterpiece, 8k",
        "Dramatic low-key lighting with golden rim light, emphasizing the silhouette and premium texture, 8k"
    ];

    if (!analysisResult) {
        return fallbacks;
    }

    let dynamicPrompts = analysisResult.split('|||').map(s => s.trim());
    if (dynamicPrompts.length < 2) {
        return fallbacks;
    }

    for (let i = 0; i < 2; i++) {
        if (!dynamicPrompts[i] || dynamicPrompts[i].length < 10) {
            dynamicPrompts[i] = fallbacks[i];
        }
    }

    return dynamicPrompts.slice(0, 2);
}
