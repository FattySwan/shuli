/**
 * 图片上传服务
 * 将图片转换为 Base64 存储，完全不需要依赖外部图床
 */

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * 将本地文件转换为 Base64
 * 这是最简单可靠的方式，不需要外部图床
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('读取文件失败'));
    reader.readAsDataURL(file);
  });
}

/**
 * 处理图片上传
 * 直接将图片转为 Base64，存储在数据库中
 */
export async function uploadImage(file: File): Promise<UploadResult> {
  try {
    // 检查文件类型
    if (!isImageFile(file)) {
      return {
        success: false,
        error: '请选择图片文件（JPG、PNG、GIF 等）',
      };
    }

    // 检查文件大小（限制为 2MB，避免 Base64 太大）
    if (!checkFileSize(file, 2)) {
      return {
        success: false,
        error: '图片大小不能超过 2MB',
      };
    }

    // 转换为 Base64
    const base64 = await fileToBase64(file);
    
    return {
      success: true,
      url: base64,
    };
  } catch (error) {
    return {
      success: false,
      error: '图片处理失败',
    };
  }
}

/**
 * 检查文件是否为图片
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

/**
 * 检查文件大小
 */
export function checkFileSize(file: File, maxSizeMB: number = 2): boolean {
  return file.size <= maxSizeMB * 1024 * 1024;
}

/**
 * 压缩图片（如果图片太大）
 */
export async function compressImage(
  file: File,
  maxWidth: number = 800,
  quality: number = 0.7
): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('浏览器不支持 Canvas'));
      return;
    }

    img.onload = () => {
      let { width, height } = img;

      // 计算缩放比例
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            reject(new Error('压缩失败'));
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => reject(new Error('加载图片失败'));

    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}
