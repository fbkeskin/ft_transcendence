// frontend/src/utils/imageUrl.ts

export const getAvatarUrl = (avatarPath: string | null | undefined) => {
    // Veri yoksa default döndür
    if (!avatarPath) return '/default.png';
  
    // Eğer resim 42'den geliyorsa (http veya https ile başlıyorsa) olduğu gibi döndür
    if (avatarPath.startsWith('http')) {
      return avatarPath;
    }
  
    // DÜZELTME: Nginx uyumlu olması için localhost:3000 kaldırıldı
    return `/uploads/${avatarPath}`;
};