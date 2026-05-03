const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'prontolook_secret_temporario';

function autenticar(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ sucesso: false, mensagem: "Token não fornecido ou formato inválido." });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.usuario = decoded;
        next();
    } catch (err) {
        console.error("Erro na verificação do JWT:", err.message);
        return res.status(403).json({ sucesso: false, mensagem: "Sua sessão expirou ou o token é inválido. Por favor, faça login novamente." });
    }
}

function apenasAdmin(req, res, next) {
    if (!req.usuario || (req.usuario.role || '').toLowerCase() !== 'admin') {
        console.warn(`Acesso negado para o usuário ${req.usuario ? req.usuario.nome : 'desconhecido'}. Role: ${req.usuario ? req.usuario.role : 'N/A'}`);
        return res.status(403).json({ sucesso: false, mensagem: "Acesso negado: sua conta não tem permissão de administrador." });
    }
    next();
}

module.exports = { autenticar, apenasAdmin, JWT_SECRET };
