const mcache = require('memory-cache');

const cacheMiddleware = (duration) => {
    return (req, res, next) => {
        // Generar clave única basada en la URL completa (incluyendo query params)
        // y el token de usuario si es necesario (para datos privados)
        // Para dashboard/periodos, es user-specific, así que incluimos req.user.id en la key
        const userId = req.user ? req.user.id : 'public';
        const key = '__express__' + req.originalUrl || req.url + '__' + userId;

        const cachedBody = mcache.get(key);

        if (cachedBody) {
            // Si hay caché, devolverla
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
            res.setHeader('Vary', 'Authorization');
            res.send(cachedBody);
            return;
        }

        // Si no hay caché, interceptar el método send para guardar la respuesta antes de enviarla
        const sendResponse = res.send.bind(res);
        res.send = (body) => {
            // Solo cachear si la respuesta es exitosa
            try {
                if (res.statusCode === 200) {
                    mcache.put(key, body, duration * 1000);
                }
            } catch (err) {
                console.error('Cache error:', err);
            }

            // Evitar caché del navegador para asegurar que siempre se consulte al servidor
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
            res.setHeader('Vary', 'Authorization');

            return sendResponse(body);
        }

        next();
    }
}

const clearCache = (userId) => {
    const keys = mcache.keys();
    // Identificador del usuario al final de la key
    const userSuffix = '__' + userId;

    keys.forEach(key => {
        if (key.endsWith(userSuffix)) {
            mcache.del(key);
        }
    });
}

const clearAllCache = () => {
    mcache.clear();
    console.log('🧹 CACHÉ GLOBAL LIMPIADA');
}

const clearCacheByKeyword = (keyword) => {
    const keys = mcache.keys();
    keys.forEach(key => {
        if (key.includes(keyword)) {
            mcache.del(key);
        }
    });
}

module.exports = {
    cacheMiddleware,
    clearCache,
    clearAllCache,
    clearCacheByKeyword
};
