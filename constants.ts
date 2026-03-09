
import { Angle } from './types';

export const staticAngles: Angle[] = [
  { id: 1, name: '右侧45度角', type: 'Classic 45° R', promptSuffix: '45 degree side angle view from right, cinematic lighting, depth of field, sharp focus, 8k commercial photography, highly detailed, masterpiece', description_cn: '经典右侧45度角，电影感光效，突出产品立体感。' },
  { id: 2, name: '左侧45度角', type: 'Classic 45° L', promptSuffix: '45 degree side angle view from left, cinematic lighting, depth of field, sharp focus, 8k commercial photography, highly detailed, masterpiece', description_cn: '经典左侧45度角，与右侧形成完美对称展示。' },
  { 
    id: 3, 
    name: '侧面60度角', 
    type: 'Side Profile', 
    promptSuffix: 'View the product from a 60-degree side angle. CRITICAL: Strictly maintain the original background, lighting, and environmental context of the reference image. Do not replace the scene, only rotate the subject geometry.', 
    description_cn: '60度侧面视角，严格保持原图场景与光影一致，仅改变物体角度。' 
  },
  { id: 4, name: '细节特写', type: 'Macro Detail', promptSuffix: 'extreme close-up macro shot of texture and material details, bokeh background, sharp details, high fidelity, 8k resolution, product texture focus', description_cn: '极致微距特写，展示材质与纹理，背景虚化。' },
  { 
    id: 5, 
    name: '生活场景化', 
    type: 'Lifestyle', 
    promptSuffix: 'A natural, lifelike photograph is essential. If the reference image depicts a specific scene, you must preserve that scene and not alter the background. Use a slightly angled perspective, with a table in the foreground that complements the scene, products stacked on the table, and the products still visible in the background. Use a wide aperture, focus on the foreground subject, and employ natural lighting that matches the source of the products, 8k resolution .', 
    description_cn: '自然生活感视角，延续原图的场景氛围（如原图有背景则保留），呈现真实质感。' 
  },
  { id: 6, name: '独特创意展示', type: 'Unique Creative', promptSuffix: 'Surrealist artistic composition, anti-gravity, high-end aesthetics, soft geometric shapes, flowing silhouettes, dreamlike lighting, award-winning creative advertising, elegant presentation, 8K resolution.', description_cn: '超现实艺术构图，反重力效果，高端美学。' },
  { id: 7, name: '模特场景图', type: 'Model Context', promptSuffix: 'professional fashion model holding or wearing the product, high-end editorial fashion photography, soft lighting, natural posing, vogue style, commercial masterpiece, 8k', description_cn: '专业时尚模特展示商品，高端杂志风格。' },
  { 
    id: 8, 
    name: '斜俯拍', 
    type: 'High Oblique', 
    promptSuffix: 'High-angle oblique view (45 degrees down). CRITICAL: Preserve the spatial context, floor/surface texture, and shadows of the reference image. Do not change the environment, just the camera height.', 
    description_cn: '45度斜俯拍，保留原图的环境纹理与空间感，仅调整相机高度。' 
  },
  { id: 9, name: '艺术静物 (几何展台)', type: 'Geo Still Life', promptSuffix: 'creative still life photography, conceptual product photography, product styled on geometric stone podiums and blocks, architectural composition, sculptural styling, soft artistic studio lighting, high-end minimalist aesthetic, neutral tones, 8k resolution', description_cn: '在几何展台上进行艺术造型，雕塑感构图。' },
  { id: 10, name: '面料垂感展示', type: 'Fabric Drape', promptSuffix: "A commercial photography set. On the right, the main duvet cover hangs on a rack, its soft, wavy drape showcasing its large pattern. On the left, two matching pillows are stacked vertically. A matching sheet is laid beneath the pillows. Ambient lighting, the same background as the reference image, highly accurate texture details, 8K resolution—a masterpiece.", description_cn: '将被套面料悬挂展示，以自然垂落的波浪形态，突出面料的垂坠感与抗皱性。' },
  { 
    id: 11, 
    name: '户外外拍', 
    type: 'Outdoor Scene', 
    promptSuffix: 'A realistic outdoor bedroom scene, nestled within a lush garden. The master bedroom bed rests quietly on a verdant lawn. To the left, a classic white pillar, entwined with pink roses, supports a long, flowing white sheer canopy that sways gently in the breeze. Two white bedside tables flank the bed, adorned with suitable decorative items. In the foreground, pink rose petals are scattered across the lawn, creating a beautiful scene. The background features blooming white trees and a clear blue sky. Soft natural light creates an ethereal atmosphere, presented in high-definition 8K quality.', 
    description_cn: '置身于花园草坪的户外卧室场景，自然光线与飘逸白纱，营造梦幻氛围。' 
  },
];

export const dynamicAngleSlots: Angle[] = [
  { id: 12, name: 'AI 智能视点 A', type: 'Smart Analysis', promptSuffix: 'analyzing...', description_cn: 'AI 正在探索独特视角...', isDynamic: true },
  { id: 13, name: 'AI 智能视点 B', type: 'Smart Analysis', promptSuffix: 'analyzing...', description_cn: 'AI 正在探索独特视角...', isDynamic: true },
];
