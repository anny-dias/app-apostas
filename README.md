
# App Apostas — Segurança CI/CD (SAST + SCA + DAST)

Este repositório demonstra uma pipeline de segurança **completa** para a sprint de Cybersecurity, utilizando as ferramentas **Semgrep**, **OWASP Dependency-Check**, **Snyk**, **OWASP ZAP** e **Nikto** para identificar vulnerabilidades em tempo real, desde o código-fonte até a aplicação em execução.

A pipeline cobre **SAST** (análise estática), **SCA** (análise de dependências), **DAST** (testes dinâmicos) e integra essas ferramentas ao seu **CI/CD pipeline**. Ela também inclui **gates de segurança** e **notificações** via Slack.

## Ferramentas Utilizadas
- **SAST**: Semgrep (análise estática de código).
- **SCA**: OWASP Dependency-Check, Snyk (verificação de dependências).
- **DAST**: OWASP ZAP, Nikto (testes dinâmicos).
- **CI/CD**: GitHub Actions.
- **Notificação**: Slack (opcional).

---

## Funcionalidades da Pipeline

### 1. **SAST (Semgrep)**
- Análise estática do código com **Semgrep**.
- Detecta vulnerabilidades como **injeção de código (SQL, XSS)**, **uso inseguro de funções**, **falhas de autenticação**, **exposição de dados sensíveis**.
- Relatório gerado automaticamente, com vulnerabilidades classificadas por severidade e recomendações de correção.
- **Gate**: Bloqueia merge caso haja achados críticos (`error`).

### 2. **SCA (Dependency-Check + Snyk)**
- **OWASP Dependency-Check** verifica vulnerabilidades nas dependências do projeto (bibliotecas de terceiros).
- **Snyk** (opcional) pode ser integrado para uma análise mais detalhada de CVEs.
- Relatório gerado automaticamente com sugestões de atualização e plano de ação.
- **Gate**: Bloqueia merge caso haja **CRITICAL** ou **HIGH** CVEs.

### 3. **DAST (ZAP + Nikto)**
- **OWASP ZAP** e **Nikto** são usados para testar a aplicação em execução no ambiente de staging.
- Testa falhas como **autenticação**, **exposição de dados via endpoints**, **configurações inseguras**, **comportamentos inesperados sob carga**.
- Relatório gerado automaticamente com evidências de vulnerabilidades exploráveis, incluindo payloads utilizados e sugestões de mitigação.
- **Gate**: Bloqueia deploy caso haja **High** no ZAP.

### 4. **Integração e Monitoramento no CI/CD**
- Gatilhos automáticos para cada commit ou push em **main** ou **develop**.
- Notificação em tempo real via **Slack** (opcional).
- **Dashboards** com relatórios contínuos de segurança.
- **Bloqueio de deploy** em caso de vulnerabilidades críticas (SAST, SCA, DAST).

---

## Como Rodar a Pipeline (Passo a Passo)

### 1. **Configuração Inicial**

#### a) Subir o Repositório
1. **Crie um repositório GitHub** ou use um repositório existente.
2. Faça **upload do conteúdo do ZIP** no repositório.
   - Você pode usar a interface web do GitHub ou um cliente Git para fazer isso.

#### b) Configurar Secrets no GitHub
1. **Slack Webhook URL** (opcional):
   - Vá em **Settings → Secrets and variables → Actions → New repository secret**.
   - Nomeie como `SLACK_WEBHOOK_URL` e adicione a URL do webhook do Slack (necessário para notificações).
   
2. **Snyk Token** (opcional para SCA):
   - Crie uma conta no [Snyk](https://snyk.io/), gere um token de API.
   - Vá em **Settings → Secrets and variables → Actions → New repository secret**.
   - Nomeie como `SNYK_TOKEN` e adicione o token gerado.

3. **Configuração do GitHub Actions**:
   - O arquivo `.github/workflows/security-ci-cd.yml` contém a configuração da pipeline de segurança.
   - Ele é responsável por rodar as ferramentas **Semgrep**, **OWASP Dependency-Check**, **Snyk** e **OWASP ZAP + Nikto**.

#### c) Configurar o Ambiente de Staging
O arquivo `iac/docker-compose.staging.yml` sobe um ambiente **staging** com uma aplicação demo (em execução na porta `8080`).

1. Certifique-se de que o endpoint `GET /health` da sua aplicação retorna **status 200**.
   - Isso é necessário para o **healthcheck** na pipeline de deploy.

### 2. **Rodar o CI/CD no GitHub Actions**
1. Faça **push** ou **crie um PR** em **main** ou **develop**.
2. O GitHub Actions executará automaticamente a pipeline configurada:
   - **SAST** (Semgrep)
   - **SCA** (Dependency-Check + Snyk)
   - **Deploy Staging** (via Docker Compose)
   - **DAST** (ZAP + Nikto)
3. Caso as ferramentas detectem vulnerabilidades **CRITICAL/HIGH**, o pipeline falhará.
4. Notificações serão enviadas ao Slack (se configurado).

---

## Como Rodar Localmente

### 1. **Instalar o Semgrep (para SAST)**

```bash
# Instalar via pipx (recomendado)
pipx install semgrep

# Ou via pip
pip install semgrep
````

Para rodar a análise localmente, use o comando:

```bash
semgrep --config "p/ci" --config "p/secrets" --config ".semgrep.yml" --error
```

### 2. **Instalar o Dependency-Check (para SCA)**

```bash
docker run --rm -v "$PWD:/src" owasp/dependency-check:latest \
  --scan /src/src --format "HTML,JSON" --out /src/docs
```

### 3. **Rodar OWASP ZAP e Nikto (para DAST)**

Para rodar **localmente** o ZAP (baseline scan), use:

```bash
docker run --rm -t owasp/zap2docker-stable zap-baseline.py \
  -t http://localhost:8080 -a -m 10 -r zap_local.html -J zap_local.json
```

Para rodar **Nikto** localmente, use:

```bash
docker run --rm sullo/nikto -host http://localhost:8080 -output nikto.txt -Display V
```

---

## Estrutura de Diretórios

```
.github/workflows/        # Workflows do GitHub Actions (SAST, SCA, DAST)
iac/                     # Infraestrutura como código (Docker Compose para Staging)
docs/                    # Relatórios e evidências geradas
src/                     # Código fonte do projeto (exemplo demo.js/demo.py)
sonar-project.properties # Configuração opcional para SonarCloud
.semgrep.yml             # Regras customizadas do Semgrep
.semgrepignore           # Arquivos ignorados pelo Semgrep
SECURITY.md              # Política de segurança
SECURITY_POLICY.yml      # Políticas de segurança (gates)
CONSENT.md               # Consentimento para testes
CODEOWNERS               # Arquivos/funcionalidades responsáveis
```

---

## Relatórios e Notificações

1. **Relatórios de SAST**: Você pode visualizar os alertas no GitHub em **Security → Code scanning alerts**.
2. **Relatórios de SCA**: Os relatórios de **Dependency-Check** são gerados no formato **HTML** e **JSON**, disponíveis como artefatos de cada execução.
3. **Relatórios de DAST**: **ZAP** e **Nikto** geram relatórios **HTML** e **JSON**, também disponíveis como artefatos de execução.
4. **Notificação no Slack**: Caso você tenha configurado o webhook do Slack, será enviado um resumo do status da execução da pipeline.

---

## Conclusão

Este repositório oferece uma integração **completa** para garantir a segurança do código, dependências e aplicação em execução, utilizando ferramentas amplamente reconhecidas no setor de **segurança de software**. É uma ótima base para implementar práticas de **DevSecOps** em projetos que buscam garantir a segurança desde o início.

Caso tenha qualquer dúvida ou queira personalizar mais ainda, sinta-se à vontade para me chamar!

---

**Licenças e Dados**

* Código: Licença **MIT/Apache/BSD**.
* Dados: Utilize **CC0/CC BY**. Certifique-se de **anonimizar dados pessoais**.

