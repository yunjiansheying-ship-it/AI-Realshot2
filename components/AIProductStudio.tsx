
import React, { useState, useRef, useEffect } from 'react';
import {
  Upload, ImageIcon, Camera, Download, Maximize2, RefreshCw, Sparkles,
  Layers, Eye, Wand2, Copy, Check, AlertCircle, X, Trash2,
  Shuffle, BrainCircuit, Edit, Cpu, Lock, Loader2, ImagePlus, MessageSquarePlus, Palette, Lightbulb, Settings, Save, ChevronDown, Monitor, Zap, FolderOpen, Clock,
  Square, Copyright, Play
} from 'lucide-react';
import { GeneratedResult, Angle, SavedProject } from '../types';
import { staticAngles, dynamicAngleSlots, bedroomStyleTemplates, StyleTemplate } from '../constants';
import { 
  analyzeImageAndSuggestDescription,
  optimizePrompt,
  generateImage,
  getDynamicAnglePrompts,
  getCreativeConcept,
  translatePromptToEnglish,
  getPromptFromImage,
  getBedroomSceneSuggestions,
  BedroomScene
} from '../services/geminiService';
import GenerationLoader from './GenerationLoader';

// Safe LocalStorage Helper
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn(`LocalStorage access denied for key: ${key}`, e);
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn(`LocalStorage write denied for key: ${key}`, e);
    }
  }
};

interface Props {
  onRequireKey?: () => void;
}

const AIProductStudio = ({ onRequireKey }: Props = {}) => {
  const [mainImage, setMainImage] = useState<string | null>(null);
  const [productName, setProductName] = useState('');
  const [productMaterial, setProductMaterial] = useState('');
  const [bedroomScenes, setBedroomScenes] = useState<BedroomScene[]>([]);
  const [isAnalyzingMaterial, setIsAnalyzingMaterial] = useState(false);
  const [lightingSuggestion, setLightingSuggestion] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResults, setGeneratedResults] = useState<GeneratedResult[]>([]);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [customPrompt, setCustomPrompt] = useState('');
  const [isGeneratingCustom, setIsGeneratingCustom] = useState(false);
  const [isThinkingConcept, setIsThinkingConcept] = useState(false);

  const [remixTarget, setRemixTarget] = useState<GeneratedResult | null>(null);
  const [remixPrompt, setRemixPrompt] = useState('');
  const [remixRefImage, setRemixRefImage] = useState<string | null>(null);
  const [isRemixing, setIsRemixing] = useState(false);

  const [regenerateTarget, setRegenerateTarget] = useState<GeneratedResult | null>(null);
  const [regenerateSuffix, setRegenerateSuffix] = useState('');
  const [regenerateSuffixCn, setRegenerateSuffixCn] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const translationTimeoutRef = useRef<number | null>(null);

  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadFormat, setDownloadFormat] = useState<'png' | 'jpg'>('png');
  const [addWatermark, setAddWatermark] = useState(true);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editableAngles, setEditableAngles] = useState<Angle[]>([]);

  // Abort Controller for stopping generation
  const abortControllerRef = useRef<AbortController | null>(null);

  // State for the new Image-to-Prompt module
  const [reversePromptImage, setReversePromptImage] = useState<string | null>(null);
  const [generatedReversePrompt, setGeneratedReversePrompt] = useState('');
  const [isAnalyzingForPrompt, setIsAnalyzingForPrompt] = useState(false);
  const [isGeneratingFromPrompt, setIsGeneratingFromPrompt] = useState(false);
  const reverseFileInputRef = useRef<HTMLInputElement>(null);

  // State for Model Settings
  const [textModel, setTextModel] = useState('gemini-3.1-pro-preview');
  const [imageModel, setImageModel] = useState('gemini-3.1-flash-image-preview');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  // Initialize resolution correctly based on default model to avoid useEffect loop on mount
  const [imageResolution, setImageResolution] = useState('1K');
  const [aspectRatio, setAspectRatio] = useState('1:1');

  // Project Management State
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [isProjectManagerOpen, setIsProjectManagerOpen] = useState(false);

  // Single Angle Selection State
  const [selectedSingleAngleId, setSelectedSingleAngleId] = useState<number>(staticAngles[0].id);

  const isImagenModel = imageModel === 'imagen-4.0-generate-001';

  // Load saved Projects from localStorage on initial render
  useEffect(() => {
    try {
      const storedProjects = safeLocalStorage.getItem('ai_studio_projects');
      if (storedProjects) {
        setSavedProjects(JSON.parse(storedProjects));
      }
    } catch (e) {
      console.error("Failed to load projects", e);
    }
  }, []);
  
  // Sync resolution with selected image model only when model changes
  useEffect(() => {
    if (imageModel === 'gemini-3-pro-image-preview' || imageModel === 'gemini-3.1-flash-image-preview') {
      setImageResolution('1K'); // Default for pro/high-quality
    } else {
      setImageResolution('Standard'); // Placeholder for other models
    }
  }, [imageModel]);

  const handleSaveProject = () => {
    if (!mainImage && !productName) {
      alert('请至少上传一张图片或输入描述后再保存。');
      return;
    }

    const newProject: SavedProject = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      name: productName || `未命名项目 ${new Date().toLocaleDateString()}`,
      mainImage,
      productName,
      productMaterial,
      lightingSuggestion,
      generatedResults,
      customPrompt
    };

    const updatedProjects = [newProject, ...savedProjects];
    
    try {
      safeLocalStorage.setItem('ai_studio_projects', JSON.stringify(updatedProjects));
      setSavedProjects(updatedProjects);
      alert('项目保存成功！');
    } catch (e) {
      // LocalStorage quota exceeded usually
      alert('存储空间不足！无法保存更多项目。请删除旧项目后重试。');
      console.error("Save failed", e);
    }
  };

  const handleLoadProject = (project: SavedProject) => {
    if (window.confirm('加载项目将覆盖当前工作区的所有内容。确定继续吗？')) {
      setMainImage(project.mainImage);
      setProductName(project.productName);
      setProductMaterial(project.productMaterial || '');
      setLightingSuggestion(project.lightingSuggestion);
      setGeneratedResults(project.generatedResults);
      setCustomPrompt(project.customPrompt || '');
      setIsProjectManagerOpen(false);
    }
  };

  const handleDeleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('确定要删除这个项目吗？此操作不可撤销。')) {
      const updatedProjects = savedProjects.filter(p => p.id !== id);
      setSavedProjects(updatedProjects);
      safeLocalStorage.setItem('ai_studio_projects', JSON.stringify(updatedProjects));
    }
  };
  
  const getServiceConfig = () => ({
    textModel,
    imageModel,
    imageResolution,
    aspectRatio,
  });

  useEffect(() => {
    if (translationTimeoutRef.current) {
      clearTimeout(translationTimeoutRef.current);
    }

    if (regenerateSuffixCn.trim()) {
      setIsTranslating(true);
      translationTimeoutRef.current = window.setTimeout(async () => {
        try {
          const englishPrompt = await translatePromptToEnglish(regenerateSuffixCn, getServiceConfig());
          setRegenerateSuffix(englishPrompt);
        } catch (error) {
          console.error("Translation failed:", error);
        } finally {
          setIsTranslating(false);
        }
      }, 500);
    } else {
        setIsTranslating(false);
    }

    return () => {
      if (translationTimeoutRef.current) {
        clearTimeout(translationTimeoutRef.current);
      }
    };
  }, [regenerateSuffixCn, textModel]);

  const updateResult = (id: number, updates: Partial<GeneratedResult>) => {
      setGeneratedResults(prev => prev.map(item =>
        item.id === id ? { ...item, ...updates } : item
      ));
    };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMainImage(reader.result as string);
        setGeneratedResults([]);
        setProductName('');
        setProductMaterial('');
        setBedroomScenes([]);
        setCustomPrompt('');
        setLightingSuggestion('');
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleReverseImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setReversePromptImage(reader.result as string);
          setGeneratedReversePrompt('');
        };
        reader.readAsDataURL(file);
      }
    };

  const removeReverseImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setReversePromptImage(null);
    setGeneratedReversePrompt('');
    if (reverseFileInputRef.current) {
      reverseFileInputRef.current.value = '';
    }
  };

  const handleAnalyzeForPrompt = async () => {
    if (!reversePromptImage) return;
    setIsAnalyzingForPrompt(true);
    setGeneratedReversePrompt('');
    try {
      const prompt = await getPromptFromImage(reversePromptImage, getServiceConfig());
      setGeneratedReversePrompt(prompt);
    } catch (error) {
      console.error("Reverse prompt analysis failed:", error);
      setGeneratedReversePrompt("Error: Could not analyze the image.");
    } finally {
      setIsAnalyzingForPrompt(false);
    }
  };

  const handleGenerateFromPrompt = async () => {
    if (!generatedReversePrompt) return;
    setIsGeneratingFromPrompt(true);

    const newId = Date.now();
    const newResult: GeneratedResult = {
      id: newId,
      name: `文生图创意`,
      type: 'Image-to-Prompt',
      status: 'loading',
      finalPrompt: generatedReversePrompt,
      imageUrl: null,
      isDynamic: true,
      description_cn: '根据参考图智能分析并生成的创意图片'
    };
    setGeneratedResults(prev => [newResult, ...prev]);

    try {
      const url = await generateImage(generatedReversePrompt, '', getServiceConfig());
      updateResult(newId, { imageUrl: url, status: url ? 'completed' : 'error' });
    } catch (e) {
      updateResult(newId, { status: 'error', errorMessage: processGenerationError(e) });
    }
    setIsGeneratingFromPrompt(false);
  };

  const handleRemixRefUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setRemixRefImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMainImage(null);
    setGeneratedResults([]);
    setProductName('');
    setProductMaterial('');
    setBedroomScenes([]);
    setLightingSuggestion('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAnalyzeMaterial = async () => {
    if (!productMaterial) return;
    setIsAnalyzingMaterial(true);
    try {
      const scenes = await getBedroomSceneSuggestions(productMaterial, getServiceConfig());
      setBedroomScenes(scenes);
    } catch (error) {
      console.error("Material Analysis Error:", error);
    } finally {
      setIsAnalyzingMaterial(false);
    }
  };

  const handleSelectScene = (scene: BedroomScene | StyleTemplate) => {
    setCustomPrompt(scene.promptSuffix);
    // Scroll to creative mode
    const creativeModeElement = document.getElementById('creative-mode-section');
    if (creativeModeElement) {
        creativeModeElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const analyzeImageWithGemini = async () => {
    if (!mainImage) return;
    setIsAnalyzing(true);
    setLightingSuggestion('');
    try {
      const result = await analyzeImageAndSuggestDescription(mainImage, getServiceConfig());
      if (result) {
        setProductName(result.description);
        setLightingSuggestion(result.lighting);
      }
    } catch (error) {
      console.error("Analysis Error:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const optimizePromptWithGemini = async () => {
    if (!productName) return;
    setIsOptimizing(true);
    try {
      const result = await optimizePrompt(productName, getServiceConfig());
      if (result) setProductName(result);
    } catch (error) {
      console.error("Optimization Error:", error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const downloadImageHelper = async (dataUrl: string, filenameBase: string, format: 'png' | 'jpg') => {
      let finalUrl = dataUrl;
      let finalFilename = filenameBase;
  
      const needsCanvasProcessing = addWatermark || format === 'jpg';

      if (needsCanvasProcessing) {
          if (dataUrl.startsWith('data:image')) {
               try {
                  finalUrl = await new Promise<string>((resolve, reject) => {
                      const img = new Image();
                      // Allow cross-origin if needed
                      img.crossOrigin = 'anonymous'; 
                      img.onload = () => {
                          const canvas = document.createElement('canvas');
                          canvas.width = img.width;
                          canvas.height = img.height;
                          const ctx = canvas.getContext('2d');
                          if(ctx) {
                              // Fill white background for JPG transparency issues
                              if (format === 'jpg') {
                                  ctx.fillStyle = '#FFFFFF';
                                  ctx.fillRect(0, 0, canvas.width, canvas.height);
                              }
                              
                              ctx.drawImage(img, 0, 0);

                              if (addWatermark) {
                                  // Dynamic font size based on image width
                                  const fontSize = Math.max(14, Math.floor(canvas.width * 0.025));
                                  const padding = Math.max(10, Math.floor(canvas.width * 0.02));
                                  
                                  const now = new Date();
                                  const timeString = now.toLocaleString('zh-CN', { hour12: false });
                                  const text = `© AI RealShot | ${timeString}`;
                                  
                                  ctx.font = `bold ${fontSize}px sans-serif`;
                                  ctx.textAlign = 'right';
                                  ctx.textBaseline = 'bottom';
                                  
                                  // Shadow for visibility on mixed backgrounds
                                  ctx.shadowColor = 'rgba(0,0,0,0.8)';
                                  ctx.shadowBlur = 4;
                                  ctx.shadowOffsetX = 2;
                                  ctx.shadowOffsetY = 2;
                                  
                                  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                                  ctx.fillText(text, canvas.width - padding, canvas.height - padding);
                              }

                              resolve(canvas.toDataURL(format === 'jpg' ? 'image/jpeg' : 'image/png', 0.92));
                          } else {
                              resolve(dataUrl);
                          }
                      };
                      img.onerror = (e) => reject(e);
                      img.src = dataUrl;
                  });
               } catch (e) {
                  console.error("Image processing failed, falling back to original", e);
               }
          }
      }
      
      finalFilename += format === 'jpg' ? '.jpg' : '.png';
  
      const link = document.createElement('a');
      link.href = finalUrl;
      link.download = finalFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleDownloadAll = async () => {
    const completedImages = generatedResults.filter(r => r.status === 'completed' && r.imageUrl);
    if (completedImages.length === 0) return;

    setIsDownloading(true);
    setDownloadProgress(0);

    for (let i = 0; i < completedImages.length; i++) {
      const result = completedImages[i];
      const safeName = result.name ? result.name.replace(/[^\w\u4e00-\u9fa5\s]/g, '').replace(/\s+/g, '_') : 'image';
      const fileName = `AI_Product_${safeName}_${result.id}`;
      
      await downloadImageHelper(result.imageUrl!, fileName, downloadFormat);

      setDownloadProgress(i + 1);
      if (i < completedImages.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 800));
      }
    }

    setTimeout(() => {
      setIsDownloading(false);
      setDownloadProgress(0);
    }, 1000);
  };

  const handleDownloadSingle = async (result: GeneratedResult) => {
    if (!result.imageUrl) return;
    const safeName = result.name ? result.name.replace(/[^\w\u4e00-\u9fa5\s]/g, '').replace(/\s+/g, '_') : 'image';
    const fileName = `AI_Product_${safeName}_${result.id}`;
    await downloadImageHelper(result.imageUrl, fileName, downloadFormat);
  };

  const processGenerationError = (e: unknown): string => {
    if (e instanceof Error) {
        const message = e.message.toLowerCase();
        if (message.includes('requested entity was not found') || message.includes('permission denied') || message.includes('403')) {
            if (onRequireKey) {
                onRequireKey();
            }
            return '权限不足或未找到实体，请重新配置 API Key';
        }
        if (message.includes('api key') || message.includes('401')) {
            return '认证失败 (Auth)';
        }
    }
    return '生成失败';
  };

  const openEditModal = () => {
    setEditableAngles(JSON.parse(JSON.stringify(staticAngles)));
    setIsEditModalOpen(true);
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
    }
    setIsGenerating(false);
    setIsGeneratingCustom(false);
    setIsThinkingConcept(false);
    setIsRemixing(false);
    setIsGeneratingFromPrompt(false);
    setIsAnalyzing(false);
    setIsOptimizing(false);
    setIsAnalyzingForPrompt(false);

    setGeneratedResults(prev => prev.map(item => 
        (item.status === 'loading' || item.status === 'analyzing') 
        ? { ...item, status: 'error', errorMessage: '用户已终止' } 
        : item
    ));
  };

  const handleSingleGenerate = async () => {
    if (!mainImage || (isImagenModel && mainImage)) return;
    const angle = staticAngles.find(a => a.id === selectedSingleAngleId);
    if (!angle) return;

    const controller = new AbortController();
    abortControllerRef.current = controller;
    const { signal } = controller;

    setIsGenerating(true);

    const fullPromptSuffix = lightingSuggestion ? `${lightingSuggestion}, ${angle.promptSuffix}` : angle.promptSuffix;
    const newId = Date.now();

    const newResult: GeneratedResult = {
      id: newId,
      name: angle.name,
      type: angle.type,
      status: 'loading',
      finalPrompt: `${productName} ${fullPromptSuffix}`,
      isDynamic: false,
      description_cn: angle.description_cn,
      imageUrl: null
    };

    setGeneratedResults(prev => [newResult, ...prev]);

    try {
      const url = await generateImage(productName, fullPromptSuffix, getServiceConfig(), mainImage);
      if (signal.aborted) {
        updateResult(newId, { status: 'error', errorMessage: '用户已终止' });
      } else {
        updateResult(newId, { imageUrl: url, status: url ? 'completed' : 'error' });
      }
    } catch (e) {
      if (!signal.aborted) updateResult(newId, { status: 'error', errorMessage: processGenerationError(e) });
    }

    if (!signal.aborted) setIsGenerating(false);
  };

  const handleGenerate = async (anglesToGenerate: Angle[]) => {
    if (!mainImage || (isImagenModel && mainImage)) return;
    
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const { signal } = controller;

    setIsGenerating(true);
    setIsEditModalOpen(false);

    const initialResults: GeneratedResult[] = [
      ...anglesToGenerate.map(angle => {
        const fullPromptSuffix = lightingSuggestion ? `${lightingSuggestion}, ${angle.promptSuffix}` : angle.promptSuffix;
        return {
          ...angle,
          imageUrl: null,
          status: 'loading' as const,
          finalPrompt: `${productName} ${fullPromptSuffix}`,
          isDynamic: false,
          description_cn: angle.description_cn
        }
      }),
      ...dynamicAngleSlots.map(angle => ({
        ...angle,
        imageUrl: null,
        status: 'analyzing' as const,
        finalPrompt: 'AI 正在分析补充视角...',
        isDynamic: true,
        description_cn: 'AI 正在探索独特视角...'
      }))
    ];
    setGeneratedResults(initialResults);

    const staticPromises = anglesToGenerate.map(async (angle, index) => {
      if (signal.aborted) return;
      await new Promise(r => setTimeout(r, index * 800));
      if (signal.aborted) return;

      const fullPromptSuffix = lightingSuggestion ? `${lightingSuggestion}, ${angle.promptSuffix}` : angle.promptSuffix;
      try {
        const url = await generateImage(productName, fullPromptSuffix, getServiceConfig(), mainImage);
        if (signal.aborted) return;
        updateResult(angle.id, { imageUrl: url, status: url ? 'completed' : 'error' });
      } catch (e: unknown) {
        if (signal.aborted) return;
        updateResult(angle.id, { status: 'error', errorMessage: processGenerationError(e) });
      }
    });

    await Promise.all(staticPromises);
    if (signal.aborted) return;

    let dynamicPrompts: string[] = [];
    try {
        const existingAngleTypes = anglesToGenerate.map(angle => angle.type);
        dynamicPrompts = await getDynamicAnglePrompts(mainImage, existingAngleTypes, getServiceConfig());
    } catch(e) {
        dynamicPrompts = [ "Top down flat lay view...", "Contextual in-hand shot..." ];
    }
    
    if (signal.aborted) return;

    const dynamicPromises = dynamicAngleSlots.map(async (slot, index) => {
      if (signal.aborted) return;
      const specificPrompt = dynamicPrompts[index];
      const fullPromptSuffix = lightingSuggestion ? `${lightingSuggestion}, ${specificPrompt}` : specificPrompt;
      updateResult(slot.id, {
        name: `AI 智能补全 ${['A', 'B'][index]}`,
        type: 'Smart Complement',
        finalPrompt: `${productName} ${fullPromptSuffix}`,
        status: 'loading',
        description_cn: `AI 智能分析的独特构图 #${['A', 'B'][index]}`
      });
      await new Promise(r => setTimeout(r, (index * 1500)));
      if (signal.aborted) return;
      try {
        const url = await generateImage(productName, fullPromptSuffix, getServiceConfig(), mainImage);
        if (signal.aborted) return;
        updateResult(slot.id, { imageUrl: url, status: url ? 'completed' : 'error' });
      } catch (e: unknown) {
        if (signal.aborted) return;
        updateResult(slot.id, { status: 'error', errorMessage: processGenerationError(e) });
      }
    });

    await Promise.all(dynamicPromises);
    if (!signal.aborted) setIsGenerating(false);
  };
  
  const handleCustomGenerate = async () => {
    if (!mainImage || (isImagenModel && mainImage)) return;
    
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const { signal } = controller;

    setIsGeneratingCustom(true);

    let finalSuffix = customPrompt;
    let displayTitle = `自定义: ${customPrompt}`;

    if (!customPrompt.trim()) {
      setIsThinkingConcept(true);
      displayTitle = "大师级自动构思";
      try {
        finalSuffix = await getCreativeConcept(productName, getServiceConfig());
      } catch (e) {
        finalSuffix = `Cinematic commercial photography, in a minimalist studio with geometric shadows, 8k resolution, masterpiece`;
      } finally {
        if (!signal.aborted) setIsThinkingConcept(false);
      }
    }

    if (signal.aborted) {
      setIsGeneratingCustom(false);
      return;
    }

    const fullFinalSuffix = lightingSuggestion ? `${lightingSuggestion}, ${finalSuffix}` : finalSuffix;

    const newId = Date.now();
    const newResult: GeneratedResult = {
      id: newId,
      name: displayTitle,
      type: 'Custom Masterpiece',
      status: 'loading',
      finalPrompt: `${productName} ${fullFinalSuffix}`,
      imageUrl: null,
      isDynamic: true,
      description_cn: customPrompt.trim() ? customPrompt : '大师级 AI 智能构思的独特商业场景'
    };
    setGeneratedResults(prev => [newResult, ...prev]);

    try {
      const url = await generateImage(productName, fullFinalSuffix, getServiceConfig(), mainImage);
      if (signal.aborted) {
        updateResult(newId, { status: 'error', errorMessage: '用户已终止' });
        return;
      }
      updateResult(newId, { imageUrl: url, status: url ? 'completed' : 'error' });
    } catch (e) {
      if (!signal.aborted) updateResult(newId, { status: 'error', errorMessage: processGenerationError(e) });
    }
    if (!signal.aborted) setIsGeneratingCustom(false);
  };

  const handleRemixGenerate = async () => {
    if (!remixTarget || !remixTarget.imageUrl || !remixPrompt || isImagenModel) return;
    
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const { signal } = controller;

    setIsRemixing(true);

    const fullRemixPrompt = lightingSuggestion ? `${lightingSuggestion}, ${remixPrompt}` : remixPrompt;

    const newId = Date.now();
    const newResult: GeneratedResult = {
      id: newId,
      name: `Remix: ${remixTarget.name}`,
      type: 'Secondary Creation',
      status: 'loading',
      finalPrompt: `Remix of ${remixTarget.name}: ${fullRemixPrompt}`,
      imageUrl: null,
      isDynamic: true,
      description_cn: `二次创作: ${remixPrompt}`
    };
    setGeneratedResults(prev => [newResult, ...prev]);
    const originalImageUrl = remixTarget.imageUrl;
    setRemixTarget(null);

    try {
      const url = await generateImage(productName, fullRemixPrompt, getServiceConfig(), originalImageUrl, remixRefImage);
      if (signal.aborted) {
        updateResult(newId, { status: 'error', errorMessage: '用户已终止' });
        return;
      }
      updateResult(newId, { imageUrl: url, status: url ? 'completed' : 'error' });
    } catch (e) {
      if (!signal.aborted) updateResult(newId, { status: 'error', errorMessage: processGenerationError(e) });
    }
    if (!signal.aborted) {
      setIsRemixing(false);
      setRemixRefImage(null);
      setRemixPrompt('');
    }
  };

  const openRemixModal = (result: GeneratedResult) => {
    setRemixTarget(result);
    setRemixPrompt('');
    setRemixRefImage(null);
  };

  const openRegenerateModal = (result: GeneratedResult) => {
    setRegenerateTarget(result);
    const suffix = result.finalPrompt.replace(productName, '').trim();
    setRegenerateSuffix(suffix);
    setRegenerateSuffixCn('');
  };

  const handleRegenerate = async () => {
    if (!regenerateTarget || !mainImage || isImagenModel) return;

    const targetId = regenerateTarget.id;
    const newFullPrompt = `${productName} ${regenerateSuffix}`;
    setRegenerateTarget(null);

    updateResult(targetId, { status: 'loading', finalPrompt: newFullPrompt, description_cn: '自定义调整后的场景' });

    try {
        const url = await generateImage(productName, regenerateSuffix, getServiceConfig(), mainImage);
        updateResult(targetId, { imageUrl: url, status: url ? 'completed' : 'error' });
    } catch (e) {
        updateResult(targetId, { status: 'error', errorMessage: processGenerationError(e) });
    }
  }

  const copyPrompt = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const isCustomGenerating = isGeneratingCustom || isThinkingConcept;

  return (
    <div className="font-sans">
      {previewImage && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-4 sm:p-8 animate-in fade-in duration-200" onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-7xl w-full h-full flex items-center justify-center">
             <button onClick={() => setPreviewImage(null)} className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 z-50 transition-colors pointer-events-auto"><X className="w-8 h-8" /></button>
             <img src={previewImage} alt="Preview" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl border border-indigo-500/20 shadow-indigo-500/20 pointer-events-auto" onClick={(e) => e.stopPropagation()} />
          </div>
        </div>
      )}

      {/* Project Manager Modal */}
      {isProjectManagerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-lg p-4 animate-in fade-in duration-300">
           <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-6xl w-full h-[85vh] flex flex-col overflow-hidden">
              <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/80">
                  <h3 className="text-xl font-bold flex items-center text-indigo-400">
                      <FolderOpen className="w-6 h-6 mr-3" />
                      项目管理器 (Project Manager)
                  </h3>
                  <button onClick={() => setIsProjectManagerOpen(false)} className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-full transition-colors"><X className="w-6 h-6" /></button>
              </div>

              <div className="p-6 overflow-y-auto flex-grow custom-scrollbar bg-slate-950/30">
                 {savedProjects.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 opacity-60">
                        <FolderOpen className="w-20 h-20 mb-4 stroke-1" />
                        <p className="text-lg font-medium">暂无保存的项目</p>
                    </div>
                 ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {savedProjects.map(project => (
                            <div key={project.id} className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-900/20 transition-all group flex flex-col">
                                <div className="relative h-40 bg-slate-900 flex items-center justify-center">
                                    {project.mainImage ? (
                                      <img src={project.mainImage} alt={project.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                    ) : (
                                      <div className="text-slate-600"><ImageIcon className="w-10 h-10" /></div>
                                    )}
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                        <button 
                                          onClick={() => handleLoadProject(project)}
                                          className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg shadow-lg hover:bg-indigo-500 transform hover:scale-105 transition-all"
                                        >
                                          加载项目
                                        </button>
                                    </div>
                                    <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded backdrop-blur-md border border-white/10">
                                       {project.generatedResults.filter(r => r.status === 'completed').length} 张图片
                                    </div>
                                </div>
                                <div className="p-4 flex flex-col flex-grow">
                                    <h4 className="font-bold text-slate-200 truncate mb-1" title={project.name}>{project.name}</h4>
                                    <div className="flex items-center text-xs text-slate-500 mb-3">
                                        <Clock className="w-3 h-3 mr-1" />
                                        {new Date(project.timestamp).toLocaleString()}
                                    </div>
                                    <div className="mt-auto pt-3 border-t border-slate-700 flex justify-between items-center">
                                       <span className="text-[10px] text-slate-600 font-mono">ID: {project.id.slice(0,8)}</span>
                                       <button 
                                         onClick={(e) => handleDeleteProject(project.id, e)}
                                         className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-700/50 rounded transition-colors"
                                         title="删除项目"
                                       >
                                           <Trash2 className="w-4 h-4" />
                                       </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                 )}
              </div>
           </div>
        </div>
      )}

      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                    <h3 className="text-lg font-bold flex items-center text-indigo-300">
                        <Edit className="w-5 h-5 mr-2 text-indigo-400" />
                        编辑批量生成脚本 (Edit Batch Prompts)
                    </h3>
                    <button onClick={() => setIsEditModalOpen(false)} className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-full transition-colors"><X className="w-5 h-5" /></button>
                </div>
                
                <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar">
                  <div className="bg-indigo-950/30 border border-indigo-500/30 text-indigo-200 rounded-lg p-3 text-xs flex items-start">
                    <Zap className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5 text-indigo-400" />
                    <p>在这里，您可以微调每个经典视角的英文AI指令。修改后的指令将用于本次批量生成。</p>
                  </div>
                    {editableAngles.map((angle, index) => (
                        <div key={angle.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 border-b border-slate-800 last:border-b-0">
                            <div className="md:col-span-1">
                                <h4 className="font-bold text-sm text-slate-200">{angle.name}</h4>
                                <p className="text-xs text-slate-500 mt-1">{angle.description_cn}</p>
                            </div>
                            <div className="md:col-span-2">
                                <textarea 
                                    value={angle.promptSuffix}
                                    onChange={(e) => {
                                        const newAngles = [...editableAngles];
                                        newAngles[index].promptSuffix = e.target.value;
                                        setEditableAngles(newAngles);
                                    }}
                                    rows={3}
                                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-y font-mono text-slate-300 placeholder-slate-600"
                                />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-3">
                    <button onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg font-medium text-sm transition-colors">取消</button>
                    <button 
                        onClick={() => handleGenerate(editableAngles)}
                        className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-bold text-sm hover:shadow-[0_0_20px_rgba(99,102,241,0.5)] transition-all flex items-center"
                    >
                        <Sparkles className="w-4 h-4 mr-2" />
                        开始生成 ({editableAngles.length + dynamicAngleSlots.length}张)
                    </button>
                </div>
            </div>
        </div>
      )}
      
      {regenerateTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                    <h3 className="text-lg font-bold flex items-center text-purple-400">
                        <RefreshCw className="w-5 h-5 mr-2" />
                        调整并重绘 (Adjust & Redraw)
                    </h3>
                    <button onClick={() => setRegenerateTarget(null)} className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-full transition-colors"><X className="w-5 h-5" /></button>
                </div>
                
                <div className="p-6 overflow-y-auto space-y-4">
                    <div className="flex gap-6">
                        <img src={regenerateTarget.imageUrl || ''} alt="Source" className="w-1/3 h-40 object-cover rounded-lg shadow-sm border border-slate-700 flex-shrink-0" />
                        <div className="w-2/3">
                           <label className="block text-sm font-bold text-slate-300 mb-1">商品核心描述 (固定)</label>
                           <p className="text-sm p-2 bg-slate-800 border border-slate-700 rounded-md text-slate-400">{productName}</p>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-300 mb-1">用中文描述你的场景 (AI 实时翻译)</label>
                        <textarea 
                            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none resize-none h-20 text-slate-200 placeholder-slate-600"
                            placeholder="例如：在赛博朋克风格的雨夜街道上"
                            value={regenerateSuffixCn}
                            onChange={(e) => setRegenerateSuffixCn(e.target.value)}
                        />
                    </div>
                     <div>
                        <label className="block text-sm font-bold text-slate-300 mb-1 flex items-center">
                            AI 翻译结果 (可编辑)
                            {isTranslating && <Loader2 className="w-4 h-4 ml-2 animate-spin text-purple-500" />}
                        </label>
                        <textarea 
                            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none resize-none h-24 text-slate-200 placeholder-slate-600"
                            value={regenerateSuffix}
                            onChange={(e) => setRegenerateSuffix(e.target.value)}
                        />
                    </div>
                </div>

                <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-3">
                    <button onClick={() => setRegenerateTarget(null)} className="px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg font-medium text-sm transition-colors">取消</button>
                    <button 
                        onClick={handleRegenerate}
                        className="px-6 py-2 bg-purple-600 text-white rounded-lg font-bold text-sm hover:bg-purple-700 shadow-lg shadow-purple-500/20 flex items-center"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        重新绘制
                    </button>
                </div>
            </div>
        </div>
      )}

      {remixTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                    <h3 className="text-lg font-bold flex items-center text-indigo-400">
                        <Palette className="w-5 h-5 mr-2" />
                        二次创作 (Remix Studio)
                    </h3>
                    <button onClick={() => setRemixTarget(null)} className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-full transition-colors"><X className="w-5 h-5" /></button>
                </div>
                
                <div className="p-6 overflow-y-auto">
                    <div className="flex gap-6 mb-6">
                        <div className="w-1/3 flex-shrink-0">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">当前底图</label>
                            <img src={remixTarget.imageUrl || ''} alt="Source" className="w-full h-32 object-cover rounded-lg shadow-sm border border-slate-700" />
                        </div>
                        <div className="w-2/3 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-1">你想如何修改这张图？</label>
                                <textarea 
                                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-24 text-slate-200 placeholder-slate-600"
                                    placeholder="例如：把背景改成夜晚的赛博朋克街道，或者增加雨水效果..."
                                    value={remixPrompt}
                                    onChange={(e) => setRemixPrompt(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-indigo-950/20 rounded-xl p-4 border border-indigo-500/20 mb-6">
                        <label className="block text-sm font-bold text-indigo-300 mb-2 flex items-center">
                            <ImagePlus className="w-4 h-4 mr-2" />
                            (可选) 参考风格图
                        </label>
                        <p className="text-xs text-indigo-400/70 mb-3">上传一张你喜欢的风格/构图图片，AI 将尝试模仿其风格。</p>
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <input type="file" onChange={handleRemixRefUpload} className="hidden" id="remix-upload" accept="image/*" />
                                <label htmlFor="remix-upload" className="px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-indigo-300 font-medium cursor-pointer hover:bg-slate-700 transition-colors flex items-center hover:border-indigo-400">
                                    <Upload className="w-4 h-4 mr-2" />
                                    上传参考图
                                </label>
                            </div>
                            {remixRefImage && (
                                <div className="relative w-12 h-12">
                                    <img src={remixRefImage} alt="Remix Reference" className="w-12 h-12 object-cover rounded-md border border-slate-600" />
                                    <button onClick={() => setRemixRefImage(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"><X className="w-3 h-3" /></button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-3">
                    <button onClick={() => setRemixTarget(null)} className="px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg font-medium text-sm transition-colors">取消</button>
                    <button 
                        onClick={handleRemixGenerate}
                        disabled={!remixPrompt || isRemixing}
                        className={`px-6 py-2 rounded-lg font-bold text-sm shadow-lg flex items-center transition-all ${isRemixing ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed'}`}
                    >
                        {isRemixing ? (
                             <><Square className="w-4 h-4 mr-2 fill-current" onClick={(e) => { e.stopPropagation(); handleStop(); }} /> 停止生成</>
                        ) : (
                             <><Wand2 className="w-4 h-4 mr-2" /> 生成新创意</>
                        )}
                    </button>
                </div>
            </div>
        </div>
      )}

      <header className="bg-slate-900/60 backdrop-blur-md border-b border-slate-800 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 group cursor-pointer">
            <div className="relative">
                <div className="absolute inset-0 bg-indigo-500 rounded-lg blur opacity-40 group-hover:opacity-60 transition-opacity"></div>
                <div className="relative bg-gradient-to-br from-indigo-600 to-purple-700 p-2 rounded-lg border border-white/10">
                  <Camera className="w-5 h-5 text-white" />
                </div>
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 tracking-wide">
              AI RealShot <span className="text-xs font-mono text-slate-500 ml-1 border border-slate-700 px-1 rounded bg-slate-900/50">PRO_GEN_V3.1</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
             <button 
                onClick={() => setIsProjectManagerOpen(true)}
                className="flex items-center px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 hover:text-white transition-all text-xs font-bold"
             >
                 <FolderOpen className="w-4 h-4 mr-2" />
                 项目管理 ({savedProjects.length})
             </button>
             <div className="hidden sm:flex items-center text-xs font-mono text-slate-500">
                <div className="flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>SYSTEM ONLINE</div>
             </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-6">
            {/* Upload Card */}
            <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-white/5 p-6 shadow-xl relative overflow-hidden group">
               <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none"></div>
              <div className="flex justify-between items-center mb-4 relative z-10">
                <h2 className="text-lg font-bold flex items-center text-indigo-200">
                  <ImageIcon className="w-5 h-5 mr-2 text-indigo-500" />
                  原图上传 <span className="text-[10px] ml-2 text-slate-500 font-mono">SOURCE_INPUT</span>
                </h2>
                {(mainImage || productName) && (
                  <button onClick={handleSaveProject} className="text-[10px] flex items-center bg-indigo-900/40 hover:bg-indigo-800/60 text-indigo-300 px-2 py-1 rounded border border-indigo-500/30 transition-colors" title="保存当前项目">
                     <Save className="w-3 h-3 mr-1" /> 保存
                  </button>
                )}
              </div>
              <div className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 overflow-hidden ${mainImage ? 'border-indigo-500/50 bg-indigo-950/20' : 'border-slate-700 hover:border-indigo-500/50 hover:bg-slate-800/50'}`}>
                <input type="file" ref={fileInputRef} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={handleImageUpload} accept="image/*" />
                {mainImage ? (
                  <div className="relative group">
                    <img src={mainImage} alt="Uploaded" className="w-full h-64 object-contain rounded-lg shadow-lg mx-auto" />
                    <button onClick={removeImage} className="absolute top-2 right-2 p-2 bg-slate-900/80 rounded-full text-red-400 hover:text-red-300 border border-red-500/30 shadow-md hover:bg-red-950/50 z-20 pointer-events-auto transition-transform hover:scale-110"><Trash2 className="w-4 h-4" /></button>
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg z-10 pointer-events-none backdrop-blur-sm"><p className="text-white font-medium flex items-center"><RefreshCw className="w-4 h-4 mr-2" />更换图片</p></div>
                  </div>
                ) : (
                  <div className="space-y-4 py-8 pointer-events-none">
                    <div className="w-16 h-16 bg-slate-800/50 border border-slate-700 text-indigo-400 rounded-full flex items-center justify-center mx-auto shadow-[0_0_15px_rgba(99,102,241,0.2)]"><Upload className="w-8 h-8" /></div>
                    <div><p className="text-slate-300 font-medium">点击上传商品图</p><p className="text-slate-500 text-xs mt-1 font-mono">JPG / PNG / WEBP</p></div>
                  </div>
                )}
              </div>
              {mainImage && (
                <button onClick={analyzeImageWithGemini} disabled={isAnalyzing} className="w-full mt-3 py-2 px-3 bg-indigo-950/50 hover:bg-indigo-900/50 text-indigo-300 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center border border-indigo-500/30 hover:border-indigo-400/50">
                   {isAnalyzing ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : <Eye className="w-3 h-3 mr-2" />}
                   {isAnalyzing ? "正在进行量子解析..." : "第一步：AI 识别商品特征"}
                </button>
              )}
              <div className="mt-4 relative z-10">
                 <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center"><Zap className="w-3 h-3 mr-1 text-yellow-500" />辅助描述</label>
                    <button onClick={optimizePromptWithGemini} disabled={!productName || isOptimizing} className="text-[10px] text-purple-300 hover:text-purple-200 font-bold flex items-center bg-purple-950/30 border border-purple-500/30 px-2 py-1 rounded-md transition-colors disabled:opacity-50">
                      {isOptimizing ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Wand2 className="w-3 h-3 mr-1" />}
                      {isOptimizing ? "优化中" : "AI 润色"}
                    </button>
                  </div>
                  <textarea rows={2} value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="核心描述，例如：Nike Air Max 红色运动鞋..." className="w-full px-4 py-2.5 bg-slate-950/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm resize-none text-slate-200 placeholder-slate-600" />
              </div>

              {/* Material Analysis Section */}
              <div className="mt-4 relative z-10">
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center">
                    <Palette className="w-3 h-3 mr-1 text-indigo-400" />
                    主体材质 (Material)
                  </label>
                  <button 
                    onClick={handleAnalyzeMaterial} 
                    disabled={!productMaterial || isAnalyzingMaterial} 
                    className="text-[10px] text-indigo-300 hover:text-indigo-200 font-bold flex items-center bg-indigo-950/30 border border-indigo-500/30 px-2 py-1 rounded-md transition-colors disabled:opacity-50"
                  >
                    {isAnalyzingMaterial ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <BrainCircuit className="w-3 h-3 mr-1" />}
                    分析场景
                  </button>
                </div>
                <input 
                  type="text" 
                  value={productMaterial} 
                  onChange={(e) => setProductMaterial(e.target.value)} 
                  placeholder="例如：纯棉、真丝、实木、金属..." 
                  className="w-full px-4 py-2 bg-slate-950/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-slate-200 placeholder-slate-600" 
                />
              </div>

              {bedroomScenes.length > 0 && (
                <div className="mt-4 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">推荐卧室场景 (Recommended Scenes)</label>
                  <div className="grid grid-cols-1 gap-2">
                    {bedroomScenes.map((scene, idx) => (
                      <button 
                        key={idx}
                        onClick={() => handleSelectScene(scene)}
                        className="text-left p-3 bg-slate-800/40 hover:bg-indigo-900/20 border border-slate-700 hover:border-indigo-500/50 rounded-xl transition-all group"
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-bold text-indigo-300 group-hover:text-indigo-200">{scene.name_cn}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{scene.name}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-1">{scene.description_cn}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {lightingSuggestion && (
                  <div className="mt-4 p-3 bg-indigo-950/30 border border-indigo-500/20 rounded-lg">
                      <div className="flex items-start">
                          <Lightbulb className="w-4 h-4 mr-2 text-yellow-400 flex-shrink-0 mt-0.5" />
                          <div>
                              <h4 className="text-xs font-bold text-indigo-300">
                                  AI 光照建议
                              </h4>
                              <p className="text-sm text-indigo-200/80 leading-relaxed mt-1">{lightingSuggestion}</p>
                          </div>
                      </div>
                  </div>
              )}
            </div>

            {/* Bedroom Style Templates Card */}
            <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-white/5 p-6 shadow-xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent pointer-events-none"></div>
                <h3 className="text-lg font-bold flex items-center mb-4 relative z-10 text-indigo-200">
                    <Palette className="w-5 h-5 mr-2 text-indigo-500" />
                    卧室风格模版 (Style Templates)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {bedroomStyleTemplates.map((template, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleSelectScene(template)}
                            className="text-center p-2 bg-slate-800/40 hover:bg-indigo-900/30 border border-slate-700 hover:border-indigo-500/50 rounded-lg transition-all group"
                        >
                            <span className="text-[10px] font-bold text-slate-300 group-hover:text-white block truncate" title={template.name_cn}>
                                {template.name_cn}
                            </span>
                            <span className="text-[8px] text-slate-500 font-mono block truncate" title={template.name}>
                                {template.name}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Master Creative Mode Card */}
            <div id="creative-mode-section" className="relative group rounded-2xl p-[1px] bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-purple-500/20">
                <div className="bg-slate-900 rounded-2xl p-5 relative overflow-hidden">
                     <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-purple-500 opacity-20 rounded-full blur-3xl pointer-events-none"></div>
                     <h3 className="text-lg font-bold flex items-center mb-2 relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-white to-purple-200"><Palette className="w-5 h-5 mr-2 text-purple-400" />大师创意模式 <span className="text-[10px] ml-2 text-purple-400/60 font-mono border border-purple-500/30 px-1 rounded">PRO</span></h3>
                     <p className="text-slate-400 text-xs mb-3 relative z-10">输入想法，或<span className="font-bold text-purple-300 mx-1">留空</span>点击生成，AI 将智能构思贴合产品的场景。</p>
                     <div className="relative z-10 space-y-3">
                         <input type="text" value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)} placeholder="留空，AI 智能构思独特场景..." className="w-full px-4 py-2.5 bg-black/40 border border-purple-500/30 rounded-lg text-white placeholder-slate-600 focus:bg-black/60 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm backdrop-blur-sm transition-all" />
                         <button 
                            onClick={isCustomGenerating ? handleStop : handleCustomGenerate} 
                            disabled={!mainImage || (isImagenModel && !!mainImage)} 
                            className={`w-full py-2.5 rounded-lg font-bold text-sm transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed group border border-white/10 ${isCustomGenerating ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-[0_0_15px_rgba(192,38,211,0.3)] hover:shadow-[0_0_25px_rgba(192,38,211,0.5)]'}`}
                         >
                             {isCustomGenerating ? (
                                <><Square className="w-4 h-4 mr-2 fill-current" /> 停止生成</>
                             ) : (
                                customPrompt.trim() ? <><MessageSquarePlus className="w-4 h-4 mr-2" />生成创意</> : <><Shuffle className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform" />大师级构思</>
                             )}
                         </button>
                     </div>
                </div>
            </div>

            {/* Image to Prompt Card */}
            <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-teal-500/20 p-6 space-y-4 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-teal-500 to-transparent opacity-50"></div>
                <h3 className="text-lg font-bold flex items-center text-teal-300">
                    <BrainCircuit className="w-5 h-5 mr-2" />
                    智能垫图 (Image-to-Prompt)
                </h3>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">1. 上传风格参考图</label>
                    <div className={`relative border-2 border-dashed rounded-xl p-4 text-center transition-all duration-300 overflow-hidden ${reversePromptImage ? 'border-teal-500/50 bg-teal-950/20' : 'border-slate-700 hover:border-teal-500/50 hover:bg-slate-800/50'}`}>
                        <input type="file" ref={reverseFileInputRef} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={handleReverseImageUpload} accept="image/*" />
                        {reversePromptImage ? (
                            <div className="relative group">
                                <img src={reversePromptImage} alt="Reference for prompt" className="w-full h-32 object-contain rounded-lg shadow-sm mx-auto" />
                                <button onClick={removeReverseImage} className="absolute top-1 right-1 p-1 bg-slate-900/80 rounded-full text-red-400 border border-red-500/30 z-20 pointer-events-auto transition-transform hover:scale-110"><Trash2 className="w-3 h-3" /></button>
                            </div>
                        ) : (
                            <div className="space-y-2 py-4 pointer-events-none">
                                <div className="w-10 h-10 bg-teal-950/50 border border-teal-500/30 text-teal-400 rounded-full flex items-center justify-center mx-auto shadow-[0_0_10px_rgba(20,184,166,0.2)]"><ImageIcon className="w-5 h-5" /></div>
                                <div><p className="text-slate-400 font-medium text-sm">点击上传参考图</p></div>
                            </div>
                        )}
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">2. AI 反推提示词</label>
                    <button
                        onClick={handleAnalyzeForPrompt}
                        disabled={!reversePromptImage || isAnalyzingForPrompt}
                        className="w-full py-2 px-3 bg-teal-950/30 hover:bg-teal-900/50 text-teal-300 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center border border-teal-500/30 hover:border-teal-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isAnalyzingForPrompt ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : <Wand2 className="w-3 h-3 mr-2" />}
                        {isAnalyzingForPrompt ? "正在解码视觉信息..." : "分析图片 & 生成提示词"}
                    </button>
                    <textarea
                        rows={4}
                        value={generatedReversePrompt}
                        onChange={(e) => setGeneratedReversePrompt(e.target.value)}
                        placeholder="AI 将在此处生成可编辑的提示词..."
                        className="mt-2 w-full px-4 py-2.5 bg-black/30 border border-slate-700 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all text-sm resize-none text-slate-300 placeholder-slate-600 font-mono"
                        disabled={isAnalyzingForPrompt}
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">3. 生成新图片</label>
                    <button
                        onClick={handleGenerateFromPrompt}
                        disabled={!generatedReversePrompt || isGeneratingFromPrompt}
                        className="w-full py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-lg font-bold text-sm shadow-[0_0_15px_rgba(13,148,136,0.3)] hover:shadow-[0_0_25px_rgba(13,148,136,0.5)] transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed border border-white/10"
                    >
                        {isGeneratingFromPrompt ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                        {isGeneratingFromPrompt ? "生成中..." : "开始文生图"}
                    </button>
                </div>
            </div>

            <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-white/5 p-6 shadow-lg">
                <h3 className="text-sm font-bold text-slate-300 mb-3 flex items-center"><Layers className="w-4 h-4 mr-2 text-indigo-400" />批量智能视图 (10经典 + 2智能)</h3>
                
                <button 
                  onClick={isGenerating ? handleStop : openEditModal} 
                  disabled={!mainImage || (isImagenModel && !!mainImage)} 
                  className={`w-full py-3 px-4 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-[0.98] mb-4 ${
                    !mainImage || (isImagenModel && !!mainImage) 
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed shadow-none border border-slate-700' 
                      : isGenerating 
                        ? 'bg-red-600 hover:bg-red-700' 
                        : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:shadow-[0_0_20px_rgba(79,70,229,0.4)] border border-indigo-400/30'
                  } flex items-center justify-center text-sm`}
                >
                  {isGenerating ? <><Square className="w-4 h-4 mr-2 fill-current" /> 停止生成 (Stop)</> : <><Sparkles className="w-4 h-4 mr-2" />一键批量生成 (Batch Gen)</>}
                </button>

                <div className="pt-3 border-t border-white/5">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">单视角生成 (Single Shot)</label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <select
                                value={selectedSingleAngleId}
                                onChange={(e) => setSelectedSingleAngleId(Number(e.target.value))}
                                disabled={!mainImage || (isImagenModel && !!mainImage) || isGenerating}
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 appearance-none disabled:opacity-50"
                            >
                                {staticAngles.map(angle => (
                                    <option key={angle.id} value={angle.id}>{angle.name}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-slate-500 pointer-events-none" />
                        </div>
                        <button
                            onClick={handleSingleGenerate}
                            disabled={!mainImage || (isImagenModel && !!mainImage) || isGenerating}
                            className="bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/50 hover:border-indigo-500 text-indigo-300 hover:text-white px-4 py-2 rounded-lg font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                            <Play className="w-4 h-4 mr-1" /> 生成
                        </button>
                    </div>
                </div>
            </div>

            {/* Model Service Settings */}
            <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-white/5 overflow-hidden shadow-lg">
                <button 
                  onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                  className="w-full p-6 text-left flex justify-between items-center group transition-colors hover:bg-slate-800/50"
                >
                    <div className="flex items-center">
                        <div className="bg-indigo-950/50 border border-indigo-500/30 p-2 rounded-lg mr-3 group-hover:border-indigo-400/50 transition-colors">
                            <Settings className="w-5 h-5 text-indigo-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-200">模型服务设置</h3>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform duration-300 ${isSettingsOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isSettingsOpen && (
                  <div className="p-6 pt-2 space-y-5 animate-in slide-in-from-top-2 duration-300 border-t border-slate-800/50">
                      <div className="grid grid-cols-1 gap-4">
                          <div>
                              <label className="flex items-center text-xs font-bold text-slate-500 uppercase mb-2">
                                  <Cpu className="w-3 h-3 mr-1" /> 文本推理引擎 (Reasoning)
                              </label>
                              <select 
                                value={textModel} 
                                onChange={(e) => setTextModel(e.target.value)} 
                                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-200"
                              >
                                  <optgroup label="Google Gemini" className="bg-slate-900 text-slate-300">
                                      <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (高精度/逻辑最强)</option>
                                      <option value="gemini-3-flash-preview">Gemini 3 Flash (极速/响应快)</option>
                                      <option value="gemini-flash-lite-latest">Gemini Flash Lite (轻量/低延迟)</option>
                                  </optgroup>
                              </select>
                          </div>

                          <div>
                              <label className="flex items-center text-xs font-bold text-slate-500 uppercase mb-2">
                                  <ImageIcon className="w-3 h-3 mr-1" /> 视觉渲染模型 (Image Gen)
                              </label>
                              <select 
                                value={imageModel} 
                                onChange={(e) => setImageModel(e.target.value)} 
                                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-200"
                              >
                                  <optgroup label="Imagen Premium" className="bg-slate-900 text-slate-300">
                                      <option value="imagen-4.0-generate-001">Imagen 4.0 (电影级光影/构图)</option>
                                  </optgroup>
                                  <optgroup label="Google Gemini Vision" className="bg-slate-900 text-slate-300">
                                      <option value="gemini-3.1-flash-image-preview">Gemini 3.1 Flash Image (商业摄影级/最新)</option>
                                      <option value="gemini-3-pro-image-preview">Gemini 3 Pro Image (高精度渲染)</option>
                                      <option value="gemini-2.5-flash-image">Gemini 2.5 Flash Image (快速出图)</option>
                                  </optgroup>
                              </select>
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="flex items-center text-xs font-bold text-slate-500 uppercase mb-2">
                                  <Maximize2 className="w-3 h-3 mr-1" /> 输出画质
                              </label>
                              {imageModel === 'gemini-3-pro-image-preview' || imageModel === 'gemini-3.1-flash-image-preview' ? (
                                <select value={imageResolution} onChange={(e) => setImageResolution(e.target.value)} className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-200">
                                    {imageModel === 'gemini-3.1-flash-image-preview' && <option value="512px">512px (快速预览)</option>}
                                    <option value="1K">1K (标准)</option>
                                    <option value="2K">2K (高清)</option>
                                    <option value="4K">4K (超清大师)</option>
                                </select>
                              ) : (
                                <div className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-500 cursor-not-allowed">
                                    标准分辨率 (Fixed)
                                </div>
                              )}
                          </div>
                          <div>
                              <label className="flex items-center text-xs font-bold text-slate-500 uppercase mb-2">
                                  <Monitor className="w-3 h-3 mr-1" /> 画面比例
                              </label>
                              <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)} className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-200">
                                  <option value="1:1">1:1 (方构图)</option>
                                  <option value="4:3">4:3 (经典单反)</option>
                                  <option value="3:4">3:4 (竖拍肖像)</option>
                                  <option value="16:9">16:9 (电影宽屏)</option>
                                  <option value="9:16">9:16 (移动端全屏)</option>
                                  {imageModel === 'gemini-3.1-flash-image-preview' && (
                                    <>
                                      <option value="1:4">1:4 (极窄竖屏)</option>
                                      <option value="4:1">4:1 (极宽横屏)</option>
                                    </>
                                  )}
                              </select>
                          </div>
                      </div>
                  </div>
                )}
            </div>
          </div>

          <div className="lg:col-span-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center tracking-wide"><Layers className="w-6 h-6 mr-2 text-indigo-500" />生成结果 <span className="text-xs text-slate-500 ml-2 font-mono">REAL_OUTPUT</span></h2>
              <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setAddWatermark(!addWatermark)}
                    className={`flex items-center px-3 py-1 text-xs font-bold rounded-md transition-all border ${addWatermark ? 'bg-indigo-900/50 border-indigo-500/50 text-indigo-300 shadow-sm' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-slate-300'}`}
                    title="添加时间戳水印以保护版权"
                  >
                    <Copyright className="w-3 h-3 mr-1" />
                    {addWatermark ? '版权水印: ON' : '版权水印: OFF'}
                  </button>
                  <div className="h-4 w-[1px] bg-slate-700 mx-1"></div>
                  <div className="flex items-center bg-slate-800/50 rounded-lg p-1 border border-slate-700">
                      <button 
                          onClick={() => setDownloadFormat('png')}
                          className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${downloadFormat === 'png' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                      >
                          PNG
                      </button>
                      <button 
                          onClick={() => setDownloadFormat('jpg')}
                          className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${downloadFormat === 'jpg' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                      >
                          JPG
                      </button>
                  </div>
                  {generatedResults.some(r => r.status === 'completed') && (
                    <button onClick={handleDownloadAll} disabled={isDownloading} className={`flex items-center px-4 py-2 border rounded-lg text-sm font-medium transition-colors shadow-sm ${isDownloading ? 'bg-indigo-900/50 border-indigo-500/30 text-indigo-300 cursor-wait' : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'}`}>
                      {isDownloading ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />正在保存 ({downloadProgress}/{generatedResults.filter(r => r.status === 'completed').length})...</>
                      ) : (
                        <><Download className="w-4 h-4 mr-2" />全部保存</>
                      )}
                    </button>
                  )}
              </div>
            </div>
            
            {isImagenModel && mainImage && (
                <div className="bg-amber-950/30 border border-amber-500/30 text-amber-200 rounded-lg p-3 text-sm mb-6 flex items-center gap-3 animate-in fade-in slide-in-from-left-4">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-500" />
                    <span><b>Imagen 4.0 模式限制：</b>当前版本专注于纯文本到图片的顶级渲染，暂不支持基于原图的“局部重绘”或“批量视角”。请移除左侧商品原图以使用文生图功能，或切换至 Gemini 模型。</span>
                </div>
            )}

            {generatedResults.length === 0 && (
              <div className="bg-slate-900/20 border-2 border-dashed border-slate-800 rounded-2xl h-[500px] flex flex-col items-center justify-center text-center p-8 backdrop-blur-sm">
                <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-4 animate-pulse shadow-[0_0_20px_rgba(255,255,255,0.05)]"><ImagePlus className="w-10 h-10 text-slate-600" /></div>
                <h3 className="text-lg font-medium text-slate-300">等待生成任务</h3>
                <p className="text-slate-500 mt-2 max-w-sm text-sm">您可以选择批量生成 12 种视图（包含 AI 智能分析出的独特视角），或者使用自定义模块生成创意场景。</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {generatedResults.map((result) => (
                <div key={result.id} className={`bg-slate-900/60 backdrop-blur-md rounded-xl border shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group flex flex-col hover:-translate-y-1 ${result.type === 'Image-to-Prompt' ? 'border-teal-500/30 hover:border-teal-400/60 hover:shadow-teal-500/10' : (result.isDynamic || result.type.includes('Custom') ? 'border-indigo-500/30 hover:border-indigo-400/60 hover:shadow-indigo-500/10' : 'border-white/5 hover:border-white/20')} ${result.status === 'error' ? 'border-red-500/30 bg-red-950/10' : ''}`}>
                  <div className="relative h-48 bg-slate-950/50 overflow-hidden flex items-center justify-center">
                    <GenerationLoader status={result.status} />

                    {result.status === 'error' && (
                      <div className="flex flex-col items-center justify-center text-red-400 space-y-2 px-4 text-center">
                        {result.errorMessage?.includes('Auth') ? <Lock className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
                        <span className="text-xs font-medium">{result.errorMessage || '生成失败'}</span>
                      </div>
                    )}
                    {result.status === 'completed' && result.imageUrl && (
                      <img src={result.imageUrl} alt={result.name} className="w-full h-full object-cover transition-transform duration-700 hover:scale-105 cursor-pointer" onClick={() => setPreviewImage(result.imageUrl)} />
                    )}
                    <div className="absolute top-2 left-2 z-10"><span className={`backdrop-blur-md text-white text-[10px] px-2 py-0.5 rounded font-medium shadow-sm border border-white/10 ${result.type === 'Image-to-Prompt' ? 'bg-teal-600/60' : (result.isDynamic || result.type.includes('Custom') ? 'bg-indigo-600/60' : 'bg-black/60')}`}>{result.type}</span></div>
                    
                    {result.status === 'completed' && (
                      <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2 backdrop-blur-[2px] pointer-events-none">
                        <button onClick={() => openRegenerateModal(result)} disabled={isImagenModel} className="p-2 bg-purple-600 text-white rounded-full hover:bg-purple-500 shadow-lg shadow-purple-500/40 transform hover:scale-110 transition-all pointer-events-auto disabled:opacity-50 disabled:cursor-not-allowed border border-white/20" title={isImagenModel ? "Imagen模型不支持此功能" : "调整并重绘"}><RefreshCw className="w-4 h-4" /></button>
                        <button onClick={() => openRemixModal(result)} disabled={isImagenModel} className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-500 shadow-lg shadow-indigo-500/40 transform hover:scale-110 transition-all pointer-events-auto disabled:opacity-50 disabled:cursor-not-allowed border border-white/20" title={isImagenModel ? "Imagen模型不支持此功能" : "二次创作/改图"}><Edit className="w-4 h-4" /></button>
                        <button onClick={() => setPreviewImage(result.imageUrl)} className="p-2 bg-slate-700 rounded-full text-white hover:bg-slate-600 shadow-lg transform hover:scale-110 transition-transform pointer-events-auto border border-white/10" title="放大"><Maximize2 className="w-5 h-5" /></button>
                        <button onClick={() => handleDownloadSingle(result)} className="p-2 bg-slate-700 rounded-full text-white hover:bg-slate-600 shadow-lg transform hover:scale-110 transition-transform pointer-events-auto border border-white/10"><Download className="w-5 h-5" /></button>
                      </div>
                    )}
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-1">
                          <h4 className="font-semibold text-slate-200 text-sm truncate pr-2" title={result.name}>{result.name}</h4>
                          {result.status === 'completed' && <span className="text-[10px] text-green-300 bg-green-900/30 px-1.5 py-0.5 rounded border border-green-500/30 font-medium flex items-center flex-shrink-0"><Check className="w-3 h-3 mr-1" /> OK</span>}
                      </div>
                      {result.description_cn && <p className="text-xs text-slate-400 mb-2 leading-relaxed">{result.description_cn}</p>}
                    </div>
                    <div className="mt-auto relative group/prompt pt-2 border-t border-white/5">
                      <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed cursor-help hover:text-slate-300 transition-colors" title={result.finalPrompt}>
                          <span className="font-semibold text-slate-400">Prompt:</span> {result.finalPrompt}
                      </p>
                      <button onClick={() => copyPrompt(result.finalPrompt, result.id)} className="absolute right-0 top-1.5 p-1 bg-slate-800 border border-slate-700 rounded text-slate-400 hover:text-indigo-400 opacity-0 group-hover/prompt:opacity-100 transition-opacity">{copiedId === result.id ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AIProductStudio;
