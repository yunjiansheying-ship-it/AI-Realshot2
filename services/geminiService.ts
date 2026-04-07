
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
  refImageBase64?: string | null,
  additionalRefs?: { 
    model?: string | null, 
    scene?: string | null, 
    composition?: string | null,
    category?: string,
    modelAssetType?: string,
    compositionWeight?: number,
    isVectorStyle?: boolean
  }
): Promise<string | null> => {
  const ai = getAiClient();
  let fullPrompt = `${productName} ${promptSuffix}`.trim();
  
  if (additionalRefs?.isVectorStyle) {
    fullPrompt = `${fullPrompt}. 
    STRICT COMPOSITION REFERENCE: The [IMAGE_COMPOSITION] is a minimalist vector guide. You MUST 100% mirror its perspective, layout, and the exact stacking/folds of the bedding. 
    FINAL STYLE: Photorealistic commercial photography. Do NOT generate a vector image. The final result must have realistic textures, professional lighting, and a high-end studio atmosphere.`;
  }

  if (additionalRefs?.category) {
    fullPrompt = `[Category: ${additionalRefs.category}] ${fullPrompt}`;
  }

  if (config.imageModel === 'imagen-4.0-generate-001') {
    // Imagen 4.0 doesn't support multiple image inputs in the same way as Gemini
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
    console.log('Using Gemini Vision model path for image generation:', config.imageModel);
    const parts: any[] = [];
    
    // Determine composition instruction based on weight
    const compositionWeight = additionalRefs?.compositionWeight ?? 10;
    let compositionInstruction = "";
    
    if (compositionWeight === 10) {
      compositionInstruction = `ULTRA-STRICT MASKING MODE: Mirror the EXACT framing, camera angle, and spatial arrangement of [IMAGE_COMPOSITION] with ZERO deviation. 
      The material, pattern, and color details from [IMAGE_1] (Primary Product Image) must be mapped with pixel-perfect precision ONLY into the area/shape defined by the objects in [IMAGE_COMPOSITION]. 
      Treat [IMAGE_COMPOSITION] as a rigid, non-negotiable mask; do not allow any creative interpretation, shape changes, or AI hallucinations. The product must strictly adhere to the reference boundaries.`;
    } else if (compositionWeight >= 8) {
      compositionInstruction = "STRICTLY mirror the EXACT framing, camera angle, and spatial arrangement without any deviation.";
    } else if (compositionWeight >= 5) {
      compositionInstruction = `Closely follow the framing and camera angle (Weight: ${compositionWeight}/10).`;
    } else {
      compositionInstruction = `Use the composition as a general guide but feel free to optimize for the best visual result (Weight: ${compositionWeight}/10).`;
    }

    // Build a highly structured and authoritative prompt for strict reference adherence
    let promptText = `CRITICAL INSTRUCTION: You are a professional commercial photographer and AI compositor. 
      Your task is to generate a new, high-quality photorealistic product image by STRICTLY combining the provided reference images.
      
      CORE LOGIC:
      1. SUBJECT: Maintain the EXACT visual identity, texture, and details of the product in the "Primary Product Image".
      2. MODEL: If a "Model Reference" is provided, use the EXACT person, pose, and style from that image.
      3. SCENE: If a "Scene Reference" is provided, use that EXACT environment, background, and lighting as the setting.
      4. COMPOSITION: If a "Composition Reference" is provided, ${compositionInstruction}
      
      Product Name: ${productName || 'The main product'}.
      Category: ${additionalRefs?.category || 'General Product'}.
      ${additionalRefs?.modelAssetType === 'no_model' 
        ? 'MODEL REQUIREMENT: NO MODEL. Do not include any human models in the image. Focus purely on the product and scene.' 
        : (additionalRefs?.modelAssetType && !additionalRefs?.model
          ? `MODEL REQUIREMENT: Include a high-quality, professional ${additionalRefs.modelAssetType.replace('_', ' ')} model interacting with the product. Generate a random, high-quality model based on this type since no reference is provided.`
          : (additionalRefs?.modelAssetType ? `Model Type: ${additionalRefs.modelAssetType}.` : ''))}
      
      Style/Mood: ${promptSuffix}.
      Technical: 8k resolution, masterpiece, high-end commercial photography, sharp focus, professional lighting.`;

    if (additionalRefs?.isVectorStyle) {
      promptText += `\nCOMPOSITION GUIDANCE: 
      - [IMAGE_COMPOSITION] is a minimalist vector line art used ONLY for structural guidance.
      - Maintain 100% structural consistency with the perspective and layout defined in [IMAGE_COMPOSITION].
      - The FINAL OUTPUT must be a PHOTOREALISTIC commercial photograph with high-end textures and realistic lighting.
      - Do NOT output vector lines or a white background unless specified in the scene.`;
    }

    parts.push({ text: promptText });

    if (mainImageBase64) {
      console.log('Adding main product image to parts');
      const mainMimeType = getMimeType(mainImageBase64);
      const mainData = mainImageBase64.split(',')[1];
      parts.push({ inlineData: { mimeType: mainMimeType, data: mainData } });
      parts[0].text += "\n[IMAGE_1]: Primary Product Image. This is the main product that MUST be featured.";
    }

    if (refImageBase64) {
      console.log('Adding style reference image to parts');
      const refMimeType = getMimeType(refImageBase64);
      const refData = refImageBase64.split(',')[1];
      parts.push({ inlineData: { mimeType: refMimeType, data: refData } });
      parts[0].text += "\n[IMAGE_2]: Style/Mood Reference. Use this for overall aesthetic inspiration.";
    }

    // Handle additional Pro references with explicit labels
    if (additionalRefs) {
      if (additionalRefs.model) {
        console.log('Adding model reference image to parts');
        const mime = getMimeType(additionalRefs.model);
        const data = additionalRefs.model.split(',')[1];
        parts.push({ inlineData: { mimeType: mime, data } });
        parts[0].text += "\n[IMAGE_MODEL]: Model Reference. Strictly follow the person and pose in this image.";
      }
      if (additionalRefs.scene) {
        console.log('Adding scene reference image to parts');
        const mime = getMimeType(additionalRefs.scene);
        const data = additionalRefs.scene.split(',')[1];
        parts.push({ inlineData: { mimeType: mime, data } });
        parts[0].text += "\n[IMAGE_SCENE]: Scene Reference. Strictly use this background and environment.";
      }
      if (additionalRefs.composition) {
        console.log('Adding composition reference image to parts');
        const mime = getMimeType(additionalRefs.composition);
        const data = additionalRefs.composition.split(',')[1];
        parts.push({ inlineData: { mimeType: mime, data } });
        parts[0].text += "\n[IMAGE_COMPOSITION]: Composition Reference. Strictly follow this framing and camera angle.";
      }
    }

    const generationConfig: any = {
      temperature: 1.0,
      topP: 0.95,
      topK: 64,
    };
    
    // Construct imageConfig for Gemini models
    generationConfig.imageConfig = {
      aspectRatio: config.aspectRatio || "1:1"
    };
        
    if ((config.imageModel === 'gemini-3-pro-image-preview' || config.imageModel === 'gemini-3.1-flash-image-preview') && ['512px', '1K', '2K', '4K'].includes(config.imageResolution)) {
      generationConfig.imageConfig.imageSize = config.imageResolution;
    }

    console.log('Calling generateContent with parts:', JSON.stringify(parts.map(p => p.text ? { text: p.text.substring(0, 50) + '...' } : { inlineData: { mimeType: p.inlineData.mimeType, dataSize: p.inlineData.data.length } })));
    const response = await ai.models.generateContent({
      model: config.imageModel,
      contents: { parts },
      config: generationConfig,
    });

    console.log('Gemini API response received');
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        console.log('Image part found in response');
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }

    console.warn('No image part found in Gemini response');
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

export const vectorizeImage = async (imageBase64: string, config: ServiceConfig): Promise<string | null> => {
  const ai = getAiClient();
  const mimeType = getMimeType(imageBase64);
  const data = imageBase64.split(',')[1];
  
  const promptText = `
    TASK: Convert this bedroom photography into a MINIMALIST VECTOR LINE DRAWING for use as a composition reference.
    
    STRICT REQUIREMENTS:
    1. BACKGROUND: Pure white background.
    2. LINES: Use clean, equal-thickness black lines for all outlines.
    3. SIMPLIFICATION: Remove all textures, shadows, gradients, and complex details.
    4. SUBJECTS: If there are people, simplify them into clean line outlines.
    5. FOCUS: Maintain the EXACT perspective, layout, and bedding (quilt, pillows) folds from the original image.
    6. COLORING: ONLY fill the bedding (quilt and pillows) with flat, solid colors (e.g., light blue or grey) to highlight them as the focal point. The rest of the image must remain black and white line art.
    
    OUTPUT: A high-quality minimalist vector illustration that mirrors the original composition perfectly.
  `;

  try {
    const response = await ai.models.generateContent({
      model: config.imageModel,
      contents: {
        parts: [
          { text: promptText },
          { inlineData: { mimeType, data } }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1" // Or detect from image
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
  } catch (e) {
    console.error("Vectorization failed:", e);
  }
  return null;
};
