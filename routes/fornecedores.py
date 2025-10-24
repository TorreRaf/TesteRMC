from flask import Blueprint, request, jsonify
from models import db, Fornecedor
import re

fornecedores_bp = Blueprint("fornecedores", __name__)

def validar_cnpj(cnpj):
    """Validação básica de CNPJ"""
    cnpj = re.sub(r'[^0-9]', '', cnpj)
    return len(cnpj) == 14

def validar_email(email):
    """Validação básica de email"""
    if not email:
        return True
    return re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email)

@fornecedores_bp.route("/fornecedores", methods=["GET"])
def listar_fornecedores():
    try:
        fornecedores = Fornecedor.query.order_by(Fornecedor.nome).all()
        return jsonify([{
            "id": f.id,
            "nome": f.nome,
            "cnpj": f.cnpj,
            "contato": f.contato,
            "email": f.email,
            "endereco": f.endereco,
            "responsavel": f.responsavel
        } for f in fornecedores])
    except Exception as e:
        return jsonify({"error": "Erro ao buscar fornecedores"}), 500

@fornecedores_bp.route("/fornecedor/novo", methods=["POST"])
def novo_fornecedor():
    try:
        data = request.get_json() or {}
        nome = data.get("nome", "").strip()
        cnpj = data.get("cnpj", "").strip()

        if not nome or not cnpj:
            return jsonify({"error": "Nome e CNPJ são obrigatórios"}), 400

        if not validar_cnpj(cnpj):
            return jsonify({"error": "CNPJ inválido"}), 400

        existente = Fornecedor.query.filter_by(cnpj=cnpj).first()
        if existente:
            return jsonify({
                "message": "Fornecedor já existe", 
                "id": existente.id
            }), 409

        fornecedor = Fornecedor(
            nome=nome,
            cnpj=cnpj,
            contato=data.get("contato", "").strip(),
            endereco=data.get("endereco", "").strip(),
            responsavel=data.get("responsavel", "").strip()
        )
        
        db.session.add(fornecedor)
        db.session.commit()
        
        return jsonify({
            "message": "Fornecedor cadastrado com sucesso", 
            "id": fornecedor.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Erro interno do servidor"}), 500

@fornecedores_bp.route("/fornecedor/<int:id>", methods=["GET"])
def buscar_fornecedor(id):
    try:
        fornecedor = Fornecedor.query.get_or_404(id)
        return jsonify({
            "id": fornecedor.id,
            "nome": fornecedor.nome,
            "cnpj": fornecedor.cnpj,
            "contato": fornecedor.contato,
            "endereco": fornecedor.endereco,
            "responsavel": fornecedor.responsavel
        })
    except Exception as e:
        return jsonify({"error": "Fornecedor não encontrado"}), 404

@fornecedores_bp.route("/fornecedor/<int:id>", methods=["PUT"])
def atualizar_fornecedor(id):
    try:
        fornecedor = Fornecedor.query.get_or_404(id)
        data = request.get_json() or {}
        
        if "nome" in data:
            fornecedor.nome = data["nome"].strip()
        if "contato" in data:
            fornecedor.contato = data["contato"].strip()
        if "endereco" in data:
            fornecedor.endereco = data["endereco"].strip()
        if "responsavel" in data:
            fornecedor.responsavel = data["responsavel"].strip()
            
        db.session.commit()
        return jsonify({"message": "Fornecedor atualizado com sucesso"})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Erro ao atualizar fornecedor"}), 500

@fornecedores_bp.route("/fornecedor/<int:id>", methods=["DELETE"])
def deletar_fornecedor(id):
    try:
        fornecedor = Fornecedor.query.get_or_404(id)
        db.session.delete(fornecedor)
        db.session.commit()
        return jsonify({"message": "Fornecedor deletado com sucesso"})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Erro ao deletar fornecedor"}), 500