// ===============================
// BANCO DE DADOS LOCAL
// ===============================
let estoque = JSON.parse(localStorage.getItem('casa_china_estoque')) || [];

// ===============================
// INICIALIZAÇÃO
// ===============================
document.addEventListener("DOMContentLoaded", () => {
    const btnCadastrar = document.getElementById('btn-cadastrar');
    const btnVender = document.getElementById('btn-vender');

    if (btnCadastrar) btnCadastrar.addEventListener('click', cadastrar);
    if (btnVender) btnVender.addEventListener('click', vender);

    const imeiInput = document.getElementById('venda-imei');
    if (imeiInput) imeiInput.addEventListener('input', autoPreencher);

    const formaPagamento = document.getElementById('forma-pagamento');
    if (formaPagamento) formaPagamento.addEventListener('change', controlarParcelas);

    listar();
    atualizarDashboard();
});

// ===============================
// CADASTRAR / SALVAR EDIÇÃO
// ===============================
function cadastrar() {
    const editIndex = document.getElementById('edit-index').value;
    const marca = document.getElementById('marca').value.trim();
    const modelo = document.getElementById('modelo').value.trim();
    const imei = document.getElementById('imei').value.trim();
    const preco = document.getElementById('preco').value;
    const precoCusto = document.getElementById('preco-custo').value;

    if (!marca || !modelo || !imei || !precoCusto) {
        alert("⚠️ Preencha os campos obrigatórios.");
        return;
    }

    const produto = {
        marca,
        modelo,
        cor: document.getElementById('cor').value.trim(),
        imei,
        armazenamento: document.getElementById('armazenamento').value,
        ram: document.getElementById('ram').value,
        preco,
	precoCusto,
        fornecedor: document.getElementById('fornecedor').value.trim(),
        data: new Date().toLocaleDateString('pt-BR'),
        status: 'Disponível'
    };

    if (editIndex === "") {
        if (estoque.some(item => item.imei === imei)) {
            alert("❌ IMEI já cadastrado.");
            return;
        }
        estoque.push(produto);
    } else {
        const itemAntigo = estoque[editIndex];
        // Mantém as informações de venda caso o item editado já tenha sido vendido
        estoque[editIndex] = { 
            ...itemAntigo, 
            ...produto, 
            status: itemAntigo.status, 
            dataVenda: itemAntigo.dataVenda,
            clienteNome: itemAntigo.clienteNome,
            precoVenda: itemAntigo.precoVenda, 
 	    lucro: itemAntigo.lucro,
    	    margemLucro: itemAntigo.margemLucro
        };
        document.getElementById('edit-index').value = "";
        document.getElementById('btn-cadastrar').innerText = "Cadastrar";
    }

    salvar();
    limparForm('form-cadastro');
}

// ===============================
// REGISTRAR VENDA
// ===============================
function vender() {
    const imeiVenda = document.getElementById('venda-imei').value.trim();
    const precoVenda = document.getElementById('venda-preco').value;
    const cliente = document.getElementById('cliente-nome').value.trim();

    if (!imeiVenda || !precoVenda || !cliente) {
        alert("⚠️ Preencha os dados da venda.");
        return;
    }

    const index = estoque.findIndex(item => item.imei === imeiVenda && item.status === 'Disponível');

    if (index === -1) {
        alert("❌ Aparelho não disponível ou IMEI incorreto.");
        return;
    }
const custo = parseFloat(estoque[index].precoCusto || 0);
const venda = parseFloat(precoVenda || 0);

const lucro = venda - custo;
const margemLucro = custo > 0
    ? ((lucro / custo) * 100).toFixed(1)
    : 0;
    estoque[index].status = 'Vendido';
    estoque[index].clienteNome = cliente;
    estoque[index].precoVenda = precoVenda;
    estoque[index].dataVenda = new Date().toLocaleDateString('pt-BR');
    estoque[index].lucro = lucro;
    estoque[index].margemLucro = margemLucro;
    salvar();
    limparForm('form-venda');
    alert("💸 Venda finalizada com sucesso!");
}

// ===============================
// LISTAR (ESTOQUE E VENDAS SEPARADOS)
// ===============================
function listar() {
    const tabelaEstoque = document.getElementById('lista-estoque-disponivel');
    const tabelaVendas = document.getElementById('lista-vendidos');
    
    if (!tabelaEstoque || !tabelaVendas) return;

    let htmlEstoque = "";
    let htmlVendas = "";

    const listaParaExibir = [...estoque].reverse();

    listaParaExibir.forEach((item, originalIndex) => {
        const index = estoque.length - 1 - originalIndex;

        if (item.status === 'Disponível') {
            htmlEstoque += `
                <tr>
                    <td><strong>${item.marca}</strong><br>${item.modelo}</td>
                    <td>
    ${item.armazenamento} | ${item.ram}<br>

    <small>${item.cor}</small><br>

    <small style="color:#f1c40f; font-weight:bold;">
        Custo: R$ ${item.precoCusto || 0}
    </small><br>

    <small style="color:#2ecc71; font-weight:bold;">
        Venda: R$ ${item.preco || 0}
    </small>
</td>
                    <td>${item.imei}</td>
                    <td>${item.fornecedor}</td>
                    <td>${item.data}</td>
                    <td>
                        <button onclick="prepararEdicao(${index})" style="background:#ffc107; border:none; border-radius:4px; padding:5px; cursor:pointer;">✏️</button>
                        <button onclick="excluirItem(${index})" style="background:#e74c3c; color:white; border:none; border-radius:4px; padding:5px; cursor:pointer;">🗑️</button>
                    </td>
                </tr>
            `;
        } else {
            // CORREÇÃO: Removido 'opacity' e ajustado cores para melhor leitura
            htmlVendas += `
    <tr>

        <td style="border-left: 4px solid #27ae60;">
            <strong>${item.marca}</strong><br>
            ${item.modelo}
        </td>

        <td>

            <span style="color:#ffffff; font-weight:bold;">
                Cliente: ${item.clienteNome}
            </span><br>

            <span style="color:#3498db; font-weight:bold;">
                Venda: R$ ${item.precoVenda || 0}
            </span><br>

            <span style="color:#f1c40f; font-weight:bold;">
                Custo: R$ ${item.precoCusto || 0}
            </span><br>

            <span style="color:${item.lucro >= 0 ? '#2ecc71' : '#e74c3c'}; font-weight:bold;">
                Lucro: R$ ${item.lucro || 0}
            </span><br>

            <small style="color:#bbbbbb;">
                Margem: ${item.margemLucro || 0}%
            </small>

        </td>

        <td>
            <code>${item.imei}</code>
        </td>

        <td>
            ${item.dataVenda || item.data}
        </td>

        <td>
            <span style="
                background: #27ae60;
                color: white;
                padding: 3px 7px;
                border-radius: 4px;
                font-size: 11px;
                font-weight: bold;
            ">
                VENDIDO
            </span>
        </td>

        <td>
            <button
                onclick="excluirItem(${index})"
                style="
                    background:#e74c3c;
                    color:white;
                    border:none;
                    border-radius:4px;
                    padding:5px;
                    cursor:pointer;
                ">
                🗑️
            </button>
        </td>

    </tr>
            `;
        }
    });

    tabelaEstoque.innerHTML = htmlEstoque || '<tr><td colspan="6" style="text-align:center;">📦 Estoque vazio.</td></tr>';
    tabelaVendas.innerHTML = htmlVendas || '<tr><td colspan="6" style="text-align:center;">🤝 Nenhuma venda registrada.</td></tr>';
}

// ===============================
// FUNÇÕES AUXILIARES
// ===============================
function salvar() {
    localStorage.setItem('casa_china_estoque', JSON.stringify(estoque));
    listar();
    atualizarDashboard();
}

function atualizarDashboard() {

    const hoje = new Date().toLocaleDateString('pt-BR');

    const vendasHoje = estoque.filter(item =>
        item.status === 'Vendido' && item.dataVenda === hoje
    ).length;

    const disponiveis = estoque.filter(item =>
        item.status === 'Disponível'
    ).length;

    const vendidos = estoque.filter(item =>
        item.status === 'Vendido'
    );

    const lucroTotal = vendidos.reduce((acc, item) =>
        acc + Number(item.lucro || 0), 0);

    const faturamento = vendidos.reduce((acc, item) =>
        acc + Number(item.precoVenda || 0), 0);

    if(document.getElementById('vendas-dia')) {
        document.getElementById('vendas-dia').innerText = vendasHoje;
    }

    if(document.getElementById('estoque-baixo')) {
        document.getElementById('estoque-baixo').innerText = disponiveis;
    }

    if(document.getElementById('lucro-total')) {
        document.getElementById('lucro-total').innerText =
            `R$ ${lucroTotal.toFixed(2)}`;
    }

    if(document.getElementById('faturamento-total')) {
        document.getElementById('faturamento-total').innerText =
            `R$ ${faturamento.toFixed(2)}`;
    }
}
function prepararEdicao(index) {
    const item = estoque[index];
    document.getElementById('edit-index').value = index;
    document.getElementById('marca').value = item.marca;
    document.getElementById('modelo').value = item.modelo;
    document.getElementById('imei').value = item.imei;
    document.getElementById('cor').value = item.cor;
    document.getElementById('armazenamento').value = item.armazenamento;
    document.getElementById('ram').value = item.ram;
    document.getElementById('preco-custo').value = item.precoCusto || 0;
    document.getElementById('preco').value = item.preco;
    document.getElementById('fornecedor').value = item.fornecedor;
    document.getElementById('btn-cadastrar').innerText = "Salvar Alterações";
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function excluirItem(index) {
    if (confirm("Deseja realmente excluir este registro permanentemente?")) {
        estoque.splice(index, 1);
        salvar();
    }
}

function autoPreencher() {
    const imei = document.getElementById('venda-imei').value.trim();
    const produto = estoque.find(item => item.imei === imei && item.status === 'Disponível');
    if (produto) {
        document.getElementById('venda-marca').value = produto.marca;
        document.getElementById('venda-modelo').value = produto.modelo;
        document.getElementById('venda-cor').value = produto.cor;
        document.getElementById('venda-armazenamento').value = produto.armazenamento;
        document.getElementById('venda-ram').value = produto.ram;
    } else {
        document.getElementById('venda-marca').value = "";
        document.getElementById('venda-modelo').value = "";
        document.getElementById('venda-cor').value = "";
        document.getElementById('venda-armazenamento').value = "";
        document.getElementById('venda-ram').value = "";
    }
}

function controlarParcelas() {
    const forma = document.getElementById('forma-pagamento').value;
    const divParcelas = document.getElementById('parcelas');
    if (divParcelas) divParcelas.style.display = (forma === 'cartao') ? 'block' : 'none';
}

function limparForm(id) {
    const form = document.getElementById(id);
    if (form) {
        form.reset();
        // Garante que o index de edição seja limpo ao resetar
        if(id === 'form-cadastro') document.getElementById('edit-index').value = "";
    }
}
// ===============================
// LEITOR DE IMEI VIA CÂMERA
// ===============================

const btnCamera = document.getElementById('abrir-camera');

if (btnCamera) {

```
btnCamera.addEventListener('click', () => {

    const readerDiv = document.getElementById('reader');

    readerDiv.innerHTML = "";

    const scanner = new Html5Qrcode("reader");

    scanner.start(

        {
            facingMode: "environment"
        },

        {
            fps: 10,
            qrbox: 250
        },

        (decodedText) => {

            // PREENCHE O IMEI
            document.getElementById('imei').value = decodedText;

            // FECHA A CÂMERA
            scanner.stop();

            // LIMPA O LEITOR
            readerDiv.innerHTML = "";

            alert("✅ IMEI capturado com sucesso!");

        },

        (errorMessage) => {
            // IGNORA ERROS DE LEITURA CONTÍNUA
        }

    );

});
```

}
