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
            res.send(cachedBody);
            return;
        } else {
            // Si no, interceptar el método send para guardar la respuesta antes de enviarla
            res.sendResponse = res.send;
            res.send = (body) => {
                mcache.put(key, body, duration * 1000);
                res.sendResponse(body);
            }
            next();
        }
    }
}

module.exports = cacheMiddleware;
