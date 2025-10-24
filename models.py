from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Fornecedor(db.Model):
    __tablename__ = 'fornecedores_gr'
    
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(200), nullable=False)
    cnpj = db.Column(db.String(20), unique=True, nullable=False)
    contato = db.Column(db.String(100))
    email =db.Column(db.String(100))
    endereco = db.Column(db.String(200))
    responsavel = db.Column(db.String(100))
    guias = db.relationship('Guia', back_populates='fornecedor', cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Fornecedor {self.nome}>"
    
class Guia(db.Model):
    __tablename__ = 'guias_gr'
    

    id = db.Column(db.Integer, primary_key=True)
    numero_guia = db.Column(db.String(50), nullable=False, unique=True)
    data_emissao = db.Column(db.Date, default=datetime.utcnow)
    defeito = db.Column(db.Text)
    motivo = db.Column(db.String(200))
    fornecedor_id = db.Column(db.Integer, db.ForeignKey("fornecedores_gr.id"), nullable=False)

    fornecedor = db.relationship("Fornecedor", back_populates="guias")
    equipamentos = db.relationship("Equipamento", back_populates="guia", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Guia {self.numero_guia}>"

class Equipamento(db.Model):
    __tablename__ = 'equipamentos_gr'
    
    id = db.Column(db.Integer, primary_key=True)
    guia_id = db.Column(db.Integer, db.ForeignKey('guias_gr.id'), nullable=False)
    quantidade = db.Column(db.Integer, default=1)
    descricao = db.Column(db.String(200))
    numero_serie = db.Column(db.String(50))
    patrimonio = db.Column(db.String(50))
    valor = db.Column(db.String(50))

    guia = db.relationship("Guia", back_populates="equipamentos")

    def __repr__(self):
        return f"<Equipamento {self.descricao}>"