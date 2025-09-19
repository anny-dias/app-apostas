# SECURITY FIXES - Checklist de Correção

Este documento ajuda a tratar rapidamente os achados do Semgrep.

---

## 1️⃣ Avaliar findings

- Abrir `docs/evidence/semgrep-report.json` ou `semgrep.sarif`
- Separar por severidade: CRITICAL/ERROR / WARNING / INFO
- Documentar cada finding com referência (issue/Jira)

---

## 2️⃣ Correções recomendadas

### a) `eval()` ou `new Function()`
- Risco: execução dinâmica de código
- Correção: remover ou usar parsing seguro / whitelist
```javascript
// PERIGOSO
eval(userCode);

// SEGURO
function safeEval(code) {
  if(/^[0-9+\-*/\s]+$/.test(code)) {
    return Function('"use strict"; return (' + code + ')')();
  }
}

// PERIGOSO
element.innerHTML = userInput;

// SEGURO
element.textContent = userInput;

import os
DEBUG = os.getenv("DEBUG", "False") == "True"

import os
AWS_KEY = os.getenv("AWS_KEY")
