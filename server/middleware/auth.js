const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'prontolook_secret_temporario';

function autenticar(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ sucesso: false, mensagem: "Token não fornecido." });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.usuario = decoded;
        next();
    } catch {
        return res.status(403).json({ sucesso: false, mensagem: "Token inválido ou expirado." });
    }
}

function apenasAdmin(req, res, next) {
    if (!req.usuario || req.usuario.role !== 'admin') {
        return res.status(403).json({ sucesso: false, mensagem: "Acesso restrito a administradores." });
    }
    next();
}

module.exports = { autenticar, apenasAdmin, JWT_SECRET };
