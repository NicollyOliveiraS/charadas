// ==================== FUNÇÕES DE ACESSO AO LOCALSTORAGE ====================
function getCharadasLocal() {
    return JSON.parse(localStorage.getItem('charadas')) || [];
}

function salvarCharadaLocal(pergunta, resposta) {
    const lista = getCharadasLocal();
    lista.push({ pergunta, resposta });
    localStorage.setItem('charadas', JSON.stringify(lista));
}

// ==================== SISTEMA DE ESTATÍSTICAS DE ACERTOS ====================
// Estrutura: { acertos: number, erros: number }

function getEstatisticas() {
    const padrao = { acertos: 0, erros: 0 };
    const stats = localStorage.getItem('estatisticas_charadas');
    return stats ? JSON.parse(stats) : padrao;
}

function salvarEstatisticas(acertos, erros) {
    localStorage.setItem('estatisticas_charadas', JSON.stringify({ acertos, erros }));
}

function adicionarAcerto() {
    const stats = getEstatisticas();
    stats.acertos++;
    salvarEstatisticas(stats.acertos, stats.erros);
    atualizarInterfaceEstatisticas();
}

function adicionarErro() {
    const stats = getEstatisticas();
    stats.erros++;
    salvarEstatisticas(stats.acertos, stats.erros);
    atualizarInterfaceEstatisticas();
}

function resetarEstatisticas() {
    if (confirm("⚠️ Tem certeza que quer resetar todas as estatísticas de acertos?")) {
        salvarEstatisticas(0, 0);
        atualizarInterfaceEstatisticas();
        alert("📊 Estatísticas resetadas com sucesso!");
    }
}

function atualizarInterfaceEstatisticas() {
    const stats = getEstatisticas();
    const total = stats.acertos + stats.erros;
    const percentual = total > 0 ? Math.round((stats.acertos / total) * 100) : 0;
    
    // Atualiza elementos HTML
    const barraElem = document.getElementById('barra-progresso');
    const acertosElem = document.getElementById('total-acertos');
    const errosElem = document.getElementById('total-erros');
    const totalElem = document.getElementById('total-tentativas');
    
    if (barraElem) barraElem.style.width = `${percentual}%`;
    if (acertosElem) acertosElem.textContent = stats.acertos;
    if (errosElem) errosElem.textContent = stats.erros;
    if (totalElem) totalElem.textContent = total;
    
    // Muda a cor da barra baseada no desempenho
    if (barraElem) {
        // Remove classes existentes
        barraElem.classList.remove('bg-emerald-500', 'bg-yellow-500', 'bg-red-500');
        
        if (percentual >= 70) {
            barraElem.classList.add('bg-emerald-500');
        } else if (percentual >= 40) {
            barraElem.classList.add('bg-yellow-500');
        } else if (percentual > 0) {
            barraElem.classList.add('bg-red-500');
        } else {
            barraElem.classList.add('bg-emerald-500');
        }
    }
}

// ==================== ELEMENTOS QUE EXISTEM APENAS NA PÁGINA INDEX ====================
const cardInner = document.getElementById('card-inner');
const campoPergunta = document.getElementById('pergunta');
const campoResposta = document.getElementById('resposta');
const btnNova = document.getElementById('btn-nova');
const btnAcertou = document.getElementById('btn-acertou');
const btnErrou = document.getElementById('btn-errou');
const btnResetar = document.getElementById('btn-resetar');

// Função para virar o card (mostrar resposta)
function virarCardParaFrente() {
    if (cardInner) {
        cardInner.classList.remove('flipped');
    }
}

// Evento de clique para virar o card (mostrar resposta)
if (cardInner) {
    cardInner.addEventListener('click', function () {
        this.classList.toggle('flipped');
    });
}

// ==================== LÓGICA PRINCIPAL DE BUSCAR CHARADA ====================
let charadaAtual = null; // Armazena a charada atual para referência

async function buscarCharada() {
    try {
        // 50% de chance de usar charadas locais, 50% de usar API
        const usarLocal = Math.random() < 0.5;
        
        if (usarLocal) {
            const locais = getCharadasLocal();
            if (locais.length > 0) {
                const randomIndex = Math.floor(Math.random() * locais.length);
                charadaAtual = locais[randomIndex];
                
                if (campoPergunta) campoPergunta.textContent = charadaAtual.pergunta;
                if (campoResposta) campoResposta.textContent = charadaAtual.resposta;
                
                // Garante que o card mostre a pergunta (frente)
                virarCardParaFrente();
                return;
            }
            // Se não há charadas locais, continua para a API (fallback silencioso)
        }
        
        // Busca da API externa
        const respostaAPI = await fetch("https://gerador-de-charadas-api.vercel.app/charadas/aleatoria");
        
        if (!respostaAPI.ok) {
            throw new Error("Falha na API");
        }
        
        const dados = await respostaAPI.json();
        charadaAtual = { pergunta: dados.pergunta, resposta: dados.resposta };
        
        if (campoPergunta) campoPergunta.textContent = charadaAtual.pergunta;
        if (campoResposta) campoResposta.textContent = charadaAtual.resposta;
        
        // Garante que o card mostre a pergunta (frente)
        virarCardParaFrente();
        
    } catch (error) {
        console.error("Erro ao buscar charada:", error);
        if (campoPergunta) campoPergunta.textContent = "❌ Erro ao carregar charada. Tente novamente!";
        if (campoResposta) campoResposta.textContent = "😢";
        charadaAtual = null;
        
        // Fallback de emergência: tenta pegar qualquer charada local como último recurso
        const locais = getCharadasLocal();
        if (locais.length > 0) {
            const fallback = locais[Math.floor(Math.random() * locais.length)];
            if (campoPergunta) campoPergunta.textContent = fallback.pergunta;
            if (campoResposta) campoResposta.textContent = fallback.resposta;
            charadaAtual = fallback;
            virarCardParaFrente();
        }
    }
}

// Evento do botão "Nova Charada"
if (btnNova) {
    btnNova.addEventListener('click', buscarCharada);
}

// Evento do botão "Acertou"
if (btnAcertou) {
    btnAcertou.addEventListener('click', () => {
        if (charadaAtual) {
            adicionarAcerto();
            // Feedback visual temporário
            btnAcertou.classList.add('scale-95');
            setTimeout(() => btnAcertou.classList.remove('scale-95'), 200);
            // Mostrar mensagem de parabéns
            const toast = document.createElement('div');
           
            toast.className = 'fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-full shadow-lg text-sm animate-bounce';
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 1500);
        } else {
            alert("Carregue uma charada primeiro!");
        }
    });
}

// Evento do botão "Errou"
if (btnErrou) {
    btnErrou.addEventListener('click', () => {
        if (charadaAtual) {
            adicionarErro();
            // Feedback visual temporário
            btnErrou.classList.add('scale-95');
            setTimeout(() => btnErrou.classList.remove('scale-95'), 200);
            // Mostrar mensagem de incentivo
            const toast = document.createElement('div');
           
            toast.className = 'fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-full shadow-lg text-sm animate-bounce';
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 1500);
        } else {
            alert("Carregue uma charada primeiro!");
        }
    });
}

// Evento do botão "Resetar Estatísticas"
if (btnResetar) {
    btnResetar.addEventListener('click', resetarEstatisticas);
}

// Carregar uma charada ao abrir a página
if (campoPergunta && campoResposta) {
    buscarCharada();
}

// Carregar as estatísticas ao abrir a página
atualizarInterfaceEstatisticas();


const inputPergunta = document.getElementById('input-pergunta');
const inputResposta = document.getElementById('input-resposta');
const btnSalvar = document.getElementById('btn-salvar');

if (btnSalvar) {
    btnSalvar.addEventListener('click', () => {
        const pergunta = inputPergunta?.value.trim();
        const resposta = inputResposta?.value.trim();
        
        if (!pergunta || !resposta) {
            alert("⚠️ Preencha os dois campos (pergunta e resposta) antes de salvar!");
            return;
        }
        
        salvarCharadaLocal(pergunta, resposta);
        
        // Limpa os campos
        if (inputPergunta) inputPergunta.value = "";
        if (inputResposta) inputResposta.value = "";
        
        alert("✅ Charada salva com sucesso! 🎉\nEla já pode aparecer no gerador principal.");
    });
}