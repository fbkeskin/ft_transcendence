// frontend/src/utils/fetchWrapper.ts

export const fetchWrapper = {
    get: request('GET'),
    post: request('POST'),
    put: request('PUT'),
    delete: request('DELETE')
};

function request(method: string) {
    return async (url: string, body?: any) => {
        const requestOptions: any = {
            method,
            headers: authHeader(url)
        };
        if (body) {
            requestOptions.headers['Content-Type'] = 'application/json';
            requestOptions.body = JSON.stringify(body);
        }
        
        try {
            const response = await fetch(url, requestOptions);
            return handleResponse(response);
        } catch (error) {
            return Promise.reject(error);
        }
    }
}

function authHeader(url: string): any {
    // Kullanıcı giriş yapmış mı kontrol et
    const token = localStorage.getItem('token');
    const isLoggedIn = !!token;
    
    if (isLoggedIn) {
        return { Authorization: `Bearer ${token}` };
    } else {
        return {};
    }
}

async function handleResponse(response: Response) {
    const text = await response.text();
    const data = text && JSON.parse(text);
    
    if (!response.ok) {
        // Eğer 401 (Yetkisiz) veya 403 (Yasak) hatası alırsak çıkış yap
        if ([401, 403].includes(response.status)) {
           
        }

        const error = (data && data.message) || response.statusText;
        return Promise.reject(error);
    }

    return data;
}