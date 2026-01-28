// frontend/src/services/auth.service.ts
// DİKKAT: Bu dosya FRONTEND klasöründe olmalı!

const API_URL = 'http://localhost:3000'; // Backend kök adresi

// 1. PROFİL BİLGİSİNİ ÇEKME
export const getProfileReq = async () => {
    const token = localStorage.getItem('token'); 
    if (!token) throw new Error('Token bulunamadı!');
  
    // ESKİSİ: /me
    // YENİSİ: /auth/me
    const response = await fetch(`${API_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
    });
  
    const data = await response.json();
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      throw new Error(data.message || 'Profil alınamadı');
    }
    return data.user; 
};

// 2. GİRİŞ YAPMA (LOGIN)
export const loginReq = async (email: string, password: string) => {
  try {
    // ESKİSİ: /login
    // YENİSİ: /auth/login
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Giriş başarısız');
    }

    // Token geldiyse (2FA kapalıysa) kaydet
    if (data.token) {
      localStorage.setItem('token', data.token);
      
      try {
          const user = await getProfileReq(); 
          localStorage.setItem('user', JSON.stringify(user)); 
      } catch (profileError) {
          console.warn("Profil bilgisi çekilemedi, login verisiyle devam ediliyor.");
          if (data.user) {
            localStorage.setItem('user', JSON.stringify(data.user));
          }
      }
    }

    return data;
  } catch (error) {
    console.error('Login Hatası:', error);
    throw error;
  }
};

// 3. KAYIT OLMA (REGISTER)
export const registerReq = async (email: string, username: string, password: string) => {
    // ESKİSİ: /register
    // YENİSİ: /auth/register
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, username, password }),
    });
  
    const data = await response.json();
  
    if (!response.ok) {
      throw new Error(data.message || 'Kayıt işlemi başarısız');
    }
  
    return data;
};

// 4. AVATAR YÜKLEME
export const uploadAvatarReq = async (file: File) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Oturum yok');
  
    const formData = new FormData();
    formData.append('avatar', file); 
  
    // ESKİSİ: /avatar
    // YENİSİ: /auth/avatar
    const response = await fetch(`${API_URL}/auth/avatar`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}` 
      },
      body: formData
    });
  
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Yükleme başarısız');
    
    return data; 
};

// 5. 2FA FONKSİYONLARI
export const generate2FAReq = async () => {
    const token = localStorage.getItem('token');
    // ESKİSİ: /2fa/generate
    // YENİSİ: /auth/2fa/generate
    const response = await fetch(`${API_URL}/auth/2fa/generate`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
  
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'QR Kod alınamadı');
    }
  
    return response.json(); 
  };

export const turnOn2FAReq = async (code: string) => {
  const token = localStorage.getItem('token');
  // ESKİSİ: /2fa/turn-on
  // YENİSİ: /auth/2fa/turn-on
  const response = await fetch(`${API_URL}/auth/2fa/turn-on`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    },
    body: JSON.stringify({ code })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message);
  return data;
};

// Opsiyonel: 2FA Kapatma
export const turnOff2FAReq = async () => {
  const token = localStorage.getItem('token');
  // YENİSİ: /auth/2fa/turn-off
  await fetch(`${API_URL}/auth/2fa/turn-off`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
};

// Login olduktan sonraki 2FA doğrulama isteği
export const verify2FALoginReq = async (userId: number, code: string) => {
  // Backend'de: app.ts (/auth) + route (/2fa/verify) = /auth/2fa/verify
  const response = await fetch(`${API_URL}/auth/2fa/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, code })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Doğrulama başarısız');
  }

  return response.json();
};