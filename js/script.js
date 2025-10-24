const API_BASE = 'http://localhost:5000';

let estado = {
    fornecedores: [],
    guias: [],
    fornecedorEditando: null
};

document.addEventListener('DOMContentLoaded', function() {
    carregarFornecedores();
    carregarHistoricoGuias();
    atualizarDataEmissao();
});

function atualizarDataEmissao() {
    const data = new Date();
    const dataFormatada = formatarDataBrasileira(data);
    document.getElementById('data-emissao').value = dataFormatada;
}

function formatarDataBrasileira(data) {
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();
    return `${dia}/${mes}/${ano}`;
}

function formatarDataParaAPI(dataString) {
    const partes = dataString.split('/');
    if (partes.length === 3) {
        return `${partes[2]}-${partes[1]}-${partes[0]}`;
    }
    return dataString;
}

async function carregarFornecedores() {
    try {
        const response = await fetch(`${API_BASE}/fornecedores`);
        if (!response.ok) throw new Error('Erro ao carregar fornecedores');
        
        estado.fornecedores = await response.json();
        preencherSelectFornecedores();
    } catch (error) {
        mostrarMensagem('Erro ao carregar fornecedores: ' + error.message, 'error');
    }
}

function preencherSelectFornecedores() {
    const select = document.getElementById('fornecedor-select');
    select.innerHTML = '<option value="">Selecione um fornecedor</option>';
    
    estado.fornecedores.forEach(fornecedor => {
        const option = document.createElement('option');
        option.value = fornecedor.id;
        option.textContent = `${fornecedor.nome} - ${fornecedor.cnpj}`;
        option.setAttribute('data-fornecedor', JSON.stringify(fornecedor));
        select.appendChild(option);
    });
    
    select.onchange = function() {
        const option = this.options[this.selectedIndex];
        if (option.value) {
            const fornecedor = JSON.parse(option.getAttribute('data-fornecedor'));
            mostrarInfoFornecedor(fornecedor);
        } else {
            esconderInfoFornecedor();
        }
    };
}

function mostrarInfoFornecedor(fornecedor) {
    document.getElementById('info-cnpj').textContent = fornecedor.cnpj;
    document.getElementById('info-contato').textContent = fornecedor.contato || 'Não informado';
    document.getElementById('info-email').textContent = fornecedor.email || 'Não informado';
    document.getElementById('info-endereco').textContent = fornecedor.endereco || 'Não informado';
    document.getElementById('info-responsavel').textContent = fornecedor.responsavel || 'Não informado';
    document.getElementById('fornecedor-info').style.display = 'block';
}

function esconderInfoFornecedor() {
    document.getElementById('fornecedor-info').style.display = 'none';
}

function abrirCadastroFornecedor() {
    estado.fornecedorEditando = null;
    document.getElementById('modal-fornecedor-titulo').textContent = 'Novo Fornecedor';
    document.getElementById('btn-excluir-fornecedor').style.display = 'none';
    limparModalFornecedor();
    document.getElementById('modal-fornecedor').style.display = 'block';
}

function editarFornecedorSelecionado() {
    const select = document.getElementById('fornecedor-select');
    if (!select.value) {
        mostrarMensagem('Selecione um fornecedor para editar', 'warning');
        return;
    }
    
    const fornecedor = JSON.parse(select.options[select.selectedIndex].getAttribute('data-fornecedor'));
    estado.fornecedorEditando = fornecedor;
    
    document.getElementById('modal-fornecedor-titulo').textContent = 'Editar Fornecedor';
    document.getElementById('btn-excluir-fornecedor').style.display = 'block';
    document.getElementById('btn-excluir-fornecedor').setAttribute('onclick', `excluirFornecedor(${fornecedor.id})`);
    
    document.getElementById('novo-nome').value = fornecedor.nome || '';
    document.getElementById('novo-cnpj').value = fornecedor.cnpj || '';
    document.getElementById('novo-contato').value = fornecedor.contato || '';
    document.getElementById('novo-email').value = fornecedor.email || '';
    document.getElementById('novo-endereco').value = fornecedor.endereco || '';
    document.getElementById('novo-responsavel').value = fornecedor.responsavel || '';
    
    const modal = document.getElementById('modal-fornecedor');
    modal.style.display = 'block';
}

function limparModalFornecedor() {
    document.getElementById('novo-nome').value = '';
    document.getElementById('novo-cnpj').value = '';
    document.getElementById('novo-contato').value = '';
    document.getElementById('novo-email').value = '';
    document.getElementById('novo-endereco').value = '';
    document.getElementById('novo-responsavel').value = '';
    document.getElementById('fornecedor-message').textContent = '';
}

async function salvarFornecedor() {
    try {
        const dados = {
            nome: document.getElementById('novo-nome').value.trim(),
            cnpj: document.getElementById('novo-cnpj').value.trim(),
            contato: document.getElementById('novo-contato').value.trim(),
            email: document.getElementById('novo-email').value.trim(),
            endereco: document.getElementById('novo-endereco').value.trim(),
            responsavel: document.getElementById('novo-responsavel').value.trim()
        };
        
        console.log('Dados a serem enviados:', dados);
        
        if (!dados.nome || !dados.cnpj) {
            mostrarMensagemModal('Nome e CNPJ são obrigatórios', 'error');
            return;
        }
        
        if (dados.email && !validarEmail(dados.email)) {
            mostrarMensagemModal('Email inválido', 'error');
            return;
        }
        
        if (!dados.email) {
            dados.email = '';
        }
        
        const url = estado.fornecedorEditando 
            ? `${API_BASE}/fornecedor/${estado.fornecedorEditando.id}`
            : `${API_BASE}/fornecedor/novo`;
            
        const method = estado.fornecedorEditando ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(dados)
        });
        
        const responseData = await response.json();
        
        if (!response.ok) {
            throw new Error(responseData.error || `Erro ${response.status} ao salvar fornecedor`);
        }
        
        mostrarMensagemModal(responseData.message || 'Fornecedor salvo com sucesso!', 'success');
        
        // Fechar modal após sucesso
        setTimeout(() => {
            fecharModalFornecedor();
            carregarFornecedores();
        }, 1500);
        
    } catch (error) {
        console.error('Erro detalhado:', error);
        mostrarMensagemModal('Erro: ' + error.message, 'error');
    }
}

function validarEmail(email) {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email);
}

function adicionarEquipamento() {
    const tbody = document.getElementById('equipamentos-body');
    const novaLinha = document.createElement('tr');
    
    novaLinha.innerHTML = `
        <td><input type="number" class="quantidade" placeholder="Ex: 1" min="1" value="1"></td>
        <td><input type="text" class="descricao" placeholder="Descrição Detalhada do Equipamento" required></td>
        <td><input type="text" class="numero-serie" placeholder="Número de Série"></td>
        <td><input type="text" class="patrimonio" placeholder="Nº Patrimônio"></td>
        <td><input type="text" class="valor" placeholder="R$ 0,00"></td>
        <td><button type="button" class="btn-remove no-print" onclick="removerEquipamento(this)">✕</button></td>
    `;
    
    tbody.appendChild(novaLinha);
}

function removerEquipamento(botao) {
    const linhas = document.getElementById('equipamentos-body').getElementsByTagName('tr');
    if (linhas.length > 1) {
        botao.closest('tr').remove();
    } else {
        mostrarMensagem('É necessário pelo menos um equipamento', 'warning');
    }
}

function obterDadosEquipamentos() {
    const equipamentos = [];
    const linhas = document.getElementById('equipamentos-body').getElementsByTagName('tr');
    
    for (let linha of linhas) {
        const inputs = linha.getElementsByTagName('input');
        const equipamento = {
            quantidade: parseInt(inputs[0].value) || 1,
            descricao: inputs[1].value.trim(),
            numero_serie: inputs[2].value.trim(),
            patrimonio: inputs[3].value.trim(),
            valor: inputs[4].value.trim()
        };
        
        if (!equipamento.descricao) {
            throw new Error('Descrição do equipamento é obrigatória');
        }
        
        equipamentos.push(equipamento);
    }
    
    return equipamentos;
}

async function salvarGuia() {
    const fornecedorId = document.getElementById('fornecedor-select').value;
    
    if (!fornecedorId) {
        mostrarMensagem('Selecione um fornecedor', 'error');
        return;
    }
    
    let equipamentos;
    try {
        equipamentos = obterDadosEquipamentos();
    } catch (error) {
        mostrarMensagem(error.message, 'error');
        return;
    }
    
    const motivo = obterMotivoSelecionado();
    const defeito = document.getElementById('defeito').value.trim();
    
    if (!defeito) {
        mostrarMensagem('Descreva o defeito/problema relatado', 'error');
        return;
    }
    
    const dadosGuia = {
        fornecedor_id: parseInt(fornecedorId),
        equipamentos: equipamentos,
        motivo: motivo,
        defeito: defeito
    };
    
    try {
        const response = await fetch(`${API_BASE}/guia/nova`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosGuia)
        });
        
        if (!response.ok) {
            const erro = await response.json();
            throw new Error(erro.error || 'Erro ao salvar guia');
        }
        
        const resultado = await response.json();
        
        document.getElementById('numero-guia').value = resultado.numero;
        
        mostrarMensagem('Guia salva com sucesso! Número: ' + resultado.numero, 'success');
        
        carregarHistoricoGuias();
        
        document.getElementById('numero-guia').setAttribute('data-guia-id', resultado.id);
        
    } catch (error) {
        mostrarMensagem(error.message, 'error');
    }
}

function obterMotivoSelecionado() {
    const motivos = [];
    const checkboxes = document.querySelectorAll('.checkbox-group input[type="checkbox"]:checked');
    
    checkboxes.forEach(checkbox => {
        if (checkbox.id === 'outros' && document.getElementById('outros-detalhe').value) {
            motivos.push('Outros: ' + document.getElementById('outros-detalhe').value);
        } else if (checkbox.id !== 'outros') {
            motivos.push(checkbox.value);
        }
    });
    
    return motivos.join(', ');
}

async function carregarHistoricoGuias() {
    try {
        const response = await fetch(`${API_BASE}/guias`);
        if (!response.ok) throw new Error('Erro ao carregar histórico');
        
        estado.guias = await response.json();
        preencherHistorico();
    } catch (error) {
        console.error('Erro ao carregar histórico:', error);
    }
}

function preencherHistorico() {
    const tbody = document.getElementById('historico-body');
    tbody.innerHTML = '';
    
    estado.guias.forEach(guia => {
        const dataFormatada = formatarDataDisplay(guia.data_emissao);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${guia.numero_guia}</td>
            <td>${dataFormatada}</td>
            <td>${guia.fornecedor.nome}</td>
            <td>${guia.motivo || '-'}</td>
            <td>${guia.equipamentos.length} equipamento(s)</td>
            <td>
                <button class="btn-small btn-primary" onclick="carregarGuiaNoFormulario(${guia.id})">Carregar</button>
                <button class="btn-small btn-danger" onclick="deletarGuia(${guia.id})">Excluir</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function formatarDataDisplay(dataString) {
    if (!dataString) return '-';
    
    const partes = dataString.split('-');
    if (partes.length === 3) {
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return dataString;
}

async function visualizarGuia(id) {
    try {
        const response = await fetch(`${API_BASE}/guia/${id}`);
        if (!response.ok) throw new Error('Guia não encontrada');
        
        const guia = await response.json();
        const dataFormatada = formatarDataDisplay(guia.data_emissao);
        
        alert(`Guia: ${guia.numero_guia}\nData: ${dataFormatada}\nFornecedor: ${guia.fornecedor.nome}\nEquipamentos: ${guia.equipamentos.length}`);
    } catch (error) {
        mostrarMensagem(error.message, 'error');
    }
}

async function deletarGuia(id) {
    if (!confirm('Tem certeza que deseja excluir esta guia?')) return;
    
    try {
        const response = await fetch(`${API_BASE}/guia/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Erro ao excluir guia');
        
        mostrarMensagem('Guia excluída com sucesso', 'success');
        carregarHistoricoGuias();
    } catch (error) {
        mostrarMensagem(error.message, 'error');
    }
}

function limparFormulario() {
    if (!confirm('Deseja limpar todos os dados do formulário?')) {
        return;
    }
    
    document.getElementById('fornecedor-select').value = '';
    document.getElementById('defeito').value = '';
    document.getElementById('outros-detalhe').value = '';
    document.getElementById('numero-guia').value = '';
    document.getElementById('numero-guia').removeAttribute('data-guia-id');
    esconderInfoFornecedor();

    document.querySelectorAll('.checkbox-group input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
    });

    const tbody = document.getElementById('equipamentos-body');
    while (tbody.rows.length > 1) {
        tbody.deleteRow(1);
    }

    const primeiraLinha = tbody.rows[0];
    const inputs = primeiraLinha.getElementsByTagName('input');
    inputs[0].value = '1';
    inputs[1].value = '';
    inputs[2].value = '';
    inputs[3].value = '';
    inputs[4].value = '';
    
    atualizarDataEmissao();
    
    mostrarMensagem('Formulário limpo com sucesso', 'success');
}

function mostrarMensagem(texto, tipo) {
    alert(`[${tipo.toUpperCase()}] ${texto}`);
}

function mostrarMensagemModal(texto, tipo) {
    const element = document.getElementById('fornecedor-message');
    element.textContent = texto;
    element.className = `message ${tipo}`;
    element.style.display = 'block';
}

function mostrarModalConfirmacao(titulo, mensagem, callback) {
    document.getElementById('confirmacao-titulo').textContent = titulo;
    document.getElementById('confirmacao-mensagem').textContent = mensagem;
    
    const btnConfirmar = document.getElementById('confirmacao-confirmar');
    btnConfirmar.onclick = callback;
    
    document.getElementById('modal-confirmacao').style.display = 'block';
}

function fecharModalConfirmacao() {
    document.getElementById('modal-confirmacao').style.display = 'none';
}

function imprimirGuia() {

    const fornecedorSelect = document.getElementById('fornecedor-select');
    const equipamentos = obterDadosEquipamentos();
    
    if (!fornecedorSelect.value || equipamentos.length === 0) {
        mostrarMensagem('Preencha os dados da guia antes de imprimir', 'warning');
        return;
    }

    const dadosGuia = obterDadosParaImpressao();

    const janelaImpressao = window.open('', '_blank');
    janelaImpressao.document.write(gerarHTMLImpressao(dadosGuia));
    janelaImpressao.document.close();

    janelaImpressao.onload = function() {
        janelaImpressao.print();
    };
}

function obterDadosParaImpressao() {
    const fornecedorSelect = document.getElementById('fornecedor-select');
    const fornecedorSelecionado = fornecedorSelect.options[fornecedorSelect.selectedIndex];
    const fornecedor = JSON.parse(fornecedorSelecionado.getAttribute('data-fornecedor'));
    
    return {
        numero_guia: document.getElementById('numero-guia').value || 'A GERAR',
        data_emissao: document.getElementById('data-emissao').value,
        fornecedor: fornecedor,
        equipamentos: obterDadosEquipamentos(),
        motivo: obterMotivoSelecionado(),
        defeito: document.getElementById('defeito').value
    };
}

function gerarHTMLImpressao(dados) {
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    
    return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Guia de Remessa - ${dados.numero_guia}</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: Arial, sans-serif;
                line-height: 1.4;
                color: #000;
                padding: 20px;
                background: white;
            }
            
            .container-impressao {
                max-width: 210mm;
                margin: 0 auto;
            }
            
            .header-impressao {
                text-align: center;
                margin-bottom: 20px;
                padding-bottom: 15px;
                border-bottom: 3px double #000;
            }
            
            .header-impressao h1 {
                font-size: 18px;
                margin-bottom: 10px;
                text-transform: uppercase;
            }
            
            .empresa-info {
                font-weight: bold;
                margin-bottom: 5px;
            }
            
            .empresa-cnpj {
                font-size: 12px;
            }
            
            .section-impressao {
                margin-bottom: 20px;
                page-break-inside: avoid;
            }
            
            .section-title {
                font-weight: bold;
                font-size: 14px;
                margin-bottom: 10px;
                padding: 5px;
                background: #f0f0f0;
                border: 1px solid #000;
            }
            
            .dados-guia {
                display: flex;
                justify-content: space-between;
                margin-bottom: 15px;
                font-size: 12px;
            }
            
            .fornecedor-info {
                margin-bottom: 15px;
                font-size: 12px;
            }
            
            .fornecedor-info p {
                margin: 2px 0;
            }
            
            .table-impressao {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 15px;
                font-size: 10px;
            }
            
            .table-impressao th,
            .table-impressao td {
                border: 1px solid #000;
                padding: 6px;
                text-align: left;
            }
            
            .table-impressao th {
                background: #e0e0e0;
                font-weight: bold;
            }
            
            .motivo-defeito {
                margin-bottom: 20px;
                font-size: 12px;
            }
            
            .motivo-defeito p {
                margin: 5px 0;
            }
            
            .assinaturas {
                display: flex;
                justify-content: space-between;
                margin-top: 40px;
                page-break-inside: avoid;
            }
            
            .assinatura {
                text-align: center;
                width: 30%;
                border-top: 1px solid #000;
                padding-top: 60px;
            }
            
            .assinatura p {
                margin: 5px 0;
                font-size: 11px;
            }
            
            .assinatura-nome {
                font-weight: bold;
                margin-top: 10px;
            }
            
            .rodape {
                text-align: center;
                margin-top: 30px;
                font-size: 10px;
                color: #666;
                border-top: 1px solid #000;
                padding-top: 10px;
            }
            
            @media print {
                body {
                    padding: 10px;
                }
                
                .no-print {
                    display: none;
                }
                
                .section-impressao {
                    page-break-inside: avoid;
                }
            }
        </style>
    </head>
    <body>
        <div class="container-impressao">
            <div class="header-impressao">
                <h1>GUIA DE REMESSA PARA MANUTENÇÃO/CONSERTO</h1>
                <p class="empresa-info">BANCO WOORI BANK DO BRASIL S/A</p>
                <p class="empresa-cnpj">CNPJ: 15.357.060.0001-33</p>
            </div>
            
            <div class="section-impressao">
                <div class="section-title">DADOS DA REMESSA</div>
                <div class="dados-guia">
                    <div><strong>Número da Guia:</strong> ${dados.numero_guia}</div>
                    <div><strong>Data de Emissão:</strong> ${dados.data_emissao}</div>
                </div>
            </div>
            
            <div class="section-impressao">
                <div class="section-title">INFORMAÇÕES DO FORNECEDOR/PRESTADOR DE SERVIÇOS</div>
                <div class="fornecedor-info">
                    <p><strong>Razão Social:</strong> ${dados.fornecedor.nome}</p>
                    <p><strong>CNPJ:</strong> ${dados.fornecedor.cnpj}</p>
                    <p><strong>Contato:</strong> ${dados.fornecedor.contato || 'Não informado'}</p>
                    <p><strong>E-mail:</strong> ${dados.fornecedor.email || 'Não informado'}</p>
                    <p><strong>Endereço:</strong> ${dados.fornecedor.endereco || 'Não informado'}</p>
                    <p><strong>Responsável:</strong> ${dados.fornecedor.responsavel || 'Não informado'}</p>
                </div>
            </div>
            
            <div class="section-impressao">
                <div class="section-title">ATIVOS REMETIDOS</div>
                <table class="table-impressao">
                    <thead>
                        <tr>
                            <th width="8%">Qtd.</th>
                            <th width="32%">Descrição do Equipamento/Ativo</th>
                            <th width="15%">Nº de Série</th>
                            <th width="15%">Patrimônio</th>
                            <th width="15%">Valor Contábil</th>
                            <th width="15%">Observações</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${dados.equipamentos.map(equip => `
                            <tr>
                                <td>${equip.quantidade}</td>
                                <td>${equip.descricao}</td>
                                <td>${equip.numero_serie || '-'}</td>
                                <td>${equip.patrimonio || '-'}</td>
                                <td>${equip.valor || '-'}</td>
                                <td></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            
            <div class="section-impressao">
                <div class="section-title">MOTIVO DA REMESSA</div>
                <div class="motivo-defeito">
                    <p><strong>Motivo:</strong> ${dados.motivo || 'Não informado'}</p>
                    <p><strong>Defeito/Problema Relatado:</strong></p>
                    <p style="margin-top: 10px; min-height: 60px; border: 1px solid #ccc; padding: 8px;">
                        ${dados.defeito || '________________________________________________________________________________'}
                    </p>
                </div>
            </div>
            
            <div class="section-impressao">
                <div class="section-title">OBSERVAÇÕES</div>
                <div style="min-height: 80px; border: 1px solid #ccc; padding: 8px; margin-bottom: 20px;">
                    <p>• Os equipamentos deverão ser devolvidos em perfeitas condições de uso</p>
                    <p>• Prazo máximo para devolução: 30 dias</p>
                    <p>• Em caso de avarias durante o transporte, comunicar imediatamente</p>
                </div>
            </div>

            <div class="section-impressao">
                <div class="section-title">PARECER FINAL</div>
                <div style="min-height: 80px; border: 1px solid #ccc; padding: 8px; margin-bottom: 20px;">
                </p>
            </div>

            <div class="assinaturas">
                <div class="assinatura">
                    <p>EMITENTE</p>
                    <p>(Responsável pelo envio)</p>
                    <div class="assinatura-nome">___________________________________</div>
                </div>
                
                <div class="assinatura">
                    <p>RECEBEDOR</p>
                    <p>(Fornecedor/Prestador de Serviço)</p>
                    <div class="assinatura-nome">___________________________________</div>
                    <p>Data: ___/___/_______</p>
                </div>
                
                <div class="assinatura">
                    <p>CONFERÊNCIA</p>
                    <p>(Diretoria/Financeiro)</p>
                    <div class="assinatura-nome">___________________________________</div>
                </div>
            </div>
            
            <div class="rodape">
                <p>Documento gerado em ${dataAtual} - Sistema de Gestão de Guias de Remessa</p>
                <p>Via: Fornecedor | Emitente: Arquivo | Diretoria: Controle</p>
            </div>
        </div>
        
        <script>
            // Focar na janela de impressão
            window.focus();
            
            // Configurar para imprimir automaticamente após carregar
            window.onload = function() {
                setTimeout(function() {
                    window.print();
                }, 500);
            };
            
            // Fechar janela após impressão (em alguns navegadores)
            window.onafterprint = function() {
                setTimeout(function() {
                    window.close();
                }, 1000);
            };
        </script>
    </body>
    </html>
    `;
}

function validarDadosImpressao() {
    const errors = [];
    
    const fornecedorSelect = document.getElementById('fornecedor-select');
    if (!fornecedorSelect.value) {
        errors.push('Selecione um fornecedor');
    }
    
    let equipamentos;
    try {
        equipamentos = obterDadosEquipamentos();
        if (equipamentos.length === 0) {
            errors.push('Adicione pelo menos um equipamento');
        }
    } catch (error) {
        errors.push(error.message);
    }
    
    const defeito = document.getElementById('defeito').value.trim();
    if (!defeito) {
        errors.push('Descreva o defeito/problema relatado');
    }
    
    return errors;
}

function imprimirGuia() {
    const errors = validarDadosImpressao();
    if (errors.length > 0) {
        mostrarMensagem('Corrija os seguintes erros: ' + errors.join(' - '), 'error');
        return;
    }

    try {
        const dadosGuia = obterDadosParaImpressao();

        const janelaImpressao = window.open('', '_blank', 'width=800,height=600');
        
        if (!janelaImpressao) {
            mostrarMensagem('Permita pop-ups para esta funcionalidade', 'error');
            return;
        }
        
        janelaImpressao.document.write(gerarHTMLImpressao(dadosGuia));
        janelaImpressao.document.close();

        mostrarMensagem('Guia gerada para impressão! Verifique a nova aba.', 'success');
        
    } catch (error) {
        mostrarMensagem('Erro ao gerar guia para impressão: ' + error.message, 'error');
    }
}

async function carregarGuiaNoFormulario(id) {
    try {
        const response = await fetch(`${API_BASE}/guia/${id}`);
        if (!response.ok) throw new Error('Guia não encontrada');
        
        const guia = await response.json();

        document.getElementById('numero-guia').value = guia.numero_guia;
        document.getElementById('numero-guia').setAttribute('data-guia-id', guia.id);
        document.getElementById('data-emissao').value = formatarDataDisplay(guia.data_emissao);
        
        const select = document.getElementById('fornecedor-select');
        const option = Array.from(select.options).find(opt => 
            parseInt(opt.value) === guia.fornecedor.id
        );
        
        if (option) {
            select.value = option.value;
            mostrarInfoFornecedor(guia.fornecedor);
        }
        
        const tbody = document.getElementById('equipamentos-body');
        tbody.innerHTML = '';
        
        guia.equipamentos.forEach((equip, index) => {
            const novaLinha = document.createElement('tr');
            novaLinha.innerHTML = `
                <td><input type="number" class="quantidade" placeholder="Ex: 1" min="1" value="${equip.quantidade}"></td>
                <td><input type="text" class="descricao" placeholder="Descrição Detalhada do Equipamento" required value="${equip.descricao || ''}"></td>
                <td><input type="text" class="numero-serie" placeholder="Número de Série" value="${equip.numero_serie || ''}"></td>
                <td><input type="text" class="patrimonio" placeholder="Nº Patrimônio" value="${equip.patrimonio || ''}"></td>
                <td><input type="text" class="valor" placeholder="R$ 0,00" value="${equip.valor || ''}"></td>
                <td><button type="button" class="btn-remove no-print" onclick="removerEquipamento(this)">✕</button></td>
            `;
            tbody.appendChild(novaLinha);
        });
        
        preencherMotivos(guia.motivo);
        
        document.getElementById('defeito').value = guia.defeito || '';
        
        mostrarMensagem(`Guia ${guia.numero_guia} carregada para visualização`, 'success');
        
        window.scrollTo(0, 0);
        
    } catch (error) {
        mostrarMensagem('Erro ao carregar guia: ' + error.message, 'error');
    }
}

function preencherMotivos(motivoString) {
    document.querySelectorAll('.checkbox-group input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
    });
    
    if (!motivoString) return;
    
    const motivos = motivoString.split(', ');
    
    motivos.forEach(motivo => {
        if (motivo.includes('Manutenção Preventiva')) {
            document.getElementById('manutencao-preventiva').checked = true;
        } else if (motivo.includes('Conserto/Reparo')) {
            document.getElementById('conserto-reparo').checked = true;
        } else if (motivo.includes('Calibração')) {
            document.getElementById('calibracao').checked = true;
        } else if (motivo.includes('Outros:')) {
            document.getElementById('outros').checked = true;
            const detalhe = motivo.replace('Outros: ', '');
            document.getElementById('outros-detalhe').value = detalhe;
        }
    });
}

function mostrarInfoFornecedor(fornecedor) {
    document.getElementById('info-cnpj').textContent = fornecedor.cnpj;
    document.getElementById('info-contato').textContent = fornecedor.contato || 'Não informado';
    document.getElementById('info-email').textContent = fornecedor.email || 'Não informado';
    document.getElementById('info-endereco').textContent = fornecedor.endereco || 'Não informado';
    document.getElementById('info-responsavel').textContent = fornecedor.responsavel || 'Não informado';
    document.getElementById('fornecedor-info').style.display = 'block';
}

async function excluirFornecedor(id) {
    if (!confirm('ATENÇÃO: Esta ação excluirá o fornecedor e TODAS as guias associadas a ele. Tem certeza que deseja continuar?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/fornecedor/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const erro = await response.json();
            throw new Error(erro.error || 'Erro ao excluir fornecedor');
        }
        
        const resultado = await response.json();
        mostrarMensagem('Fornecedor excluído com sucesso', 'success');
        
        fecharModalFornecedor();
        carregarFornecedores();
        
        const select = document.getElementById('fornecedor-select');
        if (select.value == id) {
            select.value = '';
            esconderInfoFornecedor();
        }
        
    } catch (error) {
        mostrarMensagem('Erro ao excluir fornecedor: ' + error.message, 'error');
    }
}

function fecharModalFornecedor() {
    const modal = document.getElementById('modal-fornecedor');
    if (modal) {
        modal.style.display = 'none';
    }
    limparModalFornecedor();
    estado.fornecedorEditando = null;
    
    // Remover event listener de ESC se existir
    document.removeEventListener('keydown', handleEscKey);
}