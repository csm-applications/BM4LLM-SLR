# BM4LLM-SLR  
**Bias Mitigation for LLM-Assisted Systematic Literature Reviews**  

BM4LLM-SLR é um sistema experimental e open-source projetado para apoiar pesquisadores na **fase de seleção de estudos** em **Revisões Sistemáticas da Literatura (Systematic Literature Reviews – SLRs)**.  
O objetivo é tornar o uso de **Large Language Models (LLMs)** mais **confiável, transparente e menos enviesado**.  

🔗 [Acesse a versão online do sistema](https://csm-research.github.io/10-BM4LLM-SLR/support-system/public/)  

---

## 🚀 Por que usar o BM4LLM-SLR?
Revisões Sistemáticas da Literatura são essenciais para consolidar evidências científicas, mas demandam **muito esforço manual** e estão sujeitas a **erros humanos**.  

Embora os **LLMs** possam auxiliar nessa tarefa, eles podem introduzir **viés ou inconsistências** se usados isoladamente.  

O BM4LLM-SLR adiciona uma camada de **mitigação de viés**, oferecendo:  
- ✅ **Configuração de limiares de confiança**  
- ✅ **Controle de rigor na seleção**  
- ✅ **Participação ativa do revisor humano**  

Assim, aumenta-se a **confiabilidade** dos resultados e reduz-se o risco de viés.  

---

## 🛠️ Instalação e Uso

### 1. Rodar um LLM localmente com **Ollama**
Você pode usar o [Ollama](https://ollama.com/) para executar modelos localmente.  

Com **Docker**:  
```bash
docker run -d --name ollama \
  -v ollama:/root/.ollama \
  -p 11434:11434 \
  -e OLLAMA_ORIGINS=* \
  ollama/ollama
