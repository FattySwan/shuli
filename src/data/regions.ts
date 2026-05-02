import type { Region } from '../types';

export const regions: Region[] = [
  { id: '1', name: '中国', code: 'CN', color: '#FF6B6B' },
  { id: '2', name: '日本', code: 'JP', color: '#4ECDC4' },
  { id: '3', name: '欧洲', code: 'EU', color: '#9B59B6' },
  { id: '4', name: '英国', code: 'UK', color: '#74B9FF', parentId: '3' },
  { id: '5', name: '法国', code: 'FR', color: '#FD79A8', parentId: '3' },
  { id: '6', name: '德国', code: 'DE', color: '#FDCB6E', parentId: '3' },
  { id: '7', name: '意大利', code: 'IT', color: '#00B894', parentId: '3' },
  { id: '8', name: '美国', code: 'US', color: '#E17055' },
  { id: '9', name: '中东', code: 'ME', color: '#DDA0DD' },
  { id: '10', name: '非洲', code: 'AF', color: '#8B4513' },
  { id: '11', name: '南亚', code: 'SA', color: '#FF7675' },
  { id: '12', name: '东南亚', code: 'SEA', color: '#00CEC9' },
  { id: '13', name: '俄罗斯', code: 'RU', color: '#0984E3' },
  { id: '14', name: '拉丁美洲', code: 'LAT', color: '#F39C12' },
];

export const getRegionById = (id: string): Region | undefined => {
  return regions.find(r => r.id === id);
};

export const getRegionColor = (id: string): string => {
  const region = getRegionById(id);
  return region?.color || '#999999';
};
