/**
 * 图片代理工具
 * 用于处理豆瓣等网站的防盗链图片
 */

/**
 * 检查是否需要使用代理
 */
export function needsProxy(url: string): boolean {
  if (!url) return false;
  
  // 豆瓣图片需要使用代理
  if (url.includes('doubanio.com') || url.includes('douban.com')) {
    return true;
  }
  
  return false;
}

/**
 * 获取代理后的图片地址
 * 
 * 使用多个代理服务尝试获取图片
 */
export function getProxiedImageUrl(url: string): string {
  if (!url) return '';
  
  // 如果不是豆瓣图片，直接返回
  if (!isDoubanImage(url)) {
    return url;
  }
  
  // 尝试使用图片代理服务
  // 方法1: 使用 images.weserv.nl (支持HTTPS，有缓存)
  // 将豆瓣HTTP图片转为HTTPS并通过代理加载
  if (url.startsWith('http://')) {
    url = url.replace('http://', 'https://');
  }
  
  // 使用 images.weserv.nl 代理
  // 这个服务可以处理大多数图片，包括豆瓣
  return `https://images.weserv.nl/?url=${encodeURIComponent(url)}&default=${encodeURIComponent(url)}`;
}

/**
 * 处理豆瓣图片链接
 * 
 * 尝试使用代理服务加载豆瓣图片
 */
export function processDoubanImage(url: string): string {
  if (!url) return '';
  
  // 如果是豆瓣图片，使用代理
  if (isDoubanImage(url)) {
    return getProxiedImageUrl(url);
  }
  
  return url;
}

/**
 * 检查是否是豆瓣图片
 */
export function isDoubanImage(url: string): boolean {
  if (!url) return false;
  return url.includes('doubanio.com') || url.includes('douban.com');
}
