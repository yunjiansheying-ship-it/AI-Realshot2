
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

export interface StyleTemplate {
  name: string;
  name_cn: string;
  promptSuffix: string;
}

export const bedroomStyleTemplates: StyleTemplate[] = [
  { name: 'Modern Minimalist', name_cn: '现代简约风', promptSuffix: 'in a sleek modern minimalist bedroom, clean lines, neutral color palette, high-end designer furniture, soft indirect lighting' },
  { name: 'Scandinavian', name_cn: '北欧风', promptSuffix: 'in a bright Scandinavian bedroom, light oak wood textures, white linen bedding, cozy hygge atmosphere, natural daylight' },
  { name: 'Natural Wood', name_cn: '原木风', promptSuffix: 'in a warm natural wood bedroom, Japanese zen aesthetic, light timber surfaces, minimalist organic decor, soft warm lighting' },
  { name: 'Mid-Century Modern', name_cn: '中古风', promptSuffix: 'in a stylish mid-century modern bedroom, teak wood furniture, vintage 1950s aesthetic, geometric patterns, warm amber tones' },
  { name: 'French Romantic', name_cn: '法式浪漫风', promptSuffix: 'in a luxurious French romantic bedroom, ornate moldings, cream and gold accents, elegant chandelier, soft velvet textures' },
  { name: 'American Vintage', name_cn: '美式复古风', promptSuffix: 'in a classic American vintage bedroom, dark mahogany furniture, traditional patterns, cozy heritage atmosphere, warm lamp light' },
  { name: 'Creamy Style', name_cn: '奶油风', promptSuffix: 'in a soft creamy style bedroom, monochromatic beige and off-white tones, rounded furniture edges, plush textures, gentle diffused light' },
  { name: 'Bohemian', name_cn: '波西米亚风', promptSuffix: 'in a vibrant Bohemian bedroom, eclectic patterns, macrame wall hangings, indoor plants, warm earthy tones, relaxed artistic vibe' },
  { name: 'Nanyang', name_cn: '南洋风', promptSuffix: 'in a tropical Nanyang style bedroom, rattan furniture, dark wood shutters, exotic plants, colonial Southeast Asian aesthetic' },
  { name: 'Industrial', name_cn: '工业风', promptSuffix: 'in a raw industrial bedroom, exposed brick walls, metal accents, concrete textures, large factory windows, edgy urban vibe' },
  { name: 'Cyberpunk Gaming', name_cn: '赛博电竞风', promptSuffix: 'in a high-tech cyberpunk gaming bedroom, neon RGB lighting, futuristic hardware, dark metallic surfaces, synthwave aesthetic' },
  { name: 'Light Luxury', name_cn: '轻奢风', promptSuffix: 'in a sophisticated light luxury bedroom, marble accents, brass details, high-gloss surfaces, premium modern aesthetic' },
  { name: 'Quiet Luxury', name_cn: '静奢风', promptSuffix: 'in an understated quiet luxury bedroom, high-quality natural materials, muted sophisticated colors, timeless minimalist design, expensive textures' },
  { name: 'Biophilic', name_cn: '生机主义风', promptSuffix: 'in a lush biophilic bedroom, abundant indoor greenery, natural stone elements, large windows with forest view, organic vitality' },
  { name: 'Wabi-sabi', name_cn: '侘寂风', promptSuffix: 'in a serene wabi-sabi bedroom, imperfect textures, weathered wood, clay walls, minimalist rustic aesthetic, peaceful solitude' },
  { name: 'Moroccan', name_cn: '摩洛哥风', promptSuffix: 'in an exotic Moroccan bedroom, intricate tile patterns, colorful lanterns, arched doorways, rich textile layers, warm desert tones' },
  { name: 'Mediterranean', name_cn: '地中海风', promptSuffix: 'in a breezy Mediterranean bedroom, whitewashed walls, blue accents, terracotta tiles, coastal sunlight, relaxed seaside vibe' },
  { name: 'Bauhaus', name_cn: '包豪斯风', promptSuffix: 'in a functional Bauhaus bedroom, primary colors, tubular steel furniture, geometric clarity, modernist design principles' },
  { name: 'Minimalism', name_cn: '极简主义风', promptSuffix: 'in an ultra-minimalist bedroom, extreme simplicity, hidden storage, monochrome palette, pure architectural space' },
  { name: 'Memphis', name_cn: '孟菲斯风', promptSuffix: 'in a playful Memphis style bedroom, bold geometric shapes, pop colors, whimsical patterns, 1980s post-modern aesthetic' },
  { name: 'Dark Aesthetic', name_cn: '暗黑美学风', promptSuffix: 'in a moody dark aesthetic bedroom, charcoal walls, dramatic shadows, gothic elegance, velvet and leather textures' },
  { name: 'Cottagecore', name_cn: '考利奇风', promptSuffix: 'in a charming cottagecore bedroom, floral prints, vintage lace, rustic wooden beams, cozy countryside nostalgia' },
  { name: 'Minimalist Mid-Century', name_cn: '极简中古风', promptSuffix: 'in a refined minimalist mid-century bedroom, clean vintage lines, sparse high-end decor, warm wood accents' },
  { name: 'Tactilism', name_cn: '触感主义风', promptSuffix: 'in a texture-rich tactilism bedroom, layered fabrics, varied surface materials, sensory-focused design, soft tactile comfort' },
  { name: 'Digital Zen', name_cn: '数字禅风', promptSuffix: 'in a futuristic digital zen bedroom, clean white surfaces, integrated smart lighting, ethereal atmosphere, technological serenity' },
];
