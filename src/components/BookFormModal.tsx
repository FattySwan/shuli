import { useState, useEffect, useRef } from 'react';
import { useBookStore } from '../store/useBookStore';
import { regions } from '../data/regions';
import { X, BookOpen, ImageIcon, AlertCircle, Upload, Loader2 } from 'lucide-react';
import type { Book } from '../types';
import { processDoubanImage, needsProxy, isDoubanImage as checkIsDoubanImage } from '../lib/imageProxy';
import { uploadImage, isImageFile, checkFileSize, fileToBase64, compressImage } from '../lib/imageUpload';

export function BookFormModal() {
  const { isAddModalOpen, closeAddModal, editingBook, prefillData, addBook, updateBook } = useBookStore();
  
  const [formData, setFormData] = useState<{
    title: string;
    author: string;
    year: number;
    region: string;
    description: string;
    coverImage: string;
  }>({
    title: '',
    author: '',
    year: new Date().getFullYear(),
    region: '',
    description: '',
    coverImage: '',
  });

  const [imageError, setImageError] = useState(false);
  const [isDoubanImage, setIsDoubanImage] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAddModalOpen) {
      if (editingBook) {
        setFormData({
          title: editingBook.title,
          author: editingBook.author,
          year: editingBook.year,
          region: editingBook.region,
          description: editingBook.description || '',
          coverImage: editingBook.coverImage || '',
        });
      } else {
        setFormData({
          title: '',
          author: '',
          year: prefillData?.publishYear ?? new Date().getFullYear(),
          region: prefillData?.regions?.[0] ?? '',
          description: '',
          coverImage: '',
        });
      }
      setImageError(false);
      setIsDoubanImage(false);
    }
  }, [editingBook, prefillData, isAddModalOpen]);

  // 检测是否是豆瓣图片
  useEffect(() => {
    if (formData.coverImage) {
      setIsDoubanImage(checkIsDoubanImage(formData.coverImage));
      setImageError(false);
    }
  }, [formData.coverImage]);

  // 处理文件上传
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 重置状态
    setUploadError(null);
    setIsUploading(true);

    // 验证文件类型
    if (!isImageFile(file)) {
      setUploadError('请选择图片文件');
      setIsUploading(false);
      return;
    }

    try {
      // 如果文件大于 2MB，先压缩
      let processedFile = file;
      if (file.size > 2 * 1024 * 1024) {
        processedFile = await compressImage(file, 800, 0.7);
      }

      // 显示本地预览
      const base64 = await fileToBase64(processedFile);
      setPreviewUrl(base64);

      // 转换为 Base64
      const result = await uploadImage(processedFile);

      if (result.success && result.url) {
        setFormData(prev => ({ ...prev, coverImage: result.url! }));
        setIsDoubanImage(false);
      } else {
        setUploadError(result.error || '上传失败');
      }
    } catch (error) {
      setUploadError('上传过程中出现错误');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  if (!isAddModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.author || !formData.year || !formData.region) {
      return;
    }

    // 处理豆瓣图片，使用代理
    const processedData = {
      ...formData,
      coverImage: processDoubanImage(formData.coverImage),
    };

    let success;
    if (editingBook) {
      success = await updateBook(editingBook.id, processedData);
    } else {
      success = await addBook(processedData);
    }
    
    if (success) {
      closeAddModal();
    }
  };

  const handleClose = () => {
    closeAddModal();
  };

  // 获取预览图片地址
  const getPreviewUrl = () => {
    if (!formData.coverImage) return '';
    return processDoubanImage(formData.coverImage);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto border border-[#e5e5e7]">
        <div className="sticky top-0 bg-[#fafafa] border-b border-[#e5e5e7] px-5 py-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#1d1d1f]">
            {editingBook ? '编辑书籍' : '添加书籍'}
          </h2>
          <button
            onClick={handleClose}
            className="w-7 h-7 flex items-center justify-center bg-white border border-[#e5e5e7] rounded-lg text-[#6e6e73] hover:bg-[#f5f5f7] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#6e6e73] mb-1.5 uppercase tracking-wide">
              书名 <span className="text-[#ff3b30]">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-[#e5e5e7] focus:border-[#007aff] focus:ring-2 focus:ring-[#007aff]/10 transition-all outline-none text-sm"
              placeholder="输入书名"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#6e6e73] mb-1.5 uppercase tracking-wide">
              作者 <span className="text-[#ff3b30]">*</span>
            </label>
            <input
              type="text"
              value={formData.author}
              onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-[#e5e5e7] focus:border-[#007aff] focus:ring-2 focus:ring-[#007aff]/10 transition-all outline-none text-sm"
              placeholder="输入作者"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#6e6e73] mb-1.5 uppercase tracking-wide">
              历史年份 <span className="text-[#ff3b30]">*</span>
            </label>
            <input
              type="number"
              value={formData.year}
              onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 rounded-lg border border-[#e5e5e7] focus:border-[#007aff] focus:ring-2 focus:ring-[#007aff]/10 transition-all outline-none text-sm"
              placeholder="例如: 1776"
              required
            />
            <p className="text-[10px] text-[#6e6e73] mt-1">公元前年份请使用负数，如 -100 表示公元前100年</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#6e6e73] mb-2 uppercase tracking-wide">
              涉及地区 <span className="text-[#ff3b30]">*</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {regions.map((region) => (
                <button
                  key={region.id}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, region: region.id }))}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all border ${
                    formData.region === region.id
                      ? 'text-white border-transparent'
                      : 'bg-white text-[#6e6e73] border-[#e5e5e7] hover:border-[#d2d2d7]'
                  }`}
                  style={{
                    backgroundColor: formData.region === region.id ? region.color : undefined
                  }}
                >
                  {region.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#6e6e73] mb-1.5 uppercase tracking-wide">
              书籍简介
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-[#e5e5e7] focus:border-[#007aff] focus:ring-2 focus:ring-[#007aff]/10 transition-all outline-none resize-none text-sm"
              rows={3}
              placeholder="输入书籍简介..."
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#6e6e73] mb-1.5 uppercase tracking-wide">
              封面图片
            </label>
            
            {/* 上传按钮 */}
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={handleUploadClick}
                disabled={isUploading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f5f5f7] text-[#007aff] text-xs font-medium rounded-lg border border-[#e5e5e7] hover:bg-[#e8e8ed] transition-colors disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    处理中...
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    选择图片
                  </>
                )}
              </button>
              <span className="text-[10px] text-[#6e6e73] self-center">支持 JPG/PNG，最大 2MB</span>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <input
              type="url"
              value={formData.coverImage}
              onChange={(e) => setFormData(prev => ({ ...prev, coverImage: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-[#e5e5e7] focus:border-[#007aff] focus:ring-2 focus:ring-[#007aff]/10 transition-all outline-none text-sm"
              placeholder="https://example.com/image.jpg"
            />
            
            {/* 豆瓣图片提示 */}
            {isDoubanImage && (
              <div className="mt-2 flex items-center gap-2 text-[10px] text-amber-600 bg-amber-50 px-2 py-1.5 rounded">
                <AlertCircle className="w-3 h-3" />
                <span>豆瓣图片可能无法加载，建议上传本地图片</span>
              </div>
            )}
            
            {/* 上传错误提示 */}
            {uploadError && (
              <div className="mt-2 text-[10px] text-red-600 bg-red-50 px-2 py-1.5 rounded">
                {uploadError}
              </div>
            )}

            {/* 图片预览 */}
            {(formData.coverImage || previewUrl) && (
              <div className="mt-3">
                <p className="text-[10px] text-[#6e6e73] mb-1.5">封面预览</p>
                <div className="w-24 h-32 rounded-lg border border-[#e5e5e7] overflow-hidden bg-[#f5f5f7]">
                  {!imageError ? (
                    <img
                      src={previewUrl || getPreviewUrl()}
                      alt="封面预览"
                      className="w-full h-full object-cover"
                      onError={() => setImageError(true)}
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-[#c7c7cc]">
                      <ImageIcon className="w-6 h-6 mb-1" />
                      <span className="text-[9px]">加载失败</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 bg-white text-[#1d1d1f] text-sm font-medium rounded-lg border border-[#e5e5e7] hover:bg-[#f5f5f7] transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-[#007aff] text-white text-sm font-medium rounded-lg hover:bg-[#0051d5] transition-colors"
            >
              {editingBook ? '保存修改' : '添加书籍'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
