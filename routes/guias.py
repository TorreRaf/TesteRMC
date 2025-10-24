from flask import Blueprint, request, jsonify
from models import db, Guia, Equipamento, Fornecedor
from datetime import datetime
import re

guias_bp = Blueprint("guias", __name__)

def gerar_numero_guia():
    """Gera número sequencial seguro para guias"""
    ano = datetime.today().year
    ultima_guia = Guia.query.filter(
        Guia.numero_guia.like(f"GR-{ano}-%")
    ).order_by(Guia.id.desc()).first()
    
    if not ultima_guia:
        return f"GR-{ano}-0001"
    
    partes = ultima_guia.numero_guia.split("-")
    if len(partes) == 3:
        try:
            sequencial = int(partes[2]) + 1
            return f"GR-{ano}-{sequencial:04d}"
        except (ValueError, IndexError):
            pass
    
    total_ano = Guia.query.filter(
        Guia.numero_guia.like(f"GR-{ano}-%")
    ).count()
    return f"GR-{ano}-{total_ano + 1:04d}"

@guias_bp.route("/guia/nova", methods=["POST"])
def nova_guia():
    try:
        data = request.get_json() or {}
        fornecedor_id = data.get("fornecedor_id")
        
        if not fornecedor_id:
            return jsonify({"error": "fornecedor_id é obrigatório"}), 400

        fornecedor = Fornecedor.query.get(fornecedor_id)
        if not fornecedor:
            return jsonify({"error": "Fornecedor não encontrado"}), 404

        numero_guia = gerar_numero_guia()

        guia = Guia(
            numero_guia=numero_guia,
            data_emissao=datetime.utcnow().date(),
            fornecedor_id=fornecedor_id,
            defeito=data.get("defeito", "").strip(),
            motivo=data.get("motivo", "").strip()
        )
        
        db.session.add(guia)
        db.session.flush()

        equipamentos = data.get("equipamentos", [])
        if not equipamentos:
            return jsonify({"error": "Pelo menos um equipamento é obrigatório"}), 400

        for eq_data in equipamentos:
            try:
                quantidade = int(eq_data.get("quantidade", 1))
                if quantidade <= 0:
                    quantidade = 1
            except (ValueError, TypeError):
                quantidade = 1

            equipamento = Equipamento(
                guia_id=guia.id,
                quantidade=quantidade,
                descricao=eq_data.get("descricao", "").strip(),
                numero_serie=eq_data.get("numero_serie", "").strip(),
                patrimonio=eq_data.get("patrimonio", "").strip(),
                valor=eq_data.get("valor", "").strip()
            )
            db.session.add(equipamento)

        db.session.commit()
        
        return jsonify({
            "message": "Guia criada com sucesso",
            "numero": numero_guia,
            "id": guia.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Erro ao criar guia: {str(e)}"}), 500

@guias_bp.route("/guias", methods=["GET"])
def listar_guias():
    try:
        guias = Guia.query.order_by(Guia.id.desc()).all()
        resultado = []
        
        for guia in guias:
            resultado.append({
                "id": guia.id,
                "numero_guia": guia.numero_guia,
                "data_emissao": guia.data_emissao.strftime("%Y-%m-%d") if guia.data_emissao else None,
                "fornecedor": {
                    "id": guia.fornecedor.id,
                    "nome": guia.fornecedor.nome,
                    "cnpj": guia.fornecedor.cnpj,
                    "contato": guia.fornecedor.contato,
                    "email": guia.fornecedor.email,
                    "endereco": guia.fornecedor.endereco,
                    "responsavel": guia.fornecedor.responsavel,
                },
                "defeito": guia.defeito,
                "motivo": guia.motivo,
                "equipamentos": [
                    {
                        "id": equip.id,
                        "quantidade": equip.quantidade,
                        "descricao": equip.descricao,
                        "numero_serie": equip.numero_serie,
                        "patrimonio": equip.patrimonio,
                        "valor": equip.valor
                    } for equip in guia.equipamentos
                ]
            })
            
        return jsonify(resultado)
        
    except Exception as e:
        return jsonify({"error": "Erro ao listar guias"}), 500

@guias_bp.route("/guia/<int:id>", methods=["GET"])
def buscar_guia(id):
    try:
        guia = Guia.query.get_or_404(id)
        return jsonify({
            "id": guia.id,
            "numero_guia": guia.numero_guia,
            "data_emissao": guia.data_emissao.strftime("%Y-%m-%d") if guia.data_emissao else None,
            "fornecedor": {
                "id": guia.fornecedor.id,
                "nome": guia.fornecedor.nome,
                "cnpj": guia.fornecedor.cnpj
            },
            "defeito": guia.defeito,
            "motivo": guia.motivo,
            "equipamentos": [
                {
                    "id": equip.id,
                    "quantidade": equip.quantidade,
                    "descricao": equip.descricao,
                    "numero_serie": equip.numero_serie,
                    "patrimonio": equip.patrimonio,
                    "valor": equip.valor
                } for equip in guia.equipamentos
            ]
        })
    except Exception as e:
        return jsonify({"error": "Guia não encontrada"}), 404

@guias_bp.route("/guia/<int:id>", methods=["DELETE"])
def deletar_guia(id):
    try:
        guia = Guia.query.get_or_404(id)
        db.session.delete(guia)
        db.session.commit()
        return jsonify({"message": "Guia deletada com sucesso"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Erro ao deletar guia"}), 500